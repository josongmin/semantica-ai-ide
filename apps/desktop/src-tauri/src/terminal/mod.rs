//! Terminal Module — Hexagonal Architecture Root
//!
//! ```text
//! ┌─────────────────────────────────────────────────┐
//! │              Inbound Adapters                   │
//! │         (tauri_commands.rs)                      │
//! │                   │                             │
//! │           ┌───────▼───────┐                     │
//! │           │  Application  │                     │
//! │           │  (Services)   │                     │
//! │           └───────┬───────┘                     │
//! │                   │                             │
//! │           ┌───────▼───────┐                     │
//! │           │    Domain     │                     │
//! │           │ (Types/Ports) │                     │
//! │           └───────┬───────┘                     │
//! │                   │                             │
//! │           ┌───────▼───────┐                     │
//! │           │   Outbound    │                     │
//! │           │  Adapters     │                     │
//! │           │ (PTY, Events) │                     │
//! │           └───────────────┘                     │
//! └─────────────────────────────────────────────────┘
//! ```

pub mod adapters;
pub mod application;
pub mod domain;
pub mod state;

// Re-export what lib.rs needs for composition root
pub use adapters::inbound::tauri_commands::*;
pub use state::TerminalAppState;
