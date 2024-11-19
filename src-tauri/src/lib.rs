use tauri::App;
mod commands;
// 桌面端依赖
#[cfg(desktop)]
mod desktops;
#[cfg(desktop)]
use desktops::tray;
#[cfg(desktop)]
use desktops::window;

// 移动端依赖
#[cfg(mobile)]
mod mobiles;
#[cfg(mobile)]
use mobiles::window;

use crate::commands::{exist_file, mkdir_file, remove_file};

pub type SetupHook = Box<dyn FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send>;

#[derive(Default)]
pub struct AppBuilder {
    setup: Option<SetupHook>,
}

impl AppBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    #[must_use]
    pub fn setup<F>(mut self, setup: F) -> Self
    where
        F: FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send + 'static,
    {
        self.setup.replace(Box::new(setup));
        self
    }
    pub fn run(self) {
        #[cfg(desktop)]
        {
            setup_desktop();
        }
        #[cfg(mobile)]
        {
            setup_mobile();
        }
    }
}

#[cfg(mobile)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn setup_mobile() {
    println!("App from Mobile!");
    tauri::Builder::default()
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            window::setup_mobile_window(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            exist_file,
            remove_file,
            mkdir_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(desktop)]
fn setup_desktop() {
    println!("App from Desktop!");
    tauri::Builder::default()
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let _ = window::show_window(app);
            println!("已开启单例模式");
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            tray::setup_tray(app.handle())?;
            window::setup_desktop_window(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            exist_file,
            remove_file,
            mkdir_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
