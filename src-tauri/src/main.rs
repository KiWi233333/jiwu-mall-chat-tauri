#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

fn main() {
    // 这里 `"quit".to_string()` 定义菜单项 ID，第二个参数是菜单项标签。
    let setting = CustomMenuItem::new("setting".to_string(), "设置");
    let to_host = CustomMenuItem::new("to_host".to_string(), "官网");
    let restart = CustomMenuItem::new("restart".to_string(), "重启");
    let quit = CustomMenuItem::new("quit".to_string(), "退出");
    let tray_menu = SystemTrayMenu::new()
        .add_item(setting)
        .add_item(to_host)
        .add_item(restart)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    let system_tray = SystemTray::new().with_menu(tray_menu);
    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                let window = app.get_window("main").unwrap();
                let is_visible = window.is_visible().unwrap();
                if !is_visible {
                    window.show().unwrap();
                    window.unminimize().unwrap();
                    window.set_focus().unwrap();
                    return;
                }
                let is_focus = window.is_focused().unwrap();
                if !is_focus {
                    let is_min = window.is_minimized().unwrap();
                    if is_min {
                        window.unminimize().unwrap();
                    }
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            SystemTrayEvent::RightClick {
                position: _,
                size: _,
                ..
            } => {
                println!("右键托盘");
            }
            SystemTrayEvent::DoubleClick {
                position: _,
                size: _,
                ..
            } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.unmaximize().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "setting" => {
                    let window = app.get_window("main").unwrap();
                    window.unminimize().unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                    // 窗口发出 `router` 事件
                    window.emit(
                        "router",
                        Payload {
                            message: "/setting".into(),
                        },
                    )
                    .unwrap();
                }
                "to_host" => { // 打开官网链接
                    
                }
                "quit" => {
                    std::process::exit(0);
                }
                "restart" => {
                    app.restart();
                }
                _ => {}
            },
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("failed to run app");
}
