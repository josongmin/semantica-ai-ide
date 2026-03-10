//! System Clock — real clock implementation of the Clock port.

use crate::terminal::domain::ports::Clock;

pub struct SystemClock;

impl Clock for SystemClock {
    #[allow(clippy::cast_possible_truncation)]
    fn now_ms(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64
    }
}
