// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use jiwu_mall_chat_tauri_lib::AppBuilder;

pub fn main() {
    AppBuilder::new().run();
}
