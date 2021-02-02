'use strict'

export const direnv = {
    name: 'direnv',
    cmd: 'direnv',
    rc: '.envrc'
}

export const vscode = {
    commands: {
        open: 'vscode.open'
    },
    extension: {
        actions: {
            allow: 'Allow',
            revert: 'Revert',
            view: 'View'
        }
    }
}

export const messages = {
    error: (e) => `direnv error: ` + (e.message || e),
    version: (v) => `direnv version: ` + v,
    reverted: `direnv: You are now using the old environment.`,
    assign: {
        success: `direnv: loaded successfully!`,
        warn: `direnv: Your .envrc is blocked!`,
        allow: `direnv: Would you like to allow this .envrc?`
    },
    rc: {
        changed: `direnv: Your .envrc has changed.`,
        deleted: `direnv: You deleted the .envrc. Would you like to revert to the old environment?`
    }
}
