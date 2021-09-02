'use strict'

import * as vscode from 'vscode'
import * as utils from './utils'
import * as constants from './constants'
import { Command } from './command'
import { TerminalProfileProvider } from 'vscode'

const restartExtensionHost = () => vscode.commands.executeCommand("workbench.action.restartExtensionHost")
const command = new Command(vscode.workspace.rootPath)

const displayError = (e) => vscode.window.showErrorMessage(constants.messages.error(e))
const handleError = (t: Thenable<any>) => t.then(undefined, displayError)

const version = () =>
    command.version().then(v => vscode.window.showInformationMessage(constants.messages.version(v)), displayError)
const revertFromOption = (option) => {
    if (option === constants.vscode.extension.actions.revert) {
        restartExtensionHost()
    }
}

const statusOverrides = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0)

const envrcBlockedMessage = async () => {
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

/** Contains current difference from system environment */
const envDiff: any = {}

class DirenvTerminalProfile implements TerminalProfileProvider {
    provideTerminalProfile(token: vscode.CancellationToken): vscode.ProviderResult<vscode.TerminalProfile> {
        return new vscode.TerminalProfile({ message: `loaded ${Object.keys(envDiff).length} var(s) from direnv;`, env: envDiff })
    }
}
vscode.window.registerTerminalProfileProvider("direnv", new DirenvTerminalProfile())

/** Returns a promise with decoded JSON from `direnv export`.
 * @param sync Whether returned promise is already resolved.
*/
const direnvExport = (sync: boolean) => {
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

/** Applies changes from direnv export to envDiff and process.env */
const applyDirenvJson = (changes: any) => {
    utils.assign(process.env, changes)
    return utils.assign(envDiff, changes)
}

/** Updates direnv indicator with a current overridden env variable count */
const refreshIndicator = async () => {
    // ignoring direnv variables in total count of variables
    const len = Object.keys(envDiff).filter((k) => !k.startsWith("DIRENV_")).length
    statusOverrides.text = `$(find-replace)${len}`
    statusOverrides.tooltip = `direnv: ${len} overridden variables`
    statusOverrides.show()
}

/** Gives user an option to restart extension host if there are changes in given change list. */
const reloadIfChanged = async (changes: utils.ChangeList) => {
    // ignoring direnv changes, they happen every change of file.
    changes = Object.keys(changes).filter((k) => !k.startsWith("DIRENV_"))
    if (changes.length > 0) {
        const action = await vscode.window.showWarningMessage(`${changes.length} variables changed, reload extensions?`, "Reload")
        if (action == "Reload")
            restartExtensionHost()
    }
}

const allow = () => {
    return command.allow()
        .then(() => direnvExport(false))
        .then(applyDirenvJson)
        .then((changes) => {
            reloadIfChanged(changes)
            refreshIndicator()
        })
}

const allowFromOption = (option) => {
    if (option === constants.vscode.extension.actions.allow) {
        return allow()
    }
}

const handleDirenvError = async (err) => {
    console.log("direnv error:", err)
    if (err.message.indexOf(`.envrc is blocked`) !== -1) {
        envrcBlockedMessage()
    } else {
        vscode.window.showErrorMessage(constants.messages.error(err))
    }
}

// commands
const reloadAsync = () => direnvExport(false)
    .then(applyDirenvJson)
    .then((changes) => {
        reloadIfChanged(changes)
        refreshIndicator()
    })
    .catch(handleDirenvError)

const viewEnvrc = () => handleError(vscode.commands.executeCommand('vscode.open', vscode.Uri.file(command.rcPath)))
const viewThenAllow = () => viewEnvrc().then(() =>
    vscode.window.showInformationMessage(constants.messages.assign.allow,
        constants.vscode.extension.actions.allow)).then(allowFromOption)

// .envrc changes
{
    const watcher = vscode.workspace.createFileSystemWatcher(command.rcPath, true)

    watcher.onDidChange((e) => vscode.window.showWarningMessage(
        `direnv: Your .envrc has changed.`,
        constants.vscode.extension.actions.allow).then(allowFromOption)
    )
    watcher.onDidDelete((e) => vscode.window.showWarningMessage(
        `direnv: You deleted the .envrc. Would you like to revert to the old environment?`,
        constants.vscode.extension.actions.revert).then(revertFromOption)
    )
}

// Actual initialization below

// These would execute synchronously, this is just a nice syntax to do dependent operations.
const changes = direnvExport(true).then(applyDirenvJson)

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('direnv.version', version))
    context.subscriptions.push(vscode.commands.registerCommand('direnv.view', viewEnvrc))
    context.subscriptions.push(vscode.commands.registerCommand('direnv.allow', allow))
    context.subscriptions.push(vscode.commands.registerCommand('direnv.reload', reloadAsync))

    // Now is the time to show errors (if any) and refresh (env var count) indicator
    changes
        .then(refreshIndicator)
        .catch(handleDirenvError)
}

export function deactivate(): void {
    /* okay to be empty */
}
