{
  inputs = {
    utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        node2nixSources = with pkgs;
        runCommand "sources" {
          nativeBuildInputs = [nodePackages.node2nix];
        } ''
          cp -r ${./.} $out
          cd $out
          node2nix -l
        '';
      in {
          defaultPackage = (import node2nixSources { inherit pkgs; }).package;

          devShell = with pkgs; mkShell {
            nativeBuildInputs = [ nodejs ];
          };
      }
    );

}
