// commands.rs
use std::path::PathBuf;

#[tauri::command]
pub async fn exist_file(path: PathBuf) -> bool {
    path.exists()
}

#[tauri::command]
pub async fn remove_file(path: PathBuf) -> bool {
    std::fs::remove_file(path).is_ok()
}

#[tauri::command]
pub async fn mkdir_file(path: PathBuf) -> bool {
    std::fs::create_dir(path).is_ok()
}

#[tauri::command]
pub async fn exit_app() {
    std::process::exit(0);
}
