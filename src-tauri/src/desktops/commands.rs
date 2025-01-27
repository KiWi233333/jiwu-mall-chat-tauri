// commands.rs
use std::path::PathBuf;
use tauri::{command, AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

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
// #[tauri::command(rename_all = "snake_case")]
#[command]
pub async fn create_window(
    app_handle: AppHandle,
    label: String,
    url: String,
    title: String,
) -> tauri::Result<()> {
    println!("创建窗口：{}, {}", title, url);
    // 映射对应fn
    match label.as_str() {
        "main" => create_main_window(app_handle).await?,
        "msgbox" => create_msgbox_window(app_handle).await?,
        "login" => create_login_window(app_handle).await?,
        "extend" => create_extend_window(app_handle, title, url).await?,
        _ => {}
    }
    Ok(())
}

pub async fn create_main_window(app_handle: AppHandle) -> tauri::Result<()> {
    // 主窗口配置
    let mut main_builder =
        WebviewWindowBuilder::new(&app_handle, "main", WebviewUrl::App("/".into()))
            .title("极物聊天")
            .resizable(true)
            .center()
            .shadow(false)
            .decorations(false)
            .min_inner_size(375.0, 780.0)
            .max_inner_size(1920.0, 1080.0)
            .inner_size(1280.0, 860.0)
            .visible(false);

    // Windows 和 Linux 平台特定配置
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        main_builder = main_builder.transparent(true);
    }

    // macOS 平台特定配置
    #[cfg(target_os = "macos")]
    {
        use tauri::utils::TitleBarStyle;
        main_builder = main_builder.title_bar_style(TitleBarStyle::Transparent);
    }

    let main_window = main_builder.build()?;

    let _app = app_handle.app_handle().clone();

    // 监听窗口事件
    #[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
    main_window
        .clone()
        .on_window_event(move |event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                println!("关闭请求，窗口将最小化而不是关闭。");
                api.prevent_close();
                #[cfg(any(target_os = "windows", target_os = "linux"))]
                main_window
                    .clone()
                    .hide()
                    .unwrap_or_else(|e| eprintln!("隐藏窗口时出错: {:?}", e));
            },
            WindowEvent::Focused(..) => {
                _app.save_window_state(StateFlags::all())
                    .expect("保存窗口状态失败"); // 将所有打开窗口的状态保存到磁盘
            }
            _ => {}
        });

    // 仅在构建 macOS 时设置背景颜色
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window_main = main_window.ns_window().unwrap() as id;
        unsafe {
            let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                nil,
                50.0 / 255.0,
                158.0 / 255.0,
                163.5 / 255.0,
                1.0,
            );
            ns_window_main.setBackgroundColor_(bg_color);
        }
    }
    Ok(())
}

async fn create_msgbox_window(app_handle: AppHandle) -> tauri::Result<()> {
    #[cfg(desktop)]
    let mut msgbox_builder =
        WebviewWindowBuilder::new(&app_handle, "msgbox", WebviewUrl::App("/msg".into()))
            .title("消息通知")
            .inner_size(240.0, 300.0)
            .skip_taskbar(true)
            .decorations(false)
            .resizable(false)
            .always_on_top(true)
            .shadow(false)
            .position(-240.0, -300.0)
            .visible(false);

    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        msgbox_builder = msgbox_builder.transparent(true);
    }

    #[cfg(target_os = "macos")]
    {
        use tauri::utils::TitleBarStyle;
        msgbox_builder = msgbox_builder.title_bar_style(TitleBarStyle::Transparent);
    }

    let msgbox_window = msgbox_builder.build()?;

    msgbox_window
        .clone()
        .on_window_event(move |event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                println!("关闭请求，窗口将最小化而不是关闭。");
                api.prevent_close();
            }
            WindowEvent::Focused(focused) => {
                if !*focused {
                    msgbox_window
                        .hide()
                        .unwrap_or_else(|e| eprintln!("隐藏窗口时出错: {:?}", e));
                }
            }
            _ => {}
        });

    Ok(())
}

async fn create_login_window(app_handle: AppHandle) -> tauri::Result<()> {
    // 只创建登录窗口
    let mut login_builder =
        WebviewWindowBuilder::new(&app_handle, "login", WebviewUrl::App("/login".into()))
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

/**
 * 扩展窗口
 */
async fn create_extend_window(
    app_handle: AppHandle,
    title: String,
    url: String,
) -> tauri::Result<()> {
    // 主窗口配置
    let mut main_builder =
        WebviewWindowBuilder::new(&app_handle, "extend", WebviewUrl::App(url.into()))
            .title(title)
            .resizable(true)
            .center()
            .shadow(false)
            .decorations(false)
            .min_inner_size(375.0, 780.0)
            .max_inner_size(1920.0, 1080.0)
            .inner_size(1024.0, 960.0)
            .visible(false);

    // Windows 和 Linux 平台特定配置
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        main_builder = main_builder.transparent(true);
        main_builder.build()?;
    }

    // macOS 平台特定配置
    #[cfg(target_os = "macos")]
    {
        use tauri::utils::TitleBarStyle;
        main_builder = main_builder.title_bar_style(TitleBarStyle::Transparent);
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};
        let main_window = main_builder.build()?;

        let ns_window_main = main_window.ns_window().unwrap() as id;
        unsafe {
            let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                nil,
                50.0 / 255.0,
                158.0 / 255.0,
                163.5 / 255.0,
                1.0,
            );
            ns_window_main.setBackgroundColor_(bg_color);
        }
    }
    Ok(())
}
