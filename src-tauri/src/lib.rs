// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};
use tauri_plugin_autostart::MacosLauncher;

fn show_window(app: &AppHandle) {
    let windows = app.webview_windows();
    windows
        .values()
        .next()
        .expect("Sorry, no window found")
        .set_focus()
        .expect("Can't Bring Window to Focus");
}

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            let _ = show_window(app);
            println!("{:?}", args);
            println!("{:?}", cwd);
        }))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]), /* arbitrary number of args to pass to your app */
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            let setting = MenuItemBuilder::with_id("setting", "设置").build(app)?;
            let to_host = MenuItemBuilder::with_id("to_host", "官网").build(app)?;
            let restart = MenuItemBuilder::with_id("restart", "重启").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "退出").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&restart, &setting, &to_host, &quit])
                .build()?;
            TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .title("极物聊天")
                .tooltip("极物聊天")
                .menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "setting" => {
                        let window = app.get_webview_window("main").unwrap();
                        window.unminimize().unwrap();
                        window.show().unwrap();
                        window.set_focus().unwrap();
                        // 窗口发出 `router` 事件
                        window
                            .emit(
                                "router",
                                Payload {
                                    message: "/setting".into(),
                                },
                            )
                            .unwrap();
                    }
                    "to_host" => {
                        // 打开官网链接
                        let window = app.get_webview_window("main").unwrap();
                        window
                            .emit(
                                "open_url",
                                Payload {
                                    message: "https://jiwu.kiwi2333.top".into(), // 官网链接地址，请替换成你的官网地址。
                                },
                            )
                            .unwrap();
                    }
                    "quit" => {
                        std::process::exit(0);
                    }
                    "restart" => {
                        app.restart();
                    }
                    _ => (),
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(webview_window) = app.get_webview_window("main") {
                            let _ = webview_window.show();
                            let _ = webview_window.unminimize();
                            let _ = webview_window.set_focus();
                        } else {
                            let _ = show_window(&app);
                        }
                    }
                })
                .build(app)?;
            // // 仅在构建 macOS 时设置背景颜色
            // #[cfg(target_os = "macos")]
            // {
            //     let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default());
            //     let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);
            //     win_builder.build().unwrap();
            //     use cocoa::appkit::{NSColor, NSWindow};
            //     use cocoa::base::{id, nil};
            //     let ns_window = window.ns_window().unwrap() as id;
            //     unsafe {
            //         ns_window.setBackgroundColor_(NSColor::colorWithRed_green_blue_alpha_(
            //             nil, nil, nil, nil, 0.0, // 透明度
            //         ));
            //     }
            // }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
