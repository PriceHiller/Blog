#![deny(clippy::all)]

mod grammar;
mod highlight;

use napi_derive::napi;
use std::sync::OnceLock;

use crate::highlight::HighlighterContext;

static CONTEXT: OnceLock<HighlighterContext> = OnceLock::new();

fn get_context() -> &'static HighlighterContext {
    CONTEXT.get_or_init(HighlighterContext::default)
}

#[napi]
pub fn highlight(code: String, lang: String) -> napi::Result<String> {
    get_context()
        .highlight(&code, &lang)
        .map_err(napi::Error::from_reason)
}
