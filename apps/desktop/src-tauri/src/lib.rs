use std::sync::Arc;

use tauri::Manager;
use tauri::menu::{MenuBuilder, SubmenuBuilder};

mod terminal;

use terminal::adapters::outbound::clock::SystemClock;
use terminal::adapters::outbound::event_emitter::TauriEventEmitter;
use terminal::adapters::outbound::pty_adapter::PortablePtyRuntime;
use terminal::adapters::outbound::shell_detector::DefaultShellDetector;
use terminal::adapters::outbound::shell_hooks::FsShellHookInstaller;
use terminal::application::exec_service::ExecService;
use terminal::application::execution_tracker::ExecutionTracker;
use terminal::application::session_service::SessionService;
use terminal::TerminalAppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            terminal::terminal_create_session,
            terminal::terminal_kill_session,
            terminal::terminal_write,
            terminal::terminal_resize,
            terminal::terminal_get_sessions,
            terminal::terminal_get_commands,
            terminal::terminal_exec,
            terminal::terminal_cancel_exec,
            terminal::terminal_get_execution,
            terminal::terminal_approve_command,
        ])
        .setup(|app| {
            // Native menu required on macOS for keyboard shortcuts
            // (Cmd+C/V/X, zoom hotkeys, etc.) to reach the webview
            let app_menu = SubmenuBuilder::new(app, "Semantica")
                .about(None)
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let view_menu = SubmenuBuilder::new(app, "View")
                .fullscreen()
                .build()?;

            let window_menu = SubmenuBuilder::new(app, "Window")
                .minimize()
                .close_window()
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&edit_menu)
                .item(&view_menu)
                .item(&window_menu)
                .build()?;

            app.set_menu(menu)?;

            // ── Terminal subsystem ────────────────────────────
            let clock = Arc::new(SystemClock);
            let event_emitter = Arc::new(TauriEventEmitter::new(app.handle().clone()));
            let execution_tracker = Arc::new(ExecutionTracker::new(clock.clone()));

            let exec_service = Arc::new(ExecService::new(
                event_emitter.clone(),
                clock.clone(),
                execution_tracker.clone(),
            ));

            let session_service = SessionService::new(
                Box::new(PortablePtyRuntime),
                event_emitter.clone(),
                Box::new(DefaultShellDetector),
                clock.clone(),
            )
            .with_execution_tracker(execution_tracker.clone())
            .with_hook_installer(Box::new(FsShellHookInstaller));

            let session_service = Arc::new(session_service);

            app.manage(TerminalAppState::new(
                session_service,
                exec_service,
                execution_tracker,
            ));

            // TODO: Start agentd sidecar via endpoint discovery
            let _window = app.get_webview_window("main").unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Semantica");
}
