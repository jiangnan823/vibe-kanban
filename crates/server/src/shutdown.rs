use std::sync::atomic::{AtomicBool, Ordering};

// Global shutdown flag that can be triggered by API
pub static SHUTDOWN_REQUESTED: AtomicBool = AtomicBool::new(false);

/// Request a graceful shutdown from API
pub fn request_shutdown() {
    SHUTDOWN_REQUESTED.store(true, Ordering::SeqCst);
    tracing::info!("Shutdown requested via API");
}

pub async fn shutdown_signal() {
    // Check for API-triggered shutdown first
    tokio::select! {
        _ = async {
            loop {
                if SHUTDOWN_REQUESTED.load(Ordering::SeqCst) {
                    tracing::info!("API shutdown signal received");
                    break;
                }
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }
        } => {},
        _ = tokio::signal::ctrl_c() => {
            tracing::info!("Ctrl+C received");
        }
    }

    #[cfg(unix)]
    {
        use tokio::signal::unix::{SignalKind, signal};

        // Try to install SIGTERM handler, but don't panic if it fails
        let terminate = async {
            if let Ok(mut sigterm) = signal(SignalKind::terminate()) {
                sigterm.recv().await;
            } else {
                tracing::error!("Failed to install SIGTERM handler");
                // Fallback: never resolves
                std::future::pending::<()>().await;
            }
        };

        tokio::select! {
            _ = terminate => {
                tracing::info!("SIGTERM received");
            }
        }
    }
}
