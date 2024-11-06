// tray.rs
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

// msgbox宽高
// const MSGBOX_WIDTH: f64 = 240.0;
// const MSGBOX_HEIGHT: f64 = 300.0;

pub fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let setting = MenuItemBuilder::with_id("setting", "设置").build(app)?;
    let to_host = MenuItemBuilder::with_id("to_host", "官网").build(app)?;
    let restart = MenuItemBuilder::with_id("restart", "重启").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "退出").build(app)?;

    let menu = MenuBuilder::new(app)
        .items(&[&restart, &setting, &to_host, &quit])
        .build()?;

    TrayIconBuilder::with_id("tray_icon")
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
                let window = app.get_webview_window("main").unwrap();
                window
                    .emit(
                        "open_url",
                        Payload {
                            message: "https://jiwu.kiwi2333.top".into(),
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
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                id: _,
                rect: _,
                button,
                button_state: MouseButtonState::Up,
                ..
            } => match button {
                MouseButton::Left {} => {
                    let app = tray.app_handle();
                    if let Some(webview_window) = app.get_webview_window("main") {
                        let _ = webview_window.show();
                        let _ = webview_window.unminimize();
                        let _ = webview_window.set_focus();
                    } else {
                        show_window(&app);
                    }
                    app.emit("tray_click", ()).unwrap();
                }
                MouseButton::Right {} => {}
                _ => {}
            },
            TrayIconEvent::Enter {
                id: _,
                position,
                rect: _,
            } => {
                let app = tray.app_handle();
                app.emit("tray_mouseenter", position).unwrap();
                let msgbox = app.get_webview_window("msgbox").unwrap();
                msgbox.set_focus().unwrap();
            }
            TrayIconEvent::Leave {
                id: _,
                position,
                rect: _,
            } => {
                let app = tray.app_handle();
                std::thread::sleep(std::time::Duration::from_millis(300));
                if let Some(webview_window) = app.get_webview_window("msgbox") {
                    if !webview_window.is_focused().unwrap() {
                        webview_window.hide().unwrap();
                    };
                }
                app.emit("tray_mouseleave", position).unwrap();
            }
            _ => {}
        })
        .build(app)?;
    Ok(())
}

fn show_window(app: &AppHandle) {
    let windows = app.webview_windows(); // This should now work
    windows
        .values()
        .next()
        .expect("Sorry, no window found")
        .set_focus()
        .expect("Can't Bring Window to Focus");
}
