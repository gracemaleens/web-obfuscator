/**
 * @file src/path-resolver.js
 * @description this file contains the path resolver
 * 
 * Copyright 2024 grace
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path')
const fs = require('fs').promises
const os = require('os')

class PathResolver {
    #executionDirectory
    #binDirectory
    #rootDirectory
    #homeDirectory

    constructor() {
        this.#executionDirectory = process.cwd()
        this.#binDirectory = process.pkg ? path.dirname(process.execPath) : this.#getRootDirectory()
        this.#rootDirectory = this.#getRootDirectory()
        this.#homeDirectory = os.homedir()
    }

    #getRootDirectory() {
        return path.resolve(path.dirname(process.argv[1]), '..')
    }

    resolveFromCwd(...paths) {
        return path.resolve(this.#executionDirectory, ...paths)
    }

    resolveFromBin(...paths) {
        return path.resolve(this.#binDirectory, ...paths)
    }

    resolveFromRoot(...paths) {
        return path.resolve(this.#rootDirectory, ...paths)
    }

    getRelativePath(fullpath, from = this.#executionDirectory) {
        return path.relative(from, fullpath)
    }

    async ensureDirectory(directoryPath) {
        await fs.mkdir(directoryPath, { recursive: true })

        return directoryPath
    }

    isSubPath(parentDirectory, childPath) {
        const relative = path.relative(parentDirectory, childPath)

        return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    }

    get executionDirectory() {
        return this.#executionDirectory
    }

    get binDirectory() {
        return this.#binDirectory
    }

    get sourceDirectory() {
        return this.#rootDirectory
    }

    get homeDirectory() {
        return this.#homeDirectory
    }
}

module.exports = PathResolver
module.exports.pathResolver = new PathResolver()