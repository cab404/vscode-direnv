{
  inputs = {
    utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        attrs = with builtins; fromJSON (readFile ./package.json);
        pkgs = import nixpkgs { inherit system; };
      in {
          defaultPackage = self.packages.${system}.vsix;

          packages.vsix = pkgs.mkYarnPackage {
            src = ./.;
            name = with attrs; "${name}-${version}.vsix";
            # Not sure how it happened that vscode-direnv symlink gets through .vscodeignore.
            # But it completely destroys vsce with mystic symlink message, which actually mean that it's gets broken.
            # Took a long time to solve
            buildPhase = with attrs; ''
              rm deps/${name}/${name}
              yarn vsce package --yarn
            '';
            # Nothing needed out there.
            distPhase = ":";
            # Just move vsix to result, without any smartness.
            installPhase = with attrs; ''
              mv deps/${name}/${name}-${version}.vsix $out
            '';
            passthru = {
              extId = with attrs; "${publisher}.${name}";
            };
          };

          packages.extension = let
            vsix = self.packages.${system}.defaultPackage;
          in
          pkgs.vscode-utils.buildVscodeExtension {
            name = attrs.name;
            vscodeExtUniqueId = vsix.extId;
            src = vsix;
            unpackPhase = "unzip $src; cd extension";
          };

          devShell = with pkgs; mkShell {
            nativeBuildInputs = [ yarn ];
          };
      }
    );

}
