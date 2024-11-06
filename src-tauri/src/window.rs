// window.rs
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

pub fn setup_window(app: &tauri::AppHandle) -> tauri::Result<()> {
    // 注册命令
    let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
        .title("极物聊天")
        .resizable(true)
        .center()
        .shadow(false)
        .decorations(false)
        .min_inner_size(375.0, 780.0)
        .max_inner_size(1920.0, 1080.0)
        .inner_size(1280.0, 860.0);
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    // url 打包前是/msg 打包后是 /msg.html
    let msgbox_builder = WebviewWindowBuilder::new(app, "msgbox", WebviewUrl::App("/msg".into()))
        .title("消息通知")
        .inner_size(240.0, 300.0)
        .skip_taskbar(true)
        .decorations(false)
        .transparent(true)
        .resizable(false)
        .always_on_top(true)
        .shadow(false)
        .position(0.0, 0.0)
        .visible(false);
    // 仅在 Windows 和 Linux 时设置透明背景
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    let msgbox_builder = msgbox_builder.transparent(true);
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    let win_builder = win_builder.transparent(true);
    // 仅在 macOS 时设置透明标题栏
    #[cfg(target_os = "macos")]
    let win_builder = win_builder.title_bar_style(tauri::utils::TitleBarStyle::Transparent);

    let _main_window = win_builder.build().unwrap();
    let _msgbox = msgbox_builder.build().unwrap();
    // 监听窗口事件
    _msgbox.clone().on_window_event(move |event| match event {
        // WindowEvent::Resized(size) => {
        //     println!("窗口调整大小为：宽 {} 高 {}", size.width, size.height);
        // }
        // WindowEvent::Moved(position) => {
        //     println!("窗口移动到位置：x {} y {}", position.x, position.y);
        // }
        WindowEvent::CloseRequested { api, .. } => {
            println!("关闭请求，窗口将最小化而不是关闭。");
            api.prevent_close();
        }
        WindowEvent::Focused(focused) => {
            if *focused {
            } else {
                _msgbox.hide().unwrap();
            }
        }
        _ => {}
    });

    // 仅在构建 macOS 时设置背景颜色
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor};
        use cocoa::base::{id, nil};

        let ns_window = _main_window.ns_window().unwrap() as id;
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
