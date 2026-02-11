//! Optional harness config file with named profiles.
//!
//! Location: `./harness.json` or `~/.config/harness/config.json`
//! (first found wins; `--config` only selects the MCP server config).
//!
//! ```json
//! {
//!   "profile": "work",
//!   "profiles": {
//!     "work": {
//!       "mcpConfig": "~/work/mcp.json",
//!       "allow": ["tracers__*"],
//!       "deny": ["llm__train"],
//!       "env": { "LLM_MODEL": "gpt-4o", "LLM_BASE_URL": "..." }
//!     }
//!   }
//! }
//! ```

use anyhow::{Context, Result};
use serde::Deserialize;
use std::path::PathBuf;

#[derive(Debug, Deserialize, Default)]
pub struct HarnessConfig {
    /// Active profile name (overridden by --profile).
    #[serde(default)]
    pub profile: Option<String>,
    #[serde(default)]
    pub profiles: std::collections::HashMap<String, Profile>,
}

#[derive(Debug, Deserialize, Default)]
pub struct Profile {
    /// Path to the MCP servers config for this profile.
    #[serde(rename = "mcpConfig", default)]
    pub mcp_config: Option<String>,
    #[serde(default)]
    pub allow: Vec<String>,
    #[serde(default)]
    pub deny: Vec<String>,
    /// Env vars applied before LLM client construction.
    #[serde(default)]
    pub env: std::collections::HashMap<String, String>,
}

impl HarnessConfig {
    /// Load the first config file found, apply the selected profile,
    /// and return (mcp_config_override, allow, deny).
    /// Env vars from the profile are set process-wide.
    pub fn load(_profile_flag: Option<&str>) -> Result<Option<Self>> {
        let path = [PathBuf::from("harness.json"), home_config()]
            .into_iter()
            .find(|p| p.is_file());
        let Some(path) = path else {
            return Ok(None);
        };
        let text = std::fs::read_to_string(&path)
            .with_context(|| format!("cannot read {}", path.display()))?;
        let cfg: HarnessConfig =
            serde_json::from_str(&text).context("invalid harness config JSON")?;
        Ok(Some(cfg))
    }

    /// Resolve which profile to use: flag > top-level "profile".
    pub fn active_profile<'a>(&'a self, flag: Option<&'a str>) -> Option<&'a str> {
        flag.or(self.profile.as_deref())
    }

    /// Apply a profile: set env vars, return (mcp_config, allow, deny).
    pub fn apply(&self, name: &str) -> Result<(Option<String>, Vec<String>, Vec<String>)> {
        let profile = self
            .profiles
            .get(name)
            .with_context(|| format!("unknown profile '{name}'"))?;
        for (k, v) in &profile.env {
            // SAFETY: single-threaded config phase at startup.
            unsafe { std::env::set_var(k, v) };
        }
        Ok((
            profile.mcp_config.clone(),
            profile.allow.clone(),
            profile.deny.clone(),
        ))
    }
}

fn home_config() -> PathBuf {
    std::env::var_os("HOME")
        .map(|h| PathBuf::from(h).join(".config/harness/config.json"))
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cfg() -> HarnessConfig {
        let mut profiles = std::collections::HashMap::new();
        profiles.insert(
            "work".to_string(),
            Profile {
                mcp_config: Some("~/work/mcp.json".into()),
                allow: vec!["tracers__*".into()],
                deny: vec!["llm__train".into()],
                env: [("LLM_MODEL".to_string(), "gpt-4o".to_string())]
                    .into_iter()
                    .collect(),
            },
        );
        HarnessConfig {
            profile: Some("work".into()),
            profiles,
        }
    }

    #[test]
    fn flag_overrides_top_level_profile() {
        let c = cfg();
        assert_eq!(c.active_profile(Some("work")), Some("work"));
        assert_eq!(c.active_profile(None), Some("work"));
    }

    #[test]
    fn apply_returns_profile_settings() {
        let c = cfg();
        let (mcp, allow, deny) = c.apply("work").unwrap();
        assert_eq!(mcp.as_deref(), Some("~/work/mcp.json"));
        assert_eq!(allow, vec!["tracers__*".to_string()]);
        assert_eq!(deny, vec!["llm__train".to_string()]);
        assert_eq!(std::env::var("LLM_MODEL").unwrap(), "gpt-4o");
    }

    #[test]
    fn unknown_profile_errors() {
        assert!(cfg().apply("nope").is_err());
    }
}
