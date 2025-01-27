use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

pub fn setup_desktop_window(app: &AppHandle) -> tauri::Result<()> {
    // 只创建登录窗口
    let mut login_builder =
        WebviewWindowBuilder::new(app, "login", WebviewUrl::App("/login".into()))
            .title("极物聊天 - 登录")
            .resizable(false)
            .center()
            .shadow(false)
            .decorations(false)
            .inner_size(380.0, 480.0)
            .visible(true);

    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        login_builder = login_builder.transparent(true);
    }

    #[cfg(target_os = "macos")]
    {
        use tauri::utils::TitleBarStyle;
        login_builder = login_builder.title_bar_style(TitleBarStyle::Transparent);
    }

    let login_window = login_builder.build()?;

    // 监听登录窗口事件
    #[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
    login_window
        .clone()
        .on_window_event(move |event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
            }
            _ => {}
        });

    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window_login = login_window.ns_window().unwrap() as id;
        unsafe {
            let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                nil,
                50.0 / 255.0,
                158.0 / 255.0,
                163.5 / 255.0,
                1.0,
            );
            ns_window_login.setBackgroundColor_(bg_color);
        }
    }

    Ok(())
}

#[cfg(desktop)]
pub fn show_window(app: &AppHandle) {
    use crate::desktops::window::setup_desktop_window;

    if let Some(window) = app.webview_windows().get("main") {
        window
            .unminimize()
            .unwrap_or_else(|e| eprintln!("取消最小化窗口时出错: {:?}", e));
        window
            .show()
            .unwrap_or_else(|e| eprintln!("显示窗口时出错: {:?}", e));
        window
            .set_focus()
            .unwrap_or_else(|e| eprintln!("聚焦窗口时出错: {:?}", e));
    } else if let Some(window) = app.webview_windows().get("login") {
        window
            .unminimize()
            .unwrap_or_else(|e| eprintln!("取消最小化窗口时出错: {:?}", e));
        window
            .show()
            .unwrap_or_else(|e| eprintln!("显示窗口时出错: {:?}", e));
        window
            .set_focus()
            .unwrap_or_else(|e| eprintln!("聚焦窗口时出错: {:?}", e));
    } else {
        setup_desktop_window(app).unwrap_or_else(|e| eprintln!("创建窗口时出错: {:?}", e));
    }
}
