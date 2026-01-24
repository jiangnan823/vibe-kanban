-- Add task_sessions table for storing saved session files

-- Table to track saved task session files
CREATE TABLE IF NOT EXISTS task_sessions (
    id BLOB PRIMARY KEY,
    task_id BLOB NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create index for faster queries by task_id
CREATE INDEX IF NOT EXISTS idx_task_sessions_task_id ON task_sessions(task_id);

-- Create index for faster queries by created_at
CREATE INDEX IF NOT EXISTS idx_task_sessions_created_at ON task_sessions(created_at DESC);
