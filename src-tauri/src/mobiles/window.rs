use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

// （android、ios）的窗口
pub fn setup_mobile_window(app: &AppHandle) -> tauri::Result<()> {
    // 主窗口配置
    WebviewWindowBuilder::new(app, "main", WebviewUrl::default()).build()?;
    Ok(())
}
