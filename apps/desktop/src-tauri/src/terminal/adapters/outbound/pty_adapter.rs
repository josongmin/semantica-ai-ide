//! PTY Adapter — portable-pty implementation of `PtyRuntime` + `PtyHandle`.
//!
//! This is the only file that imports `portable_pty`.

use std::io::{Read, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;

use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};

use crate::terminal::domain::ports::{PtyHandle, PtyRuntime};

// ─── PtyRuntime Implementation ───────────────────────────

pub struct PortablePtyRuntime;

impl PtyRuntime for PortablePtyRuntime {
    fn spawn(
        &self,
        shell_path: &str,
        cwd: &str,
        cols: u16,
        rows: u16,
    ) -> Result<Box<dyn PtyHandle>, String> {
        let pty_system = native_pty_system();

        let size = PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        };

        let pair = pty_system
            .openpty(size)
            .map_err(|e| format!("Failed to open PTY: {e}"))?;

        let mut cmd = CommandBuilder::new(shell_path);
        cmd.cwd(cwd);

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn shell: {e}"))?;

        let pid = child.process_id().unwrap_or(0);

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| format!("Failed to take PTY writer: {e}"))?;

        let reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| format!("Failed to clone PTY reader: {e}"))?;

        let handle = PortablePtyHandle {
            pid,
            master: pair.master,
            child: Mutex::new(child),
            writer: Mutex::new(writer),
            reader: Mutex::new(Some(reader)),
            shutdown: Arc::new(AtomicBool::new(false)),
        };

        Ok(Box::new(handle))
    }
}

// ─── PtyHandle Implementation ────────────────────────────

struct PortablePtyHandle {
    pid: u32,
    master: Box<dyn MasterPty + Send>,
    child: Mutex<Box<dyn portable_pty::Child + Send + Sync>>,
    writer: Mutex<Box<dyn Write + Send>>,
    reader: Mutex<Option<Box<dyn Read + Send>>>,
    shutdown: Arc<AtomicBool>,
}

// SAFETY: All fields are behind Mutex or are Send+Sync.
// `master` is `Box<dyn MasterPty + Send>` and only used for resize (which takes &self).
unsafe impl Sync for PortablePtyHandle {}

impl PtyHandle for PortablePtyHandle {
    fn pid(&self) -> u32 {
        self.pid
    }

    fn write_input(&self, data: &[u8]) -> Result<(), String> {
        let mut writer = self.writer.lock().map_err(|e| e.to_string())?;
        writer
            .write_all(data)
            .map_err(|e| format!("Write failed: {e}"))?;
        writer.flush().map_err(|e| format!("Flush failed: {e}"))?;
        drop(writer);
        Ok(())
    }

    fn resize(&self, cols: u16, rows: u16) -> Result<(), String> {
        self.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Resize failed: {e}"))
    }

    fn kill(&self) -> Result<(), String> {
        self.shutdown.store(true, Ordering::SeqCst);
        let _ = self.child.lock().map_err(|e| e.to_string())?.kill();
        Ok(())
    }

    #[allow(clippy::cast_possible_wrap)]
    fn try_exit_code(&self) -> Option<i32> {
        let mut child = self.child.lock().ok()?;
        child
            .try_wait()
            .ok()
            .flatten()
            .map(|status| status.exit_code() as i32)
    }

    fn start_reader(
        &self,
        on_data: Box<dyn Fn(Vec<u8>) + Send>,
        on_exit: Box<dyn FnOnce(Option<i32>) + Send>,
    ) -> Result<(), String> {
        let reader = self
            .reader
            .lock()
            .map_err(|e| e.to_string())?
            .take()
            .ok_or_else(|| "Reader already started".to_string())?;

        let shutdown = self.shutdown.clone();

        thread::spawn(move || {
            let mut reader = reader;
            let mut buf = [0u8; 4096];
            let exit_code;

            loop {
                if shutdown.load(Ordering::SeqCst) {
                    exit_code = None;
                    break;
                }
                match reader.read(&mut buf) {
                    Ok(0) | Err(_) => {
                        exit_code = None;
                        break;
                    }
                    Ok(n) => {
                        on_data(buf[..n].to_vec());
                    }
                }
            }

            if !shutdown.load(Ordering::SeqCst) {
                on_exit(exit_code);
            }
        });

        Ok(())
    }

    fn stop_reader(&self) {
        self.shutdown.store(true, Ordering::SeqCst);
    }
}
