use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::broadcast;
use tokio::sync::RwLock;
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer};
use utils::assets;

/// Configuration change event
#[derive(Debug, Clone)]
pub enum ConfigChange {
    /// Config file changed
    ConfigChanged,
    /// Profiles file changed
    ProfilesChanged,
    /// Custom path file changed
    CustomPathChanged,
    /// Any config file in the config directory changed
    ConfigDirectoryChanged,
}

/// Configuration watcher service
///
/// Watches configuration files for changes and broadcasts events
pub struct ConfigWatcher {
    /// Broadcast sender for config change events
    tx: broadcast::Sender<ConfigChange>,
    /// Path to config directory
    config_dir: PathBuf,
    /// Debouncer to handle file system events
    _debouncer: Arc<RwLock<Option<Debouncer<RecommendedWatcher, notify_debouncer_full::NoCache>>>>,
}

impl ConfigWatcher {
    /// Create a new config watcher service
    pub fn new() -> anyhow::Result<Self> {
        let (tx, _rx) = broadcast::channel(100);
        let config_dir = utils::assets::asset_dir();

        Ok(Self {
            tx,
            config_dir,
            _debouncer: Arc::new(RwLock::new(None)),
        })
    }

    /// Subscribe to config change events
    pub fn subscribe(&self) -> broadcast::Receiver<ConfigChange> {
        self.tx.subscribe()
    }

    /// Start watching configuration files
    pub async fn start_watching(&self) -> anyhow::Result<()> {
        let config_dir = self.config_dir.clone();
        let tx = self.tx.clone();

        // Create debounced watcher (300ms debounce time)
        let mut debouncer = new_debouncer(
            Duration::from_millis(300),
            None,
            move |result: DebounceEventResult| {
                match result {
                    Ok(events) => {
                        for event in events {
                            tracing::debug!("Config file event: {:?}", event);

                            // Determine which config file changed
                            if let Some(path) = event.paths.first().and_then(|p| p.strip_prefix(&config_dir).ok()) {
                                let file_name = path
                                    .file_name()
                                    .and_then(|n| n.to_str())
                                    .unwrap_or("");

                                let change_event = match file_name {
                                    "config.json" => Some(ConfigChange::ConfigChanged),
                                    "profiles.json" => Some(ConfigChange::ProfilesChanged),
                                    "custom_path.json" => Some(ConfigChange::CustomPathChanged),
                                    _ => {
                                        // If any file in config dir changed, send generic event
                                        Some(ConfigChange::ConfigDirectoryChanged)
                                    }
                                };

                                if let Some(event) = change_event {
                                    if let Err(e) = tx.send(event) {
                                        tracing::error!("Failed to send config change event: {}", e);
                                    }
                                }
                            }
                        }
                    }
                    Err(errors) => {
                        for error in errors {
                            tracing::error!("Config watcher error: {:?}", error);
                        }
                    }
                }
            },
        )?;

        // Add watcher to config directory
        debouncer.watch(&config_dir, RecursiveMode::NonRecursive)?;

        // Store debouncer
        let mut guard = self._debouncer.write().await;
        *guard = Some(debouncer);

        tracing::info!("Started watching config directory: {}", config_dir.display());

        Ok(())
    }

    /// Manually trigger a config reload event
    pub fn trigger_reload(&self, event: ConfigChange) {
        if let Err(e) = self.tx.send(event) {
            tracing::error!("Failed to trigger config reload: {}", e);
        }
    }
}

impl Default for ConfigWatcher {
    fn default() -> Self {
        Self::new().expect("Failed to create ConfigWatcher")
    }
}
