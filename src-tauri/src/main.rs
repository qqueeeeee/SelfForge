// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::Command;

fn main() {
    Command::new("..\\backend\\venv\\Scripts\\python.exe")
        .current_dir("../backend") // 👈 THIS IS THE KEY
        .args([
            "-m",
            "uvicorn",
            "app:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8000",
        ])
        .spawn()
        .expect("Failed to start backend");

    app_lib::run();
}
