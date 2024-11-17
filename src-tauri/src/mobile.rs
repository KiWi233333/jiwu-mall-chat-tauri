use jiwu_mall_chat_tauri_lib::AppBuilder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    super::AppBuilder::new().run();
}
