use anyhow::{Context, Result};
use clap::Parser;
use log::{debug, info, warn};
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};
use thirtyfour::error::WebDriverResult;
use thirtyfour::{By, DesiredCapabilities, WebDriver, WebElement};

#[derive(Debug, Parser)]
#[command(
    name = "snap",
    version,
    about = "Capture website screenshots with Firefox via WebDriver",
    long_about = "snap captures a screenshot of a website using your existing \
                  Firefox installation in headless mode. It never installs or \
                  launches Chromium/Chrome."
)]
struct Args {
    /// URL of the website to capture
    #[arg(value_name = "URL")]
    url: Option<String>,

    /// Capture every app listed in APPS (from the repo README) to page/images/<app>.png
    #[arg(long)]
    apps: bool,

    /// Output path for the PNG screenshot
    #[arg(short, long, value_name = "PATH")]
    output: Option<String>,

    /// Viewport width in pixels
    #[arg(long, default_value_t = 1280, value_name = "PX")]
    width: u32,

    /// Viewport height in pixels
    #[arg(long, default_value_t = 640, value_name = "PX")]
    height: u32,

    /// Maximum seconds to wait for the page to finish loading
    #[arg(long, default_value_t = 30, value_name = "SECS")]
    timeout: u64,

    /// Additional delay in milliseconds after the page loads
    #[arg(long, default_value_t = 3000, value_name = "MS")]
    settle: u64,

    /// Address of the running geckodriver instance
    #[arg(
        long,
        env = "GECKODRIVER_URL",
        default_value = "http://127.0.0.1:9515",
        value_name = "URL"
    )]
    geckodriver: String,

    /// Firefox binary to use (overrides auto-detection)
    #[arg(long, env = "FIREFOX_BINARY", value_name = "PATH")]
    firefox_binary: Option<String>,
}

/// Repo root relative to this crate (scripts/rust/snap -> repo root).
const REPO_ROOT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../../..");

/// Apps linked from the repo README as https://hieudoanm.github.io/<app>.
const APPS_BASE: &str = "https://hieudoanm.github.io";
const APPS: &[&str] = &[
    "grobid.rs",
    "linguae",
    "llm.rs",
    "tracers",
    "transcribers",
    "neuro.lab",
    "design.system.design",
    "fdr",
    "fr55",
    "vectors",
    "neo.bank",
];

/// page/images directory in the repo (created if missing).
fn images_dir() -> PathBuf {
    let dir = Path::new(REPO_ROOT).join("page/images");
    if let Err(e) = std::fs::create_dir_all(&dir) {
        warn!("failed to create {}: {e}", dir.display());
    }
    std::fs::canonicalize(&dir).unwrap_or(dir)
}

fn default_output() -> std::path::PathBuf {
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    images_dir().join(format!("snap-{stamp}.png"))
}

/// Launch Firefox (headless) through geckodriver and return a connected
/// WebDriver session sized to the requested viewport.
async fn connect(args: &Args) -> Result<WebDriver> {
    let mut caps = DesiredCapabilities::firefox();
    caps.set_headless().context("failed to configure headless mode")?;
    caps.add_arg(&format!("-width={}", args.width))
        .context("failed to set Firefox width argument")?;
    caps.add_arg(&format!("-height={}", args.height))
        .context("failed to set Firefox height argument")?;

    if let Some(binary) = &args.firefox_binary {
        info!("Using Firefox binary: {binary}");
        caps.set_firefox_binary(binary)
            .context("failed to set Firefox binary path")?;
    }

    info!("Connecting to geckodriver at {}", args.geckodriver);
    let driver = WebDriver::new(&args.geckodriver, caps)
        .await
        .context(
            "failed to start a WebDriver session; is geckodriver running? \
             Start it with `geckodriver` and retry (see README)",
        )?;

    info!("Setting viewport to {}x{}", args.width, args.height);
    driver
        .set_window_rect(0, 0, args.width, args.height)
        .await
        .context("failed to set the browser window size")?;

    // set_window_rect sizes the outer window; browser chrome (tabs, URL bar)
    // shrinks the actual viewport. Measure window.innerWidth/innerHeight and
    // grow the window by the difference so the viewport matches exactly.
    for _ in 0..3 {
        let inner: (u32, u32) = driver
            .execute(
                "return [window.innerWidth, window.innerHeight]",
                Vec::<Value>::new(),
            )
            .await
            .and_then(|ret| ret.convert())
            .unwrap_or((0, 0));

        debug!("viewport inner size = {}x{}", inner.0, inner.1);
        if inner == (args.width, args.height) {
            break;
        }

        let w = args.width as i64 + (args.width as i64 - inner.0 as i64);
        let h = args.height as i64 + (args.height as i64 - inner.1 as i64);
        driver
            .set_window_rect(0, 0, w.max(0) as u32, h.max(0) as u32)
            .await
            .context("failed to adjust the browser window size")?;
    }

    Ok(driver)
}

