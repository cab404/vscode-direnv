'use strict'

import * as path from 'path'
import { exec, execSync, ExecOptionsWithStringEncoding } from 'child_process'
import * as constants from './constants'
import * as utils from './utils'
import { threadId } from 'worker_threads'

interface CommandExecOptions {
    cmd: string
    cwd?: boolean
}

/**
 * Command class
 */
export class Command {
    rootPath: string
    rcPath: string
    constructor(rootPath: string) {
        this.rootPath = rootPath
        this.rcPath = path.join(rootPath, `.envrc`)
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
        const execOptions: ExecOptionsWithStringEncoding = { encoding: 'utf8' }
        if (options.cwd == null || options.cwd) {
            execOptions.cwd = this.rootPath
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
    // Public methods
    version = () => this.execAsync({ cmd: 'version' })
    allow = () => this.execAsync({ cmd: 'allow' })
    exportJSON = () => this.execAsync({ cmd: 'export json' }).then(f => f ? JSON.parse(f) : {})
    exportJSONSync = () => {
        const o = this.execSync({ cmd: 'export json' })
        return o ? JSON.parse(o) : {}
    }
}
