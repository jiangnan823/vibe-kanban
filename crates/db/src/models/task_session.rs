use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use thiserror::Error;
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum TaskSessionError {
    #[error(transparent)]
    Database(#[from] sqlx::Error),
    #[error("Task session not found")]
    NotFound,
    #[error("Task not found")]
    TaskNotFound,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct TaskSession {
    pub id: Uuid,
    pub task_id: Uuid,
    pub file_path: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct CreateTaskSession {
    pub task_id: Uuid,
    pub file_path: String,
}

impl TaskSession {
    /// Find a task session by ID
    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskSession,
            r#"SELECT id AS "id!: Uuid",
                      task_id AS "task_id!: Uuid",
                      file_path,
                      created_at AS "created_at!: DateTime<Utc>"
               FROM task_sessions
               WHERE id = $1"#,
            id
        )
        .fetch_optional(pool)
        .await
    }

    /// Find all sessions for a task, ordered by creation date (newest first)
    pub async fn find_by_task_id(
        pool: &SqlitePool,
        task_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskSession,
            r#"SELECT id AS "id!: Uuid",
                      task_id AS "task_id!: Uuid",
                      file_path,
                      created_at AS "created_at!: DateTime<Utc>"
               FROM task_sessions
               WHERE task_id = $1
               ORDER BY created_at DESC"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    /// Check if a session file path already exists in the database
    pub async fn file_exists(pool: &SqlitePool, file_path: &str) -> Result<bool, sqlx::Error> {
        let count: i64 = sqlx::query_scalar(
            r#"SELECT COUNT(*) FROM task_sessions WHERE file_path = ?"#
        )
        .bind(file_path)
        .fetch_one(pool)
        .await?;
        Ok(count > 0)
    }

    /// Create a new task session record
    pub async fn create(
        pool: &SqlitePool,
        data: &CreateTaskSession,
        id: Uuid,
    ) -> Result<Self, TaskSessionError> {
        Ok(sqlx::query_as!(
            TaskSession,
            r#"INSERT INTO task_sessions (id, task_id, file_path)
               VALUES ($1, $2, $3)
               RETURNING id AS "id!: Uuid",
                         task_id AS "task_id!: Uuid",
                         file_path,
                         created_at AS "created_at!: DateTime<Utc>""#,
            id,
            data.task_id,
            data.file_path
        )
        .fetch_one(pool)
        .await?)
    }

    /// Delete a task session by ID
    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"DELETE FROM task_sessions WHERE id = $1"#,
            id
        )
        .execute(pool)
        .await?;
        Ok(())
    }

    /// Delete all sessions for a task
    pub async fn delete_by_task_id(pool: &SqlitePool, task_id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            r#"DELETE FROM task_sessions WHERE task_id = $1"#,
            task_id
        )
        .execute(pool)
        .await?;
        Ok(result.rows_affected())
    }

    /// Get all task sessions with pagination
    pub async fn all(
        pool: &SqlitePool,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskSession,
            r#"SELECT id AS "id!: Uuid",
                      task_id AS "task_id!: Uuid",
                      file_path,
                      created_at AS "created_at!: DateTime<Utc>"
               FROM task_sessions
               ORDER BY created_at DESC
               LIMIT $1 OFFSET $2"#,
            limit,
            offset
        )
        .fetch_all(pool)
        .await
    }

    /// Count total number of task sessions
    pub async fn count(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
        sqlx::query_scalar!(
            r#"SELECT COUNT(*) AS "count!: i64" FROM task_sessions"#
        )
        .fetch_one(pool)
        .await
    }
}
