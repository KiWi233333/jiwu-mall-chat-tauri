// window.rs
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub fn setup_window(app: &tauri::AppHandle) -> tauri::Result<()> {
    // {
    //     "label": "main",
    //     "shadow": false,
    //     "resizable": true,
    //     "title": "极物聊天",
    //     "width": 1280,
    //     "height": 860,
    //     "minWidth": 375,
    //     "minHeight": 780,
    //     "center": true,
    //     "decorations": false,
    //     "hiddenTitle": true,
    //     "transparent": true
    //   }
    // 注册命令
    let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
        .title("极物聊天")
        .resizable(true)
        .center()
        .shadow(false)
        .decorations(false)
        .transparent(true)
        .min_inner_size(375.0, 780.0)
        .max_inner_size(1920.0, 1080.0)
        .inner_size(1280.0, 860.0);
    // 仅在 macOS 时设置透明标题栏
    #[cfg(target_os = "macos")]
    let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);
    let _window = win_builder.build().unwrap();
    // 仅在构建 macOS 时设置背景颜色
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window = _window.ns_window().unwrap() as id;
        unsafe {
            let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                nil,
                50.0 / 255.0,
                158.0 / 255.0,
                163.5 / 255.0,
                1.0,
            );
            ns_window.setBackgroundColor_(bg_color);
        }
    }
    Ok(())
}

pub fn show_window(app: &AppHandle) {
    let windows = app.webview_windows(); // This should now work
    windows
        .values()
        .next()
        .expect("Sorry, no window found")
        .set_focus()
        .expect("Can't Bring Window to Focus");
}
