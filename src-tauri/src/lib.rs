use tauri::App;

// 桌面端依赖
#[cfg(desktop)]
mod desktops;

// 移动端依赖
#[cfg(mobile)]
mod mobiles;

pub type SetupHook = Box<dyn FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send>;

#[derive(Default)]
pub struct AppBuilder {
    setup: Option<SetupHook>,
}

impl AppBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn setup<F>(mut self, setup: F) -> Self
    where
        F: FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send + 'static,
    {
        self.setup.replace(Box::new(setup));
        self
    }

    pub fn run(self) {
        #[cfg(desktop)]
        desktops::setup::setup_desktop();

        #[cfg(mobile)]
        mobiles::setup::setup_mobile();
    }
}
