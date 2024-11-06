use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

pub fn setup_window(app: &AppHandle) -> tauri::Result<()> {
    // 主窗口配置
    let mut main_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
        .title("极物聊天")
        .resizable(true)
        .center()
        .shadow(false)
        .decorations(false)
        .min_inner_size(375.0, 780.0)
        .max_inner_size(1920.0, 1080.0)
        .inner_size(1280.0, 860.0);

    // 消息窗口配置
    #[cfg(any(target_os = "windows", target_os = "linux",  target_os = "macos"))]
    let mut msgbox_builder = WebviewWindowBuilder::new(app, "msgbox", WebviewUrl::App("/msg".into()))
        .title("消息通知")
        .inner_size(240.0, 300.0)
        .skip_taskbar(true)
        .decorations(false)
        .resizable(false)
        .always_on_top(true)
        .shadow(false)
        .position(0.0, 0.0)
        .visible(false);

    // Windows 和 Linux 平台特定配置
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        main_builder = main_builder.transparent(true);
        msgbox_builder = msgbox_builder.transparent(true);
    }

    // macOS 平台特定配置
    #[cfg(target_os = "macos")]
    {
        use tauri::utils::TitleBarStyle;
        main_builder = main_builder.title_bar_style(TitleBarStyle::Transparent);
        msgbox_builder = msgbox_builder.title_bar_style(TitleBarStyle::Transparent);
    }

    // 构建主窗口和消息窗口
    let _main_window = main_builder.build()?;
    #[cfg(any(target_os = "windows", target_os = "linux",  target_os = "macos"))]
    let msgbox_window = msgbox_builder.build()?;

    // 监听窗口事件
    #[cfg(any(target_os = "windows", target_os = "linux",  target_os = "macos"))]
    msgbox_window.clone().on_window_event(move |event| match event {
        WindowEvent::CloseRequested { api, .. } => {
            println!("关闭请求，窗口将最小化而不是关闭。");
            api.prevent_close();
        }
        WindowEvent::Focused(focused) => {
            if !*focused {
                msgbox_window.hide().unwrap_or_else(|e| eprintln!("隐藏窗口时出错: {:?}", e));
            }
        }
        _ => {}
    });

    // 仅在构建 macOS 时设置背景颜色
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
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
    if let Some(window) = app.webview_windows().values().next() {
        window.set_focus().unwrap_or_else(|e| eprintln!("设置窗口焦点时出错: {:?}", e));
    } else {
        eprintln!("未找到窗口");
    }
}
