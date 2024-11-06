// main.rs
use crate::commands::{exist_file, mkdir_file, remove_file};
use tauri_plugin_autostart::MacosLauncher;

mod commands;
mod tray;
mod window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    
    #[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
    tauri::Builder::default()
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
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            tray::setup_tray(app.handle())?;
            window::setup_window(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            exist_file,
            remove_file,
            mkdir_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    #[cfg(any(target_os = "android", target_os = "ios"))]
    tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_upload::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_os::init())
    .setup(|app| {
        window::setup_window(app.handle())?;
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
