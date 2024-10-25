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

pub fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
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
                    show_window(&app);
                }
            }
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
