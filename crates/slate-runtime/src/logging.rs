//! Logging that writes inside the portable root and nowhere else.

use slate_config::SuiteConfig;
use slate_core::AppId;
use slate_paths::SlatePaths;
use tracing_subscriber::EnvFilter;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

use crate::error::RuntimeError;

/// Environment variable that overrides the configured log level.
pub const ENV_LOG: &str = "SLATE_LOG";

/// Set to any non-empty value to mirror logs to the console during development.
pub const ENV_LOG_CONSOLE: &str = "SLATE_LOG_CONSOLE";

/// Starts logging to `appdata/logs/<app>.log`, rotated daily.
///
/// The file appender is deliberately given a path from [`SlatePaths`] rather
/// than a directory of its own choosing: `tracing-appender` writes wherever it
/// is pointed, and pointing it at a default would put logs outside the
/// portable root.
///
/// The returned guard is leaked on purpose — logging must stay alive for the
/// life of the process, and there is no later point at which flushing could be
/// arranged.
///
/// # Errors
///
/// Returns [`RuntimeError::Logging`] if the subscriber cannot be installed.
pub fn init(paths: &SlatePaths, app_id: &AppId, suite: &SuiteConfig) -> Result<(), RuntimeError> {
    let directory = paths.logs_dir();

    let appender =
        tracing_appender::rolling::daily(directory.as_std_path(), format!("{app_id}.log"));
    let (writer, guard) = tracing_appender::non_blocking(appender);
    std::mem::forget(guard);

    let filter = EnvFilter::try_from_env(ENV_LOG)
        .or_else(|_| EnvFilter::try_new(&suite.log_level))
        .unwrap_or_else(|_| EnvFilter::new("info"));

    let file_layer = tracing_subscriber::fmt::layer()
        .with_writer(writer)
        .with_ansi(false)
        .with_target(true)
        .with_thread_ids(false);

    let console_layer = std::env::var(ENV_LOG_CONSOLE)
        .ok()
        .filter(|value| !value.is_empty())
        .map(|_| {
            tracing_subscriber::fmt::layer()
                .with_ansi(true)
                .with_target(false)
        });

    tracing_subscriber::registry()
        .with(filter)
        .with(file_layer)
        .with(console_layer)
        .try_init()
        .map_err(|error| RuntimeError::Logging(error.to_string()))
}
