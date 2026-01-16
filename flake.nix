{
  description = "BLG Workspace Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    bun2nix = {
      url = "github:nix-community/bun2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    self.submodules = true;
  };

  nixConfig = {
    extra-substituters = [
      "https://cache.nixos.org"
      "https://nix-community.cachix.org"
    ];
    extra-trusted-public-keys = [
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  outputs =
    inputs@{ ... }:
    let
      forEachSystem =
        function:
        inputs.nixpkgs.lib.genAttrs (import inputs.systems) (
          system:
          function (
            import inputs.nixpkgs {
              inherit system;
              overlays = [ inputs.bun2nix.overlays.default ];
            }
          )
        );

    in
    {
      formatter =
        let
          treefmtEval = forEachSystem (pkgs: inputs.treefmt-nix.lib.evalModule pkgs ./nix/treefmt.nix);
        in
        forEachSystem (pkgs: treefmtEval.${pkgs.stdenv.hostPlatform.system}.config.build.wrapper);
      packages = forEachSystem (pkgs: {
        default = pkgs.callPackage ./nix/blog-package.nix { };
      });

      devShells = forEachSystem (pkgs: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            bun2nix
          ];

          shellHook = ''
            bun install --frozen-lockfile
          '';
        };
      });
    };
}
