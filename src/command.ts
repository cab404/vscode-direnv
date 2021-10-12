'use strict'

import * as path from 'path'
import { exec, execSync, ExecOptionsWithStringEncoding } from 'child_process'
import * as constants from './constants'
import * as utils from './utils'
import { threadId } from 'worker_threads'
import { env } from 'process'

interface CommandExecOptions {
    cmd: string,
    env?: { [k: string]: string }
}

/**
 * Command class
 */
export class Command {
    rootPath: string
    rcPath: string

    constructor(rootPath: string) {
        this.rootPath = rootPath
        // TODO: add exception on non-existent direnv binary
        try {
            this.rcPath = this.envrcPath()
        } catch (err) {
            // Not really interested in catching this error.
            console.log("Failed to get .envrc path")
            this.rcPath = null
        }
    }

    // Private methods
    private execAsync(options: CommandExecOptions): Promise<string> {
        return <Promise<string>>this.exec(false, options)
    }

    private execSync(options: CommandExecOptions): string {
        return <string>this.exec(true, options)
    }

    private exec(sync: boolean, options: CommandExecOptions): Promise<string> | string {
        const direnvCmd = [constants.direnv.cmd, options.cmd].join(' ')
        const execOptions: ExecOptionsWithStringEncoding = { encoding: 'utf8', cwd: this.rootPath }

        if (options.env != undefined) {
            // this one is not as straightforward as one would want.
            execOptions.env = {}
            Object.assign(execOptions.env, process.env)
            Object.assign(execOptions.env, options.env)
        }

        if (sync) {
            console.log("NOTE: executing command synchronously", direnvCmd)
            return execSync(direnvCmd, execOptions)
        } else {
            return new Promise((resolve, reject) => {
                exec(direnvCmd, execOptions, (err, stdout, stderr) => {
                    if (err) {
                        err.message = stderr
                        reject(err)
                    } else {
                        resolve(stdout)
                    }
                })
            })
        }
    }

    private envrcPath = () => this.execSync({ cmd: 'edit', env: { "EDITOR": "echo" } }).trimEnd()

    // Public methods
    envrcExists = () => this.rcPath != null
    version = () => this.execAsync({ cmd: 'version' })
    allow = () => this.execAsync({ cmd: 'allow' })
    exportJSON = () => this.execAsync({ cmd: 'export json' }).then(f => f ? JSON.parse(f) : {})
    exportJSONSync = () => {
        const o = this.execSync({ cmd: 'export json' })
        return o ? JSON.parse(o) : {}
    }
}
