'use strict'

import * as vscode from 'vscode'
import * as utils from './utils'
import * as constants from './constants'
import { Command } from './command'

const restartExtensionHost = () => vscode.commands.executeCommand("workbench.action.restartExtensionHost")
const command = new Command(vscode.workspace.rootPath)
const watcher = vscode.workspace.createFileSystemWatcher(command.rcPath, true)

const displayError = (e) => vscode.window.showErrorMessage(constants.messages.error(e))
const handleError = (t: Thenable<any>) => t.then(undefined, displayError)

const version = () =>
    command.version().then(v => vscode.window.showInformationMessage(constants.messages.version(v)), displayError)
const revertFromOption = (option) => {
    if (option === constants.vscode.extension.actions.revert) {
        restartExtensionHost()
    }
}

const status_overrides = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0)
status_overrides.tooltip = "direnv environment active; click to reload"

const envrc_blocked_message = async () => {
    const opts = [
        "Allow", "View .envrc"
    ]
    const option = await vscode.window.showWarningMessage(
        `direnv: Your .envrc is blocked!`,
        ...opts
    )
    switch (opts.indexOf(option)) {
        case 0: return allow()
        case 1: return viewThenAllow()
    }
}

const initial_env_diff : any = {}

const direnv_export = (sync: boolean) => {
    if (sync) {
        try {
            return Promise.resolve(command.exportJSONSync())
        } catch (err) {
            return Promise.reject(err)
        }
    } else {
        return command.exportJSON()
    }
}

const apply_direnv_json = (changes: any) => {
    return utils.assign(initial_env_diff, changes)
}

const refresh_indicator = async () => {
    // ignoring direnv variables in total count of variables
    const len = Object.keys(initial_env_diff).filter((k) => !k.startsWith("DIRENV_")).length
    status_overrides.text = `$(find-replace)${len}`
    status_overrides.tooltip = `direnv: ${len} overriden variables`
    status_overrides.show()
}

const reload_if_changed = async (changes: utils.ChangeList) => {
    // ignoring direnv changes, they happen every change of file.
    changes = Object.keys(changes).filter((k) => !k.startsWith("DIRENV_"))
    if (changes.length > 0) {
        vscode.window.showInformationMessage(`Keys ${changes} changed, reloading extensions.`)
        await restartExtensionHost()
    }
}

const allow = () => {
    return command.allow()
        .then(() => direnv_export(false))
        .then(apply_direnv_json)
        .then(async (changes) => {
            await reload_if_changed(changes)
            await refresh_indicator()
            vscode.window.showInformationMessage("direnv: .envrc applied!")
        })
}

const allowFromOption = (option) => {
    if (option === constants.vscode.extension.actions.allow) {
        return allow()
    }
}

// commands
const reloadAsync = () => direnv_export(false)
    .then(apply_direnv_json)
    .then(async () => {
        await refresh_indicator()
        await vscode.window.showInformationMessage("direnv: .envrc applied!")
    })
    .catch(async (err) => {
        if (err.message.indexOf(`.envrc is blocked`) !== -1) {
            await envrc_blocked_message()
        } else {
            await vscode.window.showErrorMessage(constants.messages.error(err))
        }
    })

const viewEnvrc = () => handleError(vscode.commands.executeCommand('vscode.open', vscode.Uri.file(command.rcPath)))
const viewThenAllow = () => viewEnvrc().then(() =>
    vscode.window.showInformationMessage(constants.messages.assign.allow,
        constants.vscode.extension.actions.allow)).then(allowFromOption)

// .envrc changes
watcher.onDidChange((e) => vscode.window.showWarningMessage(
    `direnv: Your .envrc has changed.`,
    constants.vscode.extension.actions.allow).then(allowFromOption)
)
watcher.onDidDelete((e) => vscode.window.showWarningMessage(
    `direnv: You deleted the .envrc. Would you like to revert to the old environment?`,
    constants.vscode.extension.actions.revert).then(revertFromOption)
)

// This means plugin activation state isn't actually respected.
const changes = direnv_export(true).then(apply_direnv_json)

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('direnv.version', version))
    context.subscriptions.push(vscode.commands.registerCommand('direnv.view', viewEnvrc))
    context.subscriptions.push(vscode.commands.registerCommand('direnv.allow', allow))
    context.subscriptions.push(vscode.commands.registerCommand('direnv.reload', reloadAsync))
    Promise.resolve(changes).then(refresh_indicator)
}

export function deactivate() {
    /* okay to be empty */
}
