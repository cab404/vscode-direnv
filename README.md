# [direnv](https://github.com/direnv/direnv) for Visual Studio Code

This extension adds support for direnv to VS Code, including:

* Auto-load the environment if the .envrc file is allowed
* Prompt to allow the .envrc if it is not when VS Code opens
* View / Allow the .envrc via commands
* Auto-detect .envrc when it is created
* Auto-detect changes to .envrc
* Auto-detect deletion of .envrc and prompt to revert your environment

### Changes since 1.0.0
+ Added direnv terminal profile. You can select it with `> Terminal: Select default profile`.
* Fixed "view .envrc" on projects where .envrc is not in the root

## Prerequisites

This extension needs direnv installed to work. Please refer [here](https://github.com/direnv/direnv#install) for installation instructions.
## Install

Via Quick Open:

1. [Download](https://vscodium.com/#install), install and open VS Codium (or VS Code)
2. Press `ctrl+p` to open the Quick Open dialog
3. Type `ext install direnv`
4. Click the *Install* button, then the *Enable* button

Via the Extensions tab:

1. Click the extensions tab or press `cmd+shift+x`
2. Search for *direnv*
3. Click the *Install* button, then the *Enable* button

Via the command line:

1. Open a command-line prompt
2. Run `codium --install-extension cab404.vscode-direnv`

## Usage

The following describes the usage of this extension that is automatically enabled each time you open up VS Code.

### Automation

* If you have a `.envrc` file on the workspace root it will try to load it to the environment. If you haven't allowed it yet then it will prompt you to do so.
* If you have no `.envrc` and you try to view it or allow it you get a prompt to create it.
* If you edit and save the `.envrc` it will prompt you to allow it.
* If you delete the `.envrc` it will prompt you to revert the environment.

### Commands

In order to run a command press `cmd+shift+p` to view the Command Palette. There type:

* `direnv allow` to allow and load the current `.envrc`
* `direnv view` to view your `.envrc` and make changes
* `direnv version` to view the current `direnv` version
* `direnv reload` to reload `.envrc` file

## Contribute

For any bugs and feature requests please open an issue. For code contributions please create a pull request. Enjoy!
