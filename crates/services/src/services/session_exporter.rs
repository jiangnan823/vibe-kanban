use chrono::Utc;
use db::models::{
    task_session::{CreateTaskSession, TaskSession},
    workspace::Workspace,
};
use sqlx::SqlitePool;
use std::path::PathBuf;
use thiserror::Error;
use uuid::Uuid;

use crate::services::git::GitService;

#[derive(Debug, Error)]
pub enum SessionExportError {
    #[error(transparent)]
    Database(#[from] sqlx::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("Workspace not found")]
    WorkspaceNotFound,
    #[error("Task not found")]
    TaskNotFound,
}

pub type Result<T> = std::result::Result<T, SessionExportError>;

/// Session export service
///
/// Handles exporting task sessions to Markdown files
pub struct SessionExporter {
    db: SqlitePool,
}

impl SessionExporter {
    pub fn new(db: SqlitePool) -> Self {
        Self { db }
    }

    /// Save a task session to a Markdown file
    ///
    /// # Arguments
    /// * `task_id` - The ID of the task
    /// * `workspace_id` - The ID of the workspace
    ///
    /// # Returns
    /// The path to the saved session file
    pub async fn save_session(
        &self,
        task_id: Uuid,
        workspace_id: Uuid,
    ) -> Result<PathBuf> {
        // 1. Get workspace information
        let workspace = Workspace::find_by_id(&self.db, workspace_id)
            .await?
            .ok_or(SessionExportError::WorkspaceNotFound)?;

        // 2. Get task information
        let task = db::models::task::Task::find_by_id(&self.db, task_id)
            .await?
            .ok_or(SessionExportError::TaskNotFound)?;

        // 3. Get project information
        let project = db::models::project::Project::find_by_id(&self.db, task.project_id)
            .await?
            .ok_or(SessionExportError::TaskNotFound)?;

        // 4. Generate session file path
        let session_dir = utils::assets::session_save_dir();
        let project_dir_name = format!("{}-{}",
            project.id,
            project.name.replace(' ', "_").replace('/', "_")
        );
        let task_dir_name = format!("{}-{}",
            task.id,
            task.title.replace(' ', "_").replace('/', "_")
        );

        let session_file_dir = session_dir
            .join("projects")
            .join(&project_dir_name)
            .join("tasks")
            .join(&task_dir_name)
            .join("sessions");

        // Create directory structure
        std::fs::create_dir_all(&session_file_dir)?;

        // 5. Generate filename with timestamp
        let filename = format!("{}.md", Utc::now().format("%Y-%m-%d-%H-%M"));
        let session_file_path = session_file_dir.join(&filename);

        // 6. Generate Markdown content
        let markdown = self.generate_session_markdown(&task, &workspace, &project).await?;

        // 7. Write to file
        std::fs::write(&session_file_path, markdown)?;

        // 8. Create database record
        let session_id = Uuid::new_v4();
        let create_data = CreateTaskSession {
            task_id,
            file_path: session_file_path.to_string_lossy().to_string(),
        };

        TaskSession::create(&self.db, &create_data, session_id).await?;

        Ok(session_file_path)
    }

    /// Generate Markdown content for a session
    async fn generate_session_markdown(
        &self,
        task: &db::models::task::Task,
        workspace: &Workspace,
        project: &db::models::project::Project,
    ) -> Result<String> {
        let mut md = String::new();

        // Header
        md.push_str(&format!("# Task: {}\n\n", task.title));

        // Metadata
        md.push_str("**Metadata**\n\n");
        md.push_str(&format!("- **Project**: {}\n", project.name));
        md.push_str(&format!("- **Status**: {}\n", task.status));
        md.push_str(&format!("- **Created**: {}\n", task.created_at.format("%Y-%m-%d %H:%M:%S")));
        md.push_str(&format!("- **Updated**: {}\n", task.updated_at.format("%Y-%m-%d %H:%M:%S")));

        if let Some(branch) = &workspace.branch {
            md.push_str(&format!("- **Branch**: {}\n", branch));
        }

        if let Some(name) = &workspace.name {
            md.push_str(&format!("- **Workspace**: {}\n", name));
        }

        md.push_str("\n---\n\n");

        // Description
        if let Some(description) = &task.description {
            md.push_str("## Description\n\n");
            md.push_str(description);
            md.push_str("\n\n");
        }

        // Execution summary (placeholder for now)
        md.push_str("## Execution Summary\n\n");
        md.push_str("*This section will be populated with execution details.*\n\n");

        // Session metadata
        md.push_str("## Session Information\n\n");
        md.push_str(&format!("- **Workspace ID**: {}\n", workspace.id));
        md.push_str(&format!("- **Task ID**: {}\n", task.id));
        md.push_str(&format!("- **Project ID**: {}\n", project.id));
        md.push_str(&format!("- **Setup Completed**: {}\n",
            workspace.setup_completed_at.map(|t| t.format("%Y-%m-%d %H:%M:%S").to_string()).unwrap_or_else(|| "N/A".to_string())
        ));

        md.push_str("\n---\n\n");
        md.push_str("*Exported by Vibe Kanban*");

        Ok(md)
    }

    /// Scan session directory and create database records for any new files
    ///
    /// # Returns
    /// The number of new session files indexed
    pub async fn scan_and_index_sessions(&self) -> Result<usize> {
        let session_dir = utils::assets::session_save_dir();
        let mut indexed_count = 0;

        // Recursively find all .md files in the session directory
        let entries = walkdir::WalkDir::new(&session_dir)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.path().extension().map(|ext| ext == "md").unwrap_or(false));

        for entry in entries {
            let path = entry.path();

            // Skip if already indexed
            let path_str = path.to_string_lossy().to_string();
            if TaskSession::file_exists(&self.db, &path_str).await? {
                continue;
            }

            // Try to extract task_id from path
            // Expected format: .../projects/{project_id}-{project_name}/tasks/{task_id}-{task_name}/sessions/{timestamp}.md
            if let Some(task_id) = self.extract_task_id_from_path(&session_dir, path) {
                // Check if task exists
                if db::models::task::Task::find_by_id(&self.db, task_id).await?.is_some() {
                    let session_id = Uuid::new_v4();
                    let create_data = CreateTaskSession {
                        task_id,
                        file_path: path_str,
                    };

                    if TaskSession::create(&self.db, &create_data, session_id).await.is_ok() {
                        indexed_count += 1;
                    }
                }
            }
        }

        Ok(indexed_count)
    }

    /// Extract task ID from session file path
    fn extract_task_id_from_path(&self, session_dir: &PathBuf, file_path: &PathBuf) -> Option<Uuid> {
        let relative_path = file_path.strip_prefix(session_dir).ok()?;
        let components: Vec<&str> = relative_path
            .components()
            .filter_map(|c| c.as_os_str().to_str())
            .collect();

        // Expected: ["projects", "{project_id}-{name}", "tasks", "{task_id}-{name}", "sessions", "{file}.md"]
        if components.len() >= 6 && components[0] == "projects" && components[2] == "tasks" {
            let task_part = components[3];
            if let Some(task_id_str) = task_part.split('-').next() {
                return Uuid::parse_str(task_id_str).ok();
            }
        }

        None
    }
}
