'use strict'

export type ChangeList = any

export function assign(destination: any, ...sources: any[]): ChangeList {
    const changes = {}
    sources.forEach(source => Object.keys(source).forEach((key) => {
        if (source[key] != destination[key]) {
            if (source[key] == null) {
                changes[key] = null
                delete destination[key]
            } else {
                changes[key] = destination[key]
                destination[key] = source[key]
            }
        }
    }))
    return changes
}
