use directories::ProjectDirs;
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};

const PROJECT_ROOT: &str = env!("CARGO_MANIFEST_DIR");

/// Custom path configuration file path
pub fn custom_path_config_file() -> std::path::PathBuf {
    if cfg!(debug_assertions) {
        std::path::PathBuf::from(PROJECT_ROOT)
            .join("../../dev_assets/custom_path.json")
    } else {
        ProjectDirs::from("ai", "bloop", "vibe-kanban")
            .expect("OS didn't give us a home directory")
            .config_dir() // Use config_dir to avoid circular dependency
            .join("custom_path.json")
    }
}

/// Custom path configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomPathConfig {
    /// Custom asset directory (for config.json, profiles.json, etc.)
    #[serde(rename = "custom_asset_dir")]
    pub custom_asset_dir: Option<std::path::PathBuf>,

    /// Session save directory (for exported task sessions as markdown files)
    /// If not specified, defaults to custom_asset_dir/sessions or asset_dir/sessions
    #[serde(rename = "session_save_dir", default)]
    pub session_save_dir: Option<std::path::PathBuf>,

    /// Whether to auto-reload configuration when file changes
    #[serde(rename = "auto_reload", default)]
    pub auto_reload: bool,

    /// Last time the configuration was verified
    #[serde(rename = "last_verified", default)]
    pub last_verified: Option<String>,
}

/// Load custom path configuration from file
pub fn load_custom_path_config() -> CustomPathConfig {
    let config_file = custom_path_config_file();

    if !config_file.exists() {
        return CustomPathConfig {
            custom_asset_dir: None,
            session_save_dir: None,
            auto_reload: false,
            last_verified: None,
        };
    }

    match std::fs::read_to_string(&config_file) {
        Ok(content) => serde_json::from_str(&content)
            .unwrap_or_else(|e| {
                tracing::warn!("Failed to parse custom_path.json: {:?}, using default", e);
                CustomPathConfig {
                    custom_asset_dir: None,
                    session_save_dir: None,
                    auto_reload: false,
                    last_verified: None,
                }
            }),
        Err(_) => CustomPathConfig {
            custom_asset_dir: None,
            session_save_dir: None,
            auto_reload: false,
            last_verified: None,
        },
    }
}

pub fn asset_dir() -> std::path::PathBuf {
    // Check for custom path first
    let custom_config = load_custom_path_config();

    if let Some(custom_dir) = custom_config.custom_asset_dir {
        // Validate custom path exists
        if custom_dir.exists() {
            return custom_dir;
        } else {
            tracing::warn!(
                "Custom asset directory does not exist: {:?}, falling back to default",
                custom_dir
            );
        }
    }

    // Fallback to default path
    let path = if cfg!(debug_assertions) {
        std::path::PathBuf::from(PROJECT_ROOT).join("../../dev_assets")
    } else {
        ProjectDirs::from("ai", "bloop", "vibe-kanban")
            .expect("OS didn't give us a home directory")
            .data_dir()
            .to_path_buf()
    };

    // Ensure the directory exists
    if !path.exists() {
        std::fs::create_dir_all(&path).expect("Failed to create asset directory");
    }

    path
    // ✔ macOS → ~/Library/Application Support/MyApp
    // ✔ Linux → ~/.local/share/myapp   (respects XDG_DATA_HOME)
    // ✔ Windows → %APPDATA%\Example\MyApp
}

pub fn config_path() -> std::path::PathBuf {
    asset_dir().join("config.json")
}

pub fn profiles_path() -> std::path::PathBuf {
    asset_dir().join("profiles.json")
}

pub fn credentials_path() -> std::path::PathBuf {
    asset_dir().join("credentials.json")
}

#[derive(RustEmbed)]
#[folder = "../../assets/sounds"]
pub struct SoundAssets;

#[derive(RustEmbed)]
#[folder = "../../assets/scripts"]
pub struct ScriptAssets;

/// Get the session save directory path
///
/// Priority:
/// 1. session_save_dir from custom_path.json
/// 2. custom_asset_dir/sessions
/// 3. default asset_dir/sessions
///
/// The directory will be created if it doesn't exist
pub fn session_save_dir() -> std::path::PathBuf {
    let custom_config = load_custom_path_config();

    // 1. Check for explicit session_save_dir
    if let Some(session_dir) = custom_config.session_save_dir {
        if session_dir.exists() || std::fs::create_dir_all(&session_dir).is_ok() {
            return session_dir;
        } else {
            tracing::warn!(
                "Session save directory cannot be created: {:?}, falling back to default",
                session_dir
            );
        }
    }

    // 2. Use custom_asset_dir/sessions
    if let Some(custom_dir) = custom_config.custom_asset_dir {
        let session_dir = custom_dir.join("sessions");
        if session_dir.exists() || std::fs::create_dir_all(&session_dir).is_ok() {
            return session_dir;
        }
    }

    // 3. Fallback to default asset_dir/sessions
    let asset_base = if cfg!(debug_assertions) {
        std::path::PathBuf::from(PROJECT_ROOT).join("../../dev_assets")
    } else {
        ProjectDirs::from("ai", "bloop", "vibe-kanban")
            .expect("OS didn't give us a home directory")
            .data_dir()
            .to_path_buf()
    };

    let session_dir = asset_base.join("sessions");

    // Ensure the directory exists
    if !session_dir.exists() {
        std::fs::create_dir_all(&session_dir).expect("Failed to create session directory");
    }

    session_dir
}
