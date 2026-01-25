use std::path::{Path, PathBuf};
use std::process::Command;

use db::models::repo::Repo as RepoModel;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use thiserror::Error;
use ts_rs::TS;
use uuid::Uuid;

use crate::services::repo::{RepoError, RepoService};

/// Validation result for a repository path
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum ValidationResult {
    /// Path is valid
    Valid,
    /// Path does not exist
    PathNotFound,
    /// Path is not a directory
    NotADirectory,
    /// Path is not a git repository
    NotAGitRepo,
    /// Git remote URL mismatch
    UrlMismatch {
        expected: String,
        current: String,
    },
}

/// Repository validation information
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct RepoValidationInfo {
    pub repo_id: Uuid,
    pub repo_name: String,
    pub path: String,
    pub valid: bool,
    pub error: Option<String>,
}

#[derive(Debug, Error)]
pub enum ValidationError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Repo(#[from] RepoError),
    #[error("Git command failed: {0}")]
    GitFailed(String),
}

pub type Result<T> = std::result::Result<T, ValidationError>;

/// Repository path validator
///
/// Provides detailed validation of repository paths including:
/// - Path existence and type checking
/// - Git repository validation
/// - Remote URL verification
pub struct RepoPathValidator {
    repo_service: RepoService,
}

impl RepoPathValidator {
    pub fn new() -> Self {
        Self {
            repo_service: RepoService::new(),
        }
    }

    /// Validate a repository path
    ///
    /// # Arguments
    /// * `path` - The path to validate
    /// * `expected_url` - Optional expected git remote URL for verification
    ///
    /// # Returns
    /// `ValidationResult` indicating the validation status
    pub async fn validate_repo(
        &self,
        path: &Path,
        expected_url: Option<&str>,
    ) -> Result<ValidationResult> {
        // 1. Check path exists
        if !path.exists() {
            return Ok(ValidationResult::PathNotFound);
        }

        // 2. Check path is a directory
        if !path.is_dir() {
            return Ok(ValidationResult::NotADirectory);
        }

        // 3. Check if it's a git repository
        if !path.join(".git").exists() {
            return Ok(ValidationResult::NotAGitRepo);
        }

        // 4. If expected URL is provided, verify remote URL
        if let Some(expected_url) = expected_url {
            if let Ok(current_url) = self.get_remote_url(path) {
                if current_url != expected_url {
                    return Ok(ValidationResult::UrlMismatch {
                        expected: expected_url.to_string(),
                        current: current_url,
                    });
                }
            }
        }

        Ok(ValidationResult::Valid)
    }

    /// Get the remote URL of a git repository
    fn get_remote_url(&self, path: &Path) -> Result<String> {
        let output = Command::new("git")
            .args(["config", "--get", "remote.origin.url"])
            .current_dir(path)
            .output()
            .map_err(|e| ValidationError::GitFailed(format!("Failed to execute git: {}", e)))?;

        if !output.status.success() {
            return Err(ValidationError::GitFailed(
                "Git config command failed".to_string(),
            ));
        }

        let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(url)
    }

    /// Get the current HEAD commit hash
    fn get_head_commit(&self, path: &Path) -> Result<String> {
        let output = Command::new("git")
            .args(["rev-parse", "HEAD"])
            .current_dir(path)
            .output()
            .map_err(|e| ValidationError::GitFailed(format!("Failed to execute git: {}", e)))?;

        if !output.status.success() {
            return Err(ValidationError::GitFailed(
                "Git rev-parse command failed".to_string(),
            ));
        }

        let commit = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(commit)
    }

    /// Validate all repositories in the database
    ///
    /// # Returns
    /// A vector of `RepoValidationInfo` for each repository
    pub async fn validate_all_repos(
        &self,
        pool: &SqlitePool,
    ) -> Result<Vec<RepoValidationInfo>> {
        // Get all repositories from database
        let repos = RepoModel::all(pool).await
            .map_err(|e| ValidationError::Repo(RepoError::Database(e)))?;

        let mut results = Vec::new();

        for repo in repos {
            let path = PathBuf::from(&repo.path);
            let validation_result = self.validate_repo(&path, None).await?;

            let valid = matches!(validation_result, ValidationResult::Valid);
            let error = if valid {
                None
            } else {
                Some(format!("{:?}", validation_result))
            };

            results.push(RepoValidationInfo {
                repo_id: repo.id,
                repo_name: repo.name.clone(),
                path: repo.path.to_string_lossy().to_string(),
                valid,
                error,
            });
        }

        Ok(results)
    }

    /// Fix a repository path
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `repo_id` - ID of the repository to fix
    /// * `new_path` - New path for the repository
    ///
    /// # Returns
    /// `Ok(())` if the path was successfully updated
    pub async fn fix_repo_path(
        &self,
        pool: &SqlitePool,
        repo_id: Uuid,
        new_path: &Path,
    ) -> Result<()> {
        // Validate the new path
        self.repo_service.validate_git_repo_path(new_path)?;

        // Update the repository path in database
        RepoModel::update_path(pool, repo_id, new_path)
            .await
            .map_err(|e| ValidationError::Repo(RepoError::Database(e)))?;

        Ok(())
    }
}

impl Default for RepoPathValidator {
    fn default() -> Self {
        Self::new()
    }
}
