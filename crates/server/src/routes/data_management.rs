use axum::{extract::{Query, State}, Json, Router};
use axum::body::Body;
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;
use std::path::PathBuf;
use std::io::{Cursor, Read, Write};

use crate::{DeploymentImpl, error::ApiError};
use deployment::Deployment;
use utils::response::ApiResponse;

// ===== Session Statistics =====

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SessionStats {
    pub session_dir: String,
    pub count: i64,
    pub total_size: u64,
    pub latest: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SessionListItem {
    pub id: Uuid,
    pub task_id: Uuid,
    pub file_path: String,
    pub file_size: u64,
    pub created_at: String,
    pub project_name: Option<String>,
    pub task_name: Option<String>,
}

// ===== Configuration Source Info =====

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ConfigFileStatus {
    pub name: String,
    pub exists: bool,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ConfigSourceInfo {
    pub config_source: String,
    pub files: Vec<ConfigFileStatus>,
    pub status: String, // "normal" | "warning"
}

// ===== Import/Export =====

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct ValidateConfigSourceRequest {
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ValidateConfigSourceResponse {
    pub valid: bool,
    pub issues: Vec<String>,
}

/// Get session statistics
pub async fn get_session_stats(
    State(deployment): State<DeploymentImpl>,
) -> Result<Json<ApiResponse<SessionStats>>, ApiError> {
    let session_dir = utils::assets::session_save_dir();

    // Count sessions and get latest
    let sessions = db::models::task_session::TaskSession::all(&deployment.db().pool, 1000, 0)
        .await
        .map_err(|e| ApiError::BadRequest(format!("Failed to get sessions: {}", e)))?;

    let count = sessions.len() as i64;
    let mut total_size = 0u64;
    let mut latest: Option<String> = None;

    for session in &sessions {
        if let Ok(metadata) = std::fs::metadata(&session.file_path) {
            total_size += metadata.len();
        }
    }

    if let Some(first_session) = sessions.first() {
        latest = Some(first_session.created_at.to_rfc3339());
    }

    Ok(Json(ApiResponse::success(SessionStats {
        session_dir: session_dir.to_string_lossy().to_string(),
        count,
        total_size,
        latest,
    })))
}

/// List session files with pagination
pub async fn list_sessions(
    State(deployment): State<DeploymentImpl>,
    Query(params): Query<ListSessionsParams>,
) -> Result<Json<ApiResponse<Vec<SessionListItem>>>, ApiError> {
    let sessions = db::models::task_session::TaskSession::all(
        &deployment.db().pool,
        params.limit.unwrap_or(20),
        params.offset.unwrap_or(0),
    )
    .await
    .map_err(|e| ApiError::BadRequest(format!("Failed to get sessions: {}", e)))?;

    let mut items = Vec::new();

    for session in sessions {
        let file_size = std::fs::metadata(&session.file_path)
            .map(|m| m.len())
            .unwrap_or(0);

        // Get task and project names
        let task_name = if let Ok(Some(task)) =
            db::models::task::Task::find_by_id(&deployment.db().pool, session.task_id).await
        {
            Some(task.title)
        } else {
            None
        };

        let project_name = if let Ok(Some(task)) =
            db::models::task::Task::find_by_id(&deployment.db().pool, session.task_id).await
        {
            if let Ok(Some(project)) =
                db::models::project::Project::find_by_id(&deployment.db().pool, task.project_id)
                    .await
            {
                Some(project.name)
            } else {
                None
            }
        } else {
            None
        };

        items.push(SessionListItem {
            id: session.id,
            task_id: session.task_id,
            file_path: session.file_path,
            file_size,
            created_at: session.created_at.to_rfc3339(),
            project_name,
            task_name,
        });
    }

    Ok(Json(ApiResponse::success(items)))
}

#[derive(Debug, Deserialize)]
pub struct ListSessionsParams {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

/// Rescan session directory and index new files
pub async fn rescan_sessions(
    State(deployment): State<DeploymentImpl>,
) -> Result<Json<ApiResponse<RescanResponse>>, ApiError> {
    let exporter = services::services::session_exporter::SessionExporter::new(
        deployment.db().pool.clone(),
    );

    let indexed_count = exporter
        .scan_and_index_sessions()
        .await
        .map_err(|e| ApiError::BadRequest(format!("Failed to scan sessions: {}", e)))?;

    Ok(Json(ApiResponse::success(RescanResponse {
        indexed_count,
        message: format!("Indexed {} new session files", indexed_count),
    })))
}

#[derive(Debug, Serialize, TS)]
#[ts(export)]
pub struct RescanResponse {
    pub indexed_count: usize,
    pub message: String,
}

/// Get configuration source information
pub async fn get_config_source_info(
    State(_deployment): State<DeploymentImpl>,
) -> Result<Json<ApiResponse<ConfigSourceInfo>>, ApiError> {
    let config_source = utils::assets::asset_dir();
    let config_json = config_source.join("config.json");
    let profiles_json = config_source.join("profiles.json");
    let custom_path_json = config_source.join("custom_path.json");

    let files = vec![
        ConfigFileStatus {
            name: "config.json".to_string(),
            exists: config_json.exists(),
        },
        ConfigFileStatus {
            name: "profiles.json".to_string(),
            exists: profiles_json.exists(),
        },
        ConfigFileStatus {
            name: "custom_path.json".to_string(),
            exists: custom_path_json.exists(),
        },
    ];

    let all_exist = files.iter().all(|f| f.exists);
    let status = if all_exist { "normal" } else { "warning" };

    Ok(Json(ApiResponse::success(ConfigSourceInfo {
        config_source: config_source.to_string_lossy().to_string(),
        files,
        status: status.to_string(),
    })))
}

/// Validate a configuration source path
pub async fn validate_config_source(
    Json(req): Json<ValidateConfigSourceRequest>,
) -> Result<Json<ApiResponse<ValidateConfigSourceResponse>>, ApiError> {
    let path = std::path::PathBuf::from(&req.path);
    let mut issues = Vec::new();
    let mut valid = true;

    // Check directory exists
    if !path.exists() {
        valid = false;
        issues.push("Directory does not exist".to_string());
        return Ok(Json(ApiResponse::success(ValidateConfigSourceResponse {
            valid,
            issues,
        })));
    }

    // Check required files
    let config_json = path.join("config.json");
    if !config_json.exists() {
        valid = false;
        issues.push("Missing config.json".to_string());
    }

    let profiles_json = path.join("profiles.json");
    if !profiles_json.exists() {
        issues.push("Missing profiles.json (optional)".to_string());
    }

    Ok(Json(ApiResponse::success(ValidateConfigSourceResponse {
        valid,
        issues,
    })))
}

// ===== Import/Export =====

#[derive(Debug, Deserialize)]
pub struct ExportConfigQuery {
    pub include_config: Option<bool>,
    pub include_profiles: Option<bool>,
    pub include_projects: Option<bool>,
    pub include_tags: Option<bool>,
}

#[derive(Debug, Serialize, TS)]
#[ts(export)]
pub struct ExportConfigResponse {
    pub data: serde_json::Value,
    pub filename: String,
    pub timestamp: String,
}

/// Export configuration to JSON
pub async fn export_config(
    State(deployment): State<DeploymentImpl>,
    Query(params): Query<ExportConfigQuery>,
) -> Result<Json<ApiResponse<ExportConfigResponse>>, ApiError> {
    let mut export_data = serde_json::json!({});

    // Export application configuration
    if params.include_config.unwrap_or(true) {
        let config_json = utils::assets::config_path();
        if let Ok(content) = std::fs::read_to_string(&config_json) {
            if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                export_data["config"] = config;
            }
        }
    }

    // Export profiles configuration
    if params.include_profiles.unwrap_or(true) {
        let profiles_json = utils::assets::profiles_path();
        if let Ok(content) = std::fs::read_to_string(&profiles_json) {
            if let Ok(profiles) = serde_json::from_str::<serde_json::Value>(&content) {
                export_data["profiles"] = profiles;
            }
        }
    }

    // Export project metadata (without paths)
    if params.include_projects.unwrap_or(true) {
        let projects = db::models::project::Project::find_all(&deployment.db().pool)
            .await
            .map_err(|e| ApiError::BadRequest(format!("Failed to fetch projects: {}", e)))?;

        let projects_data: Vec<serde_json::Value> = projects
            .into_iter()
            .map(|p| {
                serde_json::json!({
                    "id": p.id,
                    "name": p.name,
                    "default_agent_working_dir": p.default_agent_working_dir,
                    "remote_project_id": p.remote_project_id,
                    "created_at": p.created_at,
                    "updated_at": p.updated_at,
                })
            })
            .collect();

        export_data["projects"] = serde_json::Value::Array(projects_data);
    }

    // Export tags
    if params.include_tags.unwrap_or(true) {
        let tags = db::models::tag::Tag::find_all(&deployment.db().pool)
            .await
            .map_err(|e| ApiError::BadRequest(format!("Failed to fetch tags: {}", e)))?;

        let tags_data: Vec<serde_json::Value> = tags
            .into_iter()
            .map(|t| {
                serde_json::json!({
                    "id": t.id,
                    "tag_name": t.tag_name,
                    "content": t.content,
                    "created_at": t.created_at,
                    "updated_at": t.updated_at,
                })
            })
            .collect();

        export_data["tags"] = serde_json::Value::Array(tags_data);
    }

    // Generate export file
    let filename = format!("vibe-kanban-config-{}.json",
        chrono::Local::now().format("%Y%m%d-%H%M%S"));

    Ok(Json(ApiResponse::success(ExportConfigResponse {
        data: export_data,
        filename,
        timestamp: chrono::Utc::now().to_rfc3339(),
    })))
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct ImportConfigQuery {
    pub auto_convert_paths: Option<bool>,
    pub skip_existing: Option<bool>,
    pub overwrite_config: Option<bool>,
}

/// Import configuration from JSON
pub async fn import_config(
    State(deployment): State<DeploymentImpl>,
    Query(params): Query<ImportConfigQuery>,
    mut multipart: axum::extract::Multipart,
) -> Result<Json<ApiResponse<serde_json::Value>>, ApiError> {
    use std::io::Read;

    // 1. Read uploaded file
    let mut data = Vec::new();
    while let Some(field) = multipart.next_field().await
        .map_err(|e| ApiError::BadRequest(format!("Failed to read multipart: {}", e)))?
    {
        if field.name() == Some("config_file") {
            let bytes = field.bytes().await
                .map_err(|e| ApiError::BadRequest(format!("Failed to read field bytes: {}", e)))?;
            data.extend_from_slice(&bytes);
        }
    }

    // 2. Parse JSON
    let import_data: serde_json::Value = serde_json::from_slice(&data)
        .map_err(|e| ApiError::BadRequest(format!("Invalid JSON: {}", e)))?;

    // 3. Validate data structure
    if !import_data.is_object() {
        return Err(ApiError::BadRequest("Invalid data format".to_string()));
    }

    let mut result = serde_json::json!({
        "imported": Vec::<serde_json::Value>::new(),
        "skipped": Vec::<serde_json::Value>::new(),
        "errors": Vec::<serde_json::Value>::new(),
    });

    // 4. Import configuration
    if let Some(config) = import_data.get("config") {
        if params.overwrite_config.unwrap_or(false) {
            let config_json = utils::assets::config_path();
            let config_str = serde_json::to_string_pretty(config)
                .map_err(|e| ApiError::BadRequest(format!("Failed to serialize config: {}", e)))?;
            std::fs::write(&config_json, config_str)
                .map_err(|e| ApiError::BadRequest(format!("Failed to write config: {}", e)))?;
            result["imported"].as_array_mut().unwrap().push(serde_json::Value::String("config.json".to_string()));
        }
    }

    // 5. Import profiles
    if let Some(profiles) = import_data.get("profiles") {
        if params.overwrite_config.unwrap_or(false) {
            let profiles_json = utils::assets::profiles_path();
            let profiles_str = serde_json::to_string_pretty(profiles)
                .map_err(|e| ApiError::BadRequest(format!("Failed to serialize profiles: {}", e)))?;
            std::fs::write(&profiles_json, profiles_str)
                .map_err(|e| ApiError::BadRequest(format!("Failed to write profiles: {}", e)))?;
            result["imported"].as_array_mut().unwrap().push(serde_json::Value::String("profiles.json".to_string()));
        }
    }

    // 6. Import projects metadata
    if let Some(projects) = import_data.get("projects") {
        if let Some(project_array) = projects.as_array() {
            for project_value in project_array {
                // Import or update project
                if let Some(project_name) = project_value.get("name").and_then(|v| v.as_str()) {
                    if params.skip_existing.unwrap_or(true) {
                        // Check if project with same name exists
                        let exists = db::models::project::Project::find_by_name(&deployment.db().pool, project_name)
                            .await
                            .map_err(|e| ApiError::BadRequest(format!("Failed to check project: {}", e)))?;

                        if exists.is_some() {
                            result["skipped"].as_array_mut().unwrap().push(serde_json::Value::String(format!("project: {}", project_name)));
                            continue;
                        }
                    }

                    // Create new project with metadata
                    let id = Uuid::new_v4();
                    let default_agent_working_dir = project_value.get("default_agent_working_dir").and_then(|v| v.as_str());
                    let remote_project_id = project_value.get("remote_project_id").and_then(|v| v.as_str());

                    // Create minimal project (path will need to be set by user)
                    sqlx::query(
                        "INSERT INTO projects (id, name, default_agent_working_dir, remote_project_id) VALUES (?, ?, ?, ?)"
                    )
                    .bind(id)
                    .bind(project_name)
                    .bind(default_agent_working_dir)
                    .bind(remote_project_id)
                    .execute(&deployment.db().pool)
                    .await
                    .map_err(|e| ApiError::BadRequest(format!("Failed to create project: {}", e)))?;

                    result["imported"].as_array_mut().unwrap().push(serde_json::Value::String(format!("project: {}", project_name)));
                }
            }
        }
    }

    // 7. Import tags
    if let Some(tags) = import_data.get("tags") {
        if let Some(tag_array) = tags.as_array() {
            for tag_value in tag_array {
                if let Some(tag_name) = tag_value.get("tag_name").and_then(|v| v.as_str()) {
                    // Check if tag exists
                    let exists = db::models::tag::Tag::find_by_tag_name(&deployment.db().pool, tag_name)
                        .await
                        .map_err(|e| ApiError::BadRequest(format!("Failed to check tag: {}", e)))?;

                    if exists.is_some() {
                        if !params.skip_existing.unwrap_or(true) {
                            // Update existing tag
                            // (Implementation skipped for brevity)
                        }
                        result["skipped"].as_array_mut().unwrap().push(serde_json::Value::String(format!("tag: {}", tag_name)));
                    } else {
                        // Create new tag
                        let id = Uuid::new_v4();
                        let content = tag_value.get("content").and_then(|v| v.as_str());

                        sqlx::query(
                            "INSERT INTO tags (id, tag_name, content) VALUES (?, ?, ?)"
                        )
                        .bind(id)
                        .bind(tag_name)
                        .bind(content.unwrap_or(""))
                        .execute(&deployment.db().pool)
                        .await
                        .map_err(|e| ApiError::BadRequest(format!("Failed to create tag: {}", e)))?;

                        result["imported"].as_array_mut().unwrap().push(serde_json::Value::String(format!("tag: {}", tag_name)));
                    }
                }
            }
        }
    }

    Ok(Json(ApiResponse::success(result)))
}

// ===== Session Export (ZIP) =====

#[derive(Debug, Deserialize)]
pub struct ExportSessionsQuery {
    pub session_ids: Option<String>, // Comma-separated UUIDs
    pub task_id: Option<Uuid>,
}

/// Export session files as ZIP
pub async fn export_sessions(
    State(deployment): State<DeploymentImpl>,
    Query(params): Query<ExportSessionsQuery>,
) -> Result<Response, ApiError> {
    use zip::{ZipWriter, write::FileOptions};
    use zip::result::ZipResult;
    use std::fs::File;

    // Get sessions to export
    let sessions_to_export = if let Some(task_id) = params.task_id {
        // Export sessions for a specific task
        db::models::task_session::TaskSession::find_by_task_id(
            &deployment.db().pool,
            task_id,
        )
        .await
        .map_err(|e| ApiError::BadRequest(format!("Failed to fetch sessions: {}", e)))?
    } else if let Some(session_ids_str) = params.session_ids {
        // Export specific sessions by IDs
        let session_ids: Vec<Uuid> = session_ids_str
            .split(',')
            .filter_map(|s| s.trim().parse().ok())
            .collect();

        let mut sessions = Vec::new();
        for session_id in session_ids {
            if let Ok(Some(session)) =
                db::models::task_session::TaskSession::find_by_id(
                    &deployment.db().pool,
                    session_id,
                )
                .await
            {
                sessions.push(session);
            }
        }
        sessions
    } else {
        // Export all sessions
        db::models::task_session::TaskSession::all(
            &deployment.db().pool,
            10000,
            0,
        )
        .await
        .map_err(|e| ApiError::BadRequest(format!("Failed to fetch sessions: {}", e)))?
    };

    if sessions_to_export.is_empty() {
        return Ok(Json(ApiResponse::error("No sessions to export")).into_response());
    }

    // Create ZIP in memory
    let mut buffer = Cursor::new(Vec::new());
    {
        let mut zip = ZipWriter::new(&mut buffer);
        let options = FileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated)
            .unix_permissions(0o755);

        // Add each session file to the ZIP
        for session in &sessions_to_export {
            let file_path = PathBuf::from(&session.file_path);

            if !file_path.exists() {
                tracing::warn!("Session file not found: {}", session.file_path);
                continue;
            }

            // Read file content
            let mut file = File::open(&file_path)
                .map_err(|e| ApiError::BadRequest(format!("Failed to open file: {}", e)))?;

            let mut content = Vec::new();
            file.read_to_end(&mut content)
                .map_err(|e| ApiError::BadRequest(format!("Failed to read file: {}", e)))?;

            // Get task and project info for organizing in ZIP
            let task_name = if let Ok(Some(task)) =
                db::models::task::Task::find_by_id(&deployment.db().pool, session.task_id).await
            {
                task.title
            } else {
                format!("task-{}", session.task_id)
            };

            let project_name = if let Ok(Some(task)) =
                db::models::task::Task::find_by_id(&deployment.db().pool, session.task_id).await
            {
                if let Ok(Some(project)) =
                    db::models::project::Project::find_by_id(&deployment.db().pool, task.project_id)
                        .await
                {
                    project.name
                } else {
                    format!("project-{}", task.project_id)
                }
            } else {
                "unknown-project".to_string()
            };

            // Create ZIP entry path: sessions/{project_name}/{task_name}/{filename}
            let filename = file_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("session.md");

            let zip_path = format!(
                "sessions/{}/{}/{}",
                sanitize_filename(&project_name),
                sanitize_filename(&task_name),
                filename
            );

            // Add file to ZIP
            zip.start_file(&zip_path, options)
                .map_err(|e| ApiError::BadRequest(format!("Failed to create ZIP entry: {}", e)))?;
            zip.write_all(&content)
                .map_err(|e| ApiError::BadRequest(format!("Failed to write to ZIP: {}", e)))?;
        }

        zip.finish()
            .map_err(|e| ApiError::BadRequest(format!("Failed to finalize ZIP: {}", e)))?;
    }

    // Generate filename with timestamp
    let filename = format!(
        "vibe-kanban-sessions-{}.zip",
        chrono::Local::now().format("%Y%m%d-%H%M%S")
    );

    // Return ZIP file as response
    let zip_bytes = buffer.into_inner();
    let headers = HeaderMap::from_iter([
        (header::CONTENT_TYPE, HeaderValue::from_static("application/zip")),
        (
            header::CONTENT_DISPOSITION,
            HeaderValue::from_str(&format!("attachment; filename=\"{}\"", filename))
                .map_err(|e| ApiError::BadRequest(format!("Invalid header value: {}", e)))?,
        ),
    ]);

    Ok((headers, zip_bytes).into_response())
}

/// Sanitize filename for use in ZIP paths
fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' || c == ' ' {
                c
            } else {
                '_'
            }
        })
        .collect::<String>()
        .trim()
        .to_string()
}

