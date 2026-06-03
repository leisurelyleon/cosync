//! Global application state: the set of all rooms, shared across every
//! connection. Wrapped in `Arc` so axum can hand a clone to each request.

use std::sync::Arc;

use dashmap::DashMap;

use crate::room::Room;

/// The shared, cloneable application state.
#[derive(Clone)]
pub struct AppState {
    /// All active rooms, keyed by room id. `DashMap` gives us concurrent
    /// access without a global lock around the whole map.
    pub rooms: Arc<DashMap<String, Room>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(DashMap::new()),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
