// use tauri::Manager;
// 注册命令：
fn main() {
    tauri::Builder::default()
        // Add this line
        .invoke_handler(tauri::generate_handler![
            // window_to_login_page,
            // window_to_main_page
        ])
        .run(tauri::generate_context!())
        .expect("failed to run app");
}
