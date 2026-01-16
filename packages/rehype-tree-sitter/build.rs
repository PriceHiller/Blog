use std::fs;
use std::path::{Path, PathBuf};

fn compile_grammar(lib_name: &str, src_dir: &Path) {
    let parser_path = src_dir.join("parser.c");

    // Safety check: if the path doesn't exist, don't crash, just print warning or skip
    if !parser_path.exists() {
        println!(
            "cargo:warning=Skipping {} because parser.c was not found at {:?}",
            lib_name, parser_path
        );
        return;
    }

    let mut c_config = cc::Build::new();
    c_config.include(src_dir);
    c_config.file(parser_path);

    // Standard scanner detection
    if src_dir.join("scanner.c").exists() {
        c_config.file(src_dir.join("scanner.c"));
    } else if src_dir.join("scanner.cc").exists() {
        c_config.cpp(true);
        c_config.file(src_dir.join("scanner.cc"));
    }

    c_config.compile(lib_name);
}

fn main() {
    napi_build::setup();

    let grammars_dir = PathBuf::from("grammars");

    // 1. Automatic Discovery for Standard Repos
    // (Python, Bash, Javascript, Nix, etc.)
    if let Ok(entries) = fs::read_dir(&grammars_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let src_dir = path.join("src");
                // Only auto-compile if src/parser.c exists immediately inside
                if src_dir.join("parser.c").exists() {
                    let folder_name = path.file_name().unwrap().to_string_lossy();
                    compile_grammar(&folder_name, &src_dir);
                }
            }
        }
    }

    // 2. Manual Exceptions (Monorepos or weird structures)
    let ts_base = grammars_dir.join("tree-sitter-typescript");

    // TypeScript
    compile_grammar(
        "tree-sitter-typescript",
        &ts_base.join("typescript").join("src"),
    );

    // TSX
    compile_grammar("tree-sitter-tsx", &ts_base.join("tsx").join("src"));

    println!("cargo:rerun-if-changed=grammars");
}
