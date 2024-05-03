use tauri::Manager;

#[tauri::command]
async fn close_login_page(window: tauri::Window) -> Result<(), String> {
    window
        .get_window("main")
        .unwrap()
        .hide()
        .map_err(|e| e.to_string())?;
    window
        .get_window("login")
        .unwrap()
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn open_login_page(window: tauri::Window) -> Result<(), String> {
    window
        .get_window("login")
        .unwrap()
        .hide()
        .map_err(|e| e.to_string())?;
    window
        .get_window("main")
        .unwrap()
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}
// 注册命令：
fn main() {
    tauri::Builder::default()
        // Add this line
        .invoke_handler(tauri::generate_handler![open_login_page, close_login_page])
        .run(tauri::generate_context!())
        .expect("failed to run app");
}
