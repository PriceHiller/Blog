{
  bun2nix,
  rustPlatform,
  cargo,
  rustc,
  ...
}:
let

in
bun2nix.mkDerivation {
  packageJson = ./package.json;

  src = ./.;

  # We need to build the rust-based highlighter in the isolated build
  # environment Nix creates, if we just do a normal `bun run build` then the
  # napi CLI will try to hit up crates.io for packages which is blocked in the
  # Nix build environment. So we have to build the highlighter dependencies
  # BEFORE issuing any `bun run build` etc stuff.
  nativeBuildInputs = [
    cargo
    rustPlatform.cargoSetupHook
    rustc
  ];
  cargoRoot = "packages/rehype-tree-sitter";
  cargoDeps = rustPlatform.importCargoLock {
    lockFile = ./packages/rehype-tree-sitter/Cargo.lock;
  };

  # See docs for bun2nix over @ https://nix-community.github.io/bun2nix/
  bunDeps = bun2nix.fetchBunDeps {
    bunNix = ./bun-lock.nix;
    # Necessary to make `sharp` detectable by astro
    useFakeNode = false;
  };

  buildPhase = ''
    bun run build
  '';

  installPhase = ''
    cp -r ./dist/ $out
  '';
}
