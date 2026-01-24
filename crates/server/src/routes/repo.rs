use axum::{
    Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json as ResponseJson,
    routing::{get, post, put},
};
use db::models::{
    project::SearchResult,
    repo::{Repo, UpdateRepo},
};
use deployment::Deployment;
use serde::{Deserialize, Serialize};
use services::services::{file_search::SearchQuery, git::GitBranch, repo_validator::{RepoPathValidator, ValidationResult}};
use std::path::PathBuf;
use ts_rs::TS;
use utils::response::ApiResponse;
use uuid::Uuid;

use crate::{
    DeploymentImpl,
    error::ApiError,
    routes::projects::{OpenEditorRequest, OpenEditorResponse},
};

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct RegisterRepoRequest {
    pub path: String,
    pub display_name: Option<String>,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct InitRepoRequest {
    pub parent_path: String,
    pub folder_name: String,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct BatchRepoRequest {
    pub ids: Vec<Uuid>,
}

pub async fn register_repo(
    State(deployment): State<DeploymentImpl>,
    ResponseJson(payload): ResponseJson<RegisterRepoRequest>,
) -> Result<ResponseJson<ApiResponse<Repo>>, ApiError> {
    let repo = deployment
        .repo()
        .register(
            &deployment.db().pool,
            &payload.path,
            payload.display_name.as_deref(),
        )
        .await?;

    Ok(ResponseJson(ApiResponse::success(repo)))
}

pub async fn init_repo(
    State(deployment): State<DeploymentImpl>,
    ResponseJson(payload): ResponseJson<InitRepoRequest>,
) -> Result<ResponseJson<ApiResponse<Repo>>, ApiError> {
    let repo = deployment
        .repo()
        .init_repo(
            &deployment.db().pool,
            deployment.git(),
            &payload.parent_path,
            &payload.folder_name,
        )
        .await?;

    Ok(ResponseJson(ApiResponse::success(repo)))
}

pub async fn get_repo_branches(
    State(deployment): State<DeploymentImpl>,
    Path(repo_id): Path<Uuid>,
) -> Result<ResponseJson<ApiResponse<Vec<GitBranch>>>, ApiError> {
    let repo = deployment
        .repo()
        .get_by_id(&deployment.db().pool, repo_id)
        .await?;

    let branches = deployment.git().get_all_branches(&repo.path)?;
    Ok(ResponseJson(ApiResponse::success(branches)))
}

pub async fn get_repos_batch(
    State(deployment): State<DeploymentImpl>,
    ResponseJson(payload): ResponseJson<BatchRepoRequest>,
) -> Result<ResponseJson<ApiResponse<Vec<Repo>>>, ApiError> {
    let repos = Repo::find_by_ids(&deployment.db().pool, &payload.ids).await?;
    Ok(ResponseJson(ApiResponse::success(repos)))
}

pub async fn get_repos(
    State(deployment): State<DeploymentImpl>,
) -> Result<ResponseJson<ApiResponse<Vec<Repo>>>, ApiError> {
    let repos = Repo::list_all(&deployment.db().pool).await?;
    Ok(ResponseJson(ApiResponse::success(repos)))
}

pub async fn get_repo(
    State(deployment): State<DeploymentImpl>,
    Path(repo_id): Path<Uuid>,
) -> Result<ResponseJson<ApiResponse<Repo>>, ApiError> {
    let repo = deployment
        .repo()
        .get_by_id(&deployment.db().pool, repo_id)
        .await?;
    Ok(ResponseJson(ApiResponse::success(repo)))
}

pub async fn update_repo(
    State(deployment): State<DeploymentImpl>,
    Path(repo_id): Path<Uuid>,
    ResponseJson(payload): ResponseJson<UpdateRepo>,
) -> Result<ResponseJson<ApiResponse<Repo>>, ApiError> {
    let repo = Repo::update(&deployment.db().pool, repo_id, &payload).await?;
    Ok(ResponseJson(ApiResponse::success(repo)))
}

pub async fn open_repo_in_editor(
    State(deployment): State<DeploymentImpl>,
    Path(repo_id): Path<Uuid>,
    ResponseJson(payload): ResponseJson<Option<OpenEditorRequest>>,
) -> Result<ResponseJson<ApiResponse<OpenEditorResponse>>, ApiError> {
    let repo = deployment
        .repo()
        .get_by_id(&deployment.db().pool, repo_id)
        .await?;

    let editor_config = {
        let config = deployment.config().read().await;
        let editor_type_str = payload.as_ref().and_then(|req| req.editor_type.as_deref());
        config.editor.with_override(editor_type_str)
    };

    match editor_config.open_file(&repo.path).await {
        Ok(url) => {
            tracing::info!(
                "Opened editor for repo {} at path: {}{}",
                repo_id,
                repo.path.to_string_lossy(),
                if url.is_some() { " (remote mode)" } else { "" }
            );

            deployment
                .track_if_analytics_allowed(
                    "repo_editor_opened",
                    serde_json::json!({
                        "repo_id": repo_id.to_string(),
                        "editor_type": payload.as_ref().and_then(|req| req.editor_type.as_ref()),
                        "remote_mode": url.is_some(),
                    }),
                )
                .await;

            Ok(ResponseJson(ApiResponse::success(OpenEditorResponse {
                url,
            })))
        }
        Err(e) => {
            tracing::error!("Failed to open editor for repo {}: {:?}", repo_id, e);
            Err(ApiError::EditorOpen(e))
        }
    }
}

pub async fn search_repo(
    State(deployment): State<DeploymentImpl>,
    Path(repo_id): Path<Uuid>,
    Query(search_query): Query<SearchQuery>,
) -> Result<ResponseJson<ApiResponse<Vec<SearchResult>>>, StatusCode> {
    if search_query.q.trim().is_empty() {
        return Ok(ResponseJson(ApiResponse::error(
            "Query parameter 'q' is required and cannot be empty",
        )));
    }

    let repo = match deployment
        .repo()
        .get_by_id(&deployment.db().pool, repo_id)
        .await
    {
        Ok(repo) => repo,
        Err(e) => {
            tracing::error!("Failed to get repo {}: {}", repo_id, e);
            return Err(StatusCode::NOT_FOUND);
        }
    };

    match deployment
        .file_search_cache()
        .search_repo(&repo.path, &search_query.q, search_query.mode)
        .await
    {
        Ok(results) => Ok(ResponseJson(ApiResponse::success(results))),
        Err(e) => {
            tracing::error!("Failed to search files in repo {}: {}", repo_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// ===== Repository Path Validation and Fixing =====

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct FixRepoPathRequest {
    pub new_path: String,
}

#[derive(Debug, Serialize, TS)]
#[ts(export)]
pub struct RepoValidationInfo {
    pub repo_id: Uuid,
    pub repo_name: String,
    pub path: String,
    pub valid: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, TS)]
#[ts(export)]
pub struct FixRepoPathResponse {
    pub success: bool,
    pub message: String,
}

impl From<services::services::repo_validator::RepoValidationInfo> for RepoValidationInfo {
    fn from(info: services::services::repo_validator::RepoValidationInfo) -> Self {
        Self {
            repo_id: info.repo_id,
            repo_name: info.repo_name,
            path: info.path,
            valid: info.valid,
            error: info.error,
        }
    }
}

/// Validate all repository paths
pub async fn validate_all_repos(
    State(deployment): State<DeploymentImpl>,
) -> Result<ResponseJson<ApiResponse<Vec<RepoValidationInfo>>>, ApiError> {
    let validator = RepoPathValidator::new();
    let results = validator
        .validate_all_repos(&deployment.db().pool)
        .await
        .map_err(|e| ApiError::BadRequest(format!("Failed to validate repositories: {}", e)))?;

    let results: Vec<RepoValidationInfo> = results.into_iter().map(Into::into).collect();

    Ok(ResponseJson(ApiResponse::success(results)))
}

/// Fix a repository path
pub async fn fix_repo_path(
    State(deployment): State<DeploymentImpl>,
    Path(repo_id): Path<Uuid>,
    ResponseJson(req): ResponseJson<FixRepoPathRequest>,
) -> Result<ResponseJson<ApiResponse<FixRepoPathResponse>>, ApiError> {
    let new_path = PathBuf::from(&req.new_path);

    // Validate the new path
    let validator = RepoPathValidator::new();
    let validation_result = validator
        .validate_repo(&new_path, None)
        .await
        .map_err(|e| ApiError::BadRequest(format!("Failed to validate path: {}", e)))?;

    match validation_result {
        ValidationResult::Valid => {
            // Update the repository path in database
            validator
                .fix_repo_path(&deployment.db().pool, repo_id, &new_path)
                .await
                .map_err(|e| ApiError::BadRequest(format!("Failed to update path: {}", e)))?;

            Ok(ResponseJson(ApiResponse::success(FixRepoPathResponse {
                success: true,
                message: "Repository path updated successfully".to_string(),
            })))
        }
        ValidationResult::PathNotFound => Err(ApiError::BadRequest(
            "Path does not exist".to_string(),
        )),
        ValidationResult::NotADirectory => Err(ApiError::BadRequest(
            "Path is not a directory".to_string(),
        )),
        ValidationResult::NotAGitRepo => Err(ApiError::BadRequest(
            "Path is not a git repository".to_string(),
        )),
        ValidationResult::UrlMismatch { expected, current } => Err(ApiError::BadRequest(format!(
            "Git remote URL mismatch. Expected: {}, Current: {}",
            expected, current
        ))),
    }
}

pub fn router() -> Router<DeploymentImpl> {
    Router::new()
        .route("/repos", get(get_repos).post(register_repo))
        .route("/repos/init", post(init_repo))
        .route("/repos/batch", post(get_repos_batch))
        .route("/repos/validate-all", post(validate_all_repos))
        .route("/repos/{repo_id}", get(get_repo).put(update_repo))
        .route("/repos/{repo_id}/branches", get(get_repo_branches))
        .route("/repos/{repo_id}/search", get(search_repo))
        .route("/repos/{repo_id}/open-editor", post(open_repo_in_editor))
        .route("/repos/{repo_id}/fix-path", put(fix_repo_path))
}
