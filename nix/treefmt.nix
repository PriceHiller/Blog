# See https://github.com/numtide/treefmt-nix/
{ ... }:
{
  projectRootFile = "flake.nix";
  programs.prettier.enable = true;
  programs.nixfmt.enable = true;
  programs.rustfmt.enable = true;
}