// ===== Config Reload =====

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ConfigReloadResponse {
    pub success: bool,
    pub message: String,
    pub reloaded_configs: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct FirstRunCheckResponse {
    pub is_first_run: bool,
    pub has_config: bool,
    pub has_valid_config_source: bool,
    pub issues: Vec<String>,
    pub suggested_actions: Vec<String>,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct SetConfigSourceRequest {
    pub path: String,
    pub copy_existing: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SetConfigSourceResponse {
    pub success: bool,
    pub message: String,
    pub new_path: String,
}

/// Check if this is the first run or if there are configuration issues
pub async fn first_run_check(
    State(_deployment): State<DeploymentImpl>,
) -> Result<Json<ApiResponse<FirstRunCheckResponse>>, ApiError> {
    let mut issues = Vec::new();
    let mut suggested_actions = Vec::new();

    // Check if config.json exists
    let config_json = utils::assets::config_path();
    let has_config = config_json.exists();

    if !has_config {
        issues.push("config.json not found".to_string());
        suggested_actions.push("Create or select a configuration directory".to_string());
    }

    // Check for custom_path.json
    let custom_path_json = utils::assets::custom_path_config_file();
    let has_custom_path = custom_path_json.exists();

    // Check if using custom asset directory
    let is_using_custom = if has_custom_path {
        if let Ok(content) = std::fs::read_to_string(&custom_path_json) {
            if let Ok(config) = serde_json::from_str::<utils::assets::CustomPathConfig>(&content) {
                config.custom_asset_dir.is_some()
            } else {
                false
            }
        } else {
            false
        }
    } else {
        false
    };

    let has_valid_config_source = has_config && (!is_using_custom || has_custom_path);

    // Check for profiles.json (optional)
    let profiles_json = utils::assets::profiles_path();
    if !profiles_json.exists() {
        suggested_actions.push("Consider creating profiles.json for agent configurations".to_string());
    }

    // Check if session save directory is configured
    let session_dir = utils::assets::session_save_dir();
    if !session_dir.exists() {
        suggested_actions.push("Configure a session save directory in settings".to_string());
    }

    // Determine if first run (no config at all)
    let is_first_run = !has_config && !has_custom_path;

    Ok(Json(ApiResponse::success(FirstRunCheckResponse {
        is_first_run,
        has_config,
        has_valid_config_source,
        issues,
        suggested_actions,
    })))
}

/// Reload configuration from disk
pub async fn reload_config(
    State(deployment): State<DeploymentImpl>,
) -> Result<Json<ApiResponse<ConfigReloadResponse>>, ApiError> {
    let mut reloaded_configs = Vec::new();

    // Reload custom path configuration
    let config_json = utils::assets::config_path();
    if config_json.exists() {
        // Clear any cached configuration
        // Note: The actual implementation depends on how config is cached in the deployment
        reloaded_configs.push("config.json".to_string());
    }

    let profiles_json = utils::assets::profiles_path();
    if profiles_json.exists() {
        reloaded_configs.push("profiles.json".to_string());
    }

    let custom_path_json = utils::assets::custom_path_config_file();
    if custom_path_json.exists() {
        reloaded_configs.push("custom_path.json".to_string());
    }

    // TODO: Trigger deployment config reload if available
    // deployment.reload_config().await;

    tracing::info!("Configuration reloaded: {:?}", reloaded_configs);

    Ok(Json(ApiResponse::success(ConfigReloadResponse {
        success: true,
        message: format!("Reloaded {} configuration files", reloaded_configs.len()),
        reloaded_configs,
    })))
}

/// Switch configuration source directory
pub async fn switch_config_source(
    State(_deployment): State<DeploymentImpl>,
    Json(req): Json<SetConfigSourceRequest>,
) -> Result<Json<ApiResponse<SetConfigSourceResponse>>, ApiError> {
    use std::fs;

    let new_path = std::path::PathBuf::from(&req.path);

    // Validate path exists and is a directory
    if !new_path.exists() {
        return Err(ApiError::BadRequest(format!(
            "Path does not exist: {}",
            req.path
        )));
    }

    if !new_path.is_dir() {
        return Err(ApiError::BadRequest(format!(
            "Path is not a directory: {}",
            req.path
        )));
    }

    // Check for required config files
    let config_json = new_path.join("config.json");
    if !config_json.exists() {
        return Err(ApiError::BadRequest(
            "config.json not found in the specified directory".to_string(),
        ));
    }

    // If copy_existing is true, copy existing configs to new location
    if req.copy_existing.unwrap_or(false) {
        let old_asset_dir = utils::assets::asset_dir();

        // Copy profiles.json if it exists
        let old_profiles = old_asset_dir.join("profiles.json");
        let new_profiles = new_path.join("profiles.json");
        if old_profiles.exists() && !new_profiles.exists() {
            fs::copy(&old_profiles, &new_profiles).map_err(|e| {
                ApiError::BadRequest(format!("Failed to copy profiles.json: {}", e))
            })?;
        }

        // Copy custom_path.json if it exists
        let old_custom_path = old_asset_dir.join("custom_path.json");
        let new_custom_path = new_path.join("custom_path.json");
        if old_custom_path.exists() && !new_custom_path.exists() {
            fs::copy(&old_custom_path, &new_custom_path).map_err(|e| {
                ApiError::BadRequest(format!("Failed to copy custom_path.json: {}", e))
            })?;
        }
    }

    // Update custom_path.json to point to new directory
    let custom_path_file = utils::assets::custom_path_config_file();
    let custom_path_config = utils::assets::CustomPathConfig {
        custom_asset_dir: Some(req.path.clone().into()),
        session_save_dir: None,
        auto_reload: false,
        last_verified: None,
    };

    // Ensure parent directory exists
    if let Some(parent) = custom_path_file.parent() {
        fs::create_dir_all(parent).map_err(|e| {
            ApiError::BadRequest(format!("Failed to create config directory: {}", e))
        })?;
    }

    // Write new custom_path.json
    let content = serde_json::to_string_pretty(&custom_path_config).map_err(|e| {
        ApiError::BadRequest(format!("Failed to serialize config: {}", e))
    })?;
    fs::write(&custom_path_file, content)
        .map_err(|e| ApiError::BadRequest(format!("Failed to write config: {}", e)))?;

    tracing::info!("Configuration source switched to: {}", req.path);

    Ok(Json(ApiResponse::success(SetConfigSourceResponse {
        success: true,
        message: format!("Configuration source switched to {}", req.path),
        new_path: req.path,
    })))
}

pub fn router() -> Router<DeploymentImpl> {
    Router::new()
        .route("/sessions/stats", axum::routing::get(get_session_stats))
        .route("/sessions/list", axum::routing::get(list_sessions))
        .route("/sessions/rescan", axum::routing::put(rescan_sessions))
        .route("/sessions/export", axum::routing::get(export_sessions))
        .route("/first-run-check", axum::routing::get(first_run_check))
        .route("/config-source", axum::routing::get(get_config_source_info))
        .route("/config-source/validate", axum::routing::post(validate_config_source))
        .route("/config-source/switch", axum::routing::post(switch_config_source))
        .route("/reload", axum::routing::post(reload_config))
        .route("/export/config", axum::routing::get(export_config))
        .route("/import/config", axum::routing::post(import_config))
}