/// Navigate to `url` and wait until the document reaches readyState
/// "complete" (or `timeout` elapses, in which case we continue anyway —
/// some pages never reach "complete").
async fn navigate(driver: &WebDriver, args: &Args, url: &str) -> Result<()> {
    info!("Navigating to {url}");
    driver
        .goto(url)
        .await
        .context("failed to navigate to the URL")?;

    let deadline = Instant::now() + Duration::from_secs(args.timeout);
    loop {
        let ready: String = driver
            .execute("return document.readyState", Vec::<Value>::new())
            .await
            .and_then(|ret| ret.convert())
            .unwrap_or_else(|_| "unknown".to_string());

        debug!("document.readyState = {ready}");
        if ready == "complete" || Instant::now() >= deadline {
            if ready != "complete" {
                info!("Page did not reach readyState=complete before timeout; continuing");
            }
            break;
        }
        tokio::time::sleep(Duration::from_millis(200)).await;
    }

    if args.settle > 0 {
        debug!("Settling for {} ms", args.settle);
        tokio::time::sleep(Duration::from_millis(args.settle)).await;
    }

    Ok(())
}

/// Capture the visible viewport and write it to `output` as a PNG.
async fn capture(driver: &WebDriver, output: &Path) -> Result<()> {
    info!("Capturing screenshot to {}", output.display());
    driver
        .screenshot(output)
        .await
        .with_context(|| format!("failed to write screenshot to {}", output.display()))?;
    Ok(())
}

/// Shut the browser session down explicitly instead of relying on Drop.
async fn close(driver: WebDriver) {
    debug!("Closing browser session");
    if let Err(e) = driver.quit().await {
        warn!("error while quitting WebDriver session: {e}");
    }
}

#[allow(dead_code)]
async fn find_element(driver: &WebDriver, selector: &str) -> WebDriverResult<WebElement> {
    driver.find(By::Css(selector)).await
}

/// Capture every app in APPS to page/images/<app>.png, reusing one browser
/// session. Per-app failures are logged and reported at the end.
async fn run_apps(args: &Args) -> Result<()> {
    let dir = images_dir();
    info!("Capturing {} apps to {}", APPS.len(), dir.display());

    let driver = connect(args).await?;
    let mut failures = 0usize;

    for app in APPS {
        let url = format!("{APPS_BASE}/{app}/");
        let output = dir.join(format!("{app}.png"));
        let result = async {
            navigate(&driver, args, &url).await?;
            capture(&driver, &output).await
        }
        .await;

        match result {
            Ok(()) => info!("Done: {}", output.display()),
            Err(e) => {
                failures += 1;
                warn!("failed to capture {url}: {e:#}");
            }
        }
    }

    close(driver).await;

    if failures > 0 {
        anyhow::bail!("{failures}/{} app screenshots failed", APPS.len());
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let args = Args::parse();

    if args.apps {
        return run_apps(&args).await;
    }

    let url = args
        .url
        .as_deref()
        .context("a URL is required (or use --apps to capture all listed apps)")?;
    let output = args
        .output
        .as_deref()
        .map(PathBuf::from)
        .unwrap_or_else(default_output);

    let driver = connect(&args).await?;

    let result = async {
        navigate(&driver, &args, url).await?;
        capture(&driver, &output).await
    }
    .await;

    close(driver).await;

    match result {
        Ok(()) => {
            info!("Done: {}", output.display());
            Ok(())
        }
        Err(e) => Err(e.context("snapshot failed; session closed")),
    }
}
