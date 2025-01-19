use crate::commands::{exist_file, mkdir_file, remove_file, exit_app};

pub fn setup_mobile() {
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
            super::window::setup_mobile_window(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            exist_file,
            remove_file,
            mkdir_file,
            exit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 
