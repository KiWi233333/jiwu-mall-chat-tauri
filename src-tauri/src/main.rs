use tauri::Manager;

// 创建命令：
// 该命令必须是异步的，以便它不会在主线程上运行。
#[tauri::command]
async fn window_to_login_page(window: tauri::Window) {
    // 关闭初始屏幕
    if let Some(login) = window.get_window("login") {
        login.hide().unwrap();
    }
    // 显示主窗口
    window.get_window("main").unwrap().show().unwrap();
}

#[tauri::command]
async fn window_to_main_page(window: tauri::Window) {
    // 关闭初始屏幕
    if let Some(main) = window.get_window("main") {
        main.hide().unwrap();
    }
    // 显示主窗口
    window.get_window("main").unwrap().show().unwrap();
}

// 注册命令：
fn main() {
    tauri::Builder::default()
        // Add this line
        .invoke_handler(tauri::generate_handler![
            window_to_login_page,
            window_to_main_page
        ])
        .run(tauri::generate_context!())
        .expect("failed to run app");
}
