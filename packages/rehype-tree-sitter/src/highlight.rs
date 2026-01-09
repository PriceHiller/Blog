use std::collections::HashMap;
use tree_sitter_highlight::{HighlightConfiguration, HighlightEvent, Highlighter};

use crate::grammar::LangConfig;

pub const HIGHLIGHTS: &[&str] = &[
    "keyword.operator",
    "keyword.import",
    "keyword.control",
    "keyword.function",
    "keyword.return",
    "keyword.type",
    "keyword.export",
    "keyword",
    "type",
    "type.builtin",
    "type.definition",
    "function",
    "function.builtin",
    "function.method",
    "function.macro",
    "constructor",
    "variable",
    "variable.builtin",
    "variable.member",
    "variable.parameter",
    "variable.parameter.builtin",
    "property",
    "attribute",
    "label",
    "string",
    "string.special",
    "string.escape",
    "string.regex",
    "number",
    "boolean",
    "constant",
    "constant.builtin",
    "comment",
    "comment.documentation",
    "operator",
    "punctuation",
    "punctuation.special",
    "punctuation.delimiter",
    "character",
    "tag",
    "tag.builtin",
    "tag.component",
    "tag.attribute",
    "tag.delimiter",
    "embedded",
    "escape",
];

pub struct HighlighterContext {
    configs: HashMap<String, HighlightConfiguration>,
    alias_map: HashMap<String, String>,
}

impl HighlighterContext {
    pub fn new() -> Self {
        let mut configs = HashMap::new();
        let mut alias_map = HashMap::new();

        for lang_config in LangConfig::all() {
            let primary_name = lang_config.name.to_string();
            let aliases = lang_config.aliases;

            alias_map.insert(primary_name.clone(), primary_name.clone());
            for &alias in aliases {
                alias_map.insert(alias.to_string(), primary_name.clone());
            }

            match lang_config.into_highlight_config(HIGHLIGHTS) {
                Ok(config) => {
                    configs.insert(primary_name.clone(), config);
                }
                Err(e) => {
                    eprintln!("Warning: Failed to load language {}: {}", primary_name, e);
                }
            }
        }

        Self { configs, alias_map }
    }

    pub fn get_config(&self, lang: &str) -> Option<&HighlightConfiguration> {
        let canonical = self.alias_map.get(&lang.to_lowercase())?;
        self.configs.get(canonical)
    }

    pub fn highlight(&self, code: &str, lang: &str) -> Result<String, String> {
        let config = self
            .get_config(lang)
            .ok_or(format!("Unsupported language: {lang}"))?;

        let code = code.trim_end();

        let mut highlighter = Highlighter::new();

        let highlights = highlighter
            .highlight(config, code.as_bytes(), None, |injection_lang| {
                self.get_config(injection_lang)
            })
            .map_err(|e| format!("Highlight error: {e:?}"))?;

        let mut output = String::new();
        let mut scope_stack: Vec<usize> = Vec::new();

        for event in highlights {
            match event {
                Ok(HighlightEvent::HighlightStart(s)) => {
                    scope_stack.push(s.0);
                }
                Ok(HighlightEvent::HighlightEnd) => {
                    scope_stack.pop();
                }
                Ok(HighlightEvent::Source { start, end }) => {
                    let text = &code[start..end];
                    if text.is_empty() {
                        continue;
                    }

                    let escaped = text
                        .replace("&", "&amp;")
                        .replace('"', "&quot;")
                        .replace("\'", "&#39;")
                        .replace('<', "&lt;")
                        .replace('>', "&gt;");

                    if let Some(hl) = scope_stack.last() {
                        let capture_name = &HIGHLIGHTS[*hl].replace(".", "-");
                        output.push_str(&format!(
                            "<span class=\"ts-{capture_name}\">{escaped}</span>"
                        ));
                    } else {
                        output.push_str(&escaped);
                    }
                }
                Err(_) => {}
            }
        }

        Ok(output)
    }
}

impl Default for HighlighterContext {
    fn default() -> Self {
        Self::new()
    }
}
