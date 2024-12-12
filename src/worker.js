/**
 * @file src/worker.js
 * @description this file contains the worker thread for obfuscation
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

const { parentPort } = require('worker_threads');
const { isExist, isDirectory } = require('./utils/file-util.js');
const fs = require('fs').promises;
const path = require('path');
const { join } = path;
const JavascriptObfuscator = require('javascript-obfuscator');
const { pathResolver } = require('./path-resolver.js');
const CleanCSS = require('clean-css');
const glob = require('glob-promise');
const crypto = require('crypto');

class WebObfuscator {
    #successCount = 0
    #failCount = 0

    #allFiles = []
    #obfuscableFiles = []
    #undisposedFiles = []

    async obfuscate({ source, level, output }) {
        this.#progress(0, 'Obfuscating...')

        if (!(await isExist(source))) {
            this.#fail(`Source path not exist: ${source}`)

            return
        }
        if (!output) {
            output = `${source}_Obfuscated`
        }
        if (output === source) {
            this.#fail('Output path must be different from source path')

            return
        }
        if (await isExist(output)) {
            await fs.rm(output, { recursive: true })
        }
        await fs.mkdir(output, { recursive: true })

        try {
            await this.#scanFiles(source)

            await this.#obfuscateFiles(source, level, output)

            await this.#copyUndisposedFiles(source, output)

            this.#detectCompletion()
        } catch (error) {
            this.#fail(error)
        }
    }

    async #scanFiles(source) {
        this.#progress(0, 'Scanning files...')

        const options = {
            posix: true,
            cwd: source,
            ignore: ['node_modules/**', 'dist/**']
        }

        this.#allFiles = await glob('**/*', options)
            .then(files => Promise.all(
                files.map(async file => (
                    {
                        file,
                        isDirectory: await isDirectory(join(source, file))
                    }
                ))
            ))
            .then(results => results
                .filter(result => !result.isDirectory)
                .map(result => result.file)
            )

        this.#obfuscableFiles = {
            js: this.#allFiles.filter(file => file.endsWith('.js')
                && !file.endsWith('data.js')
                && !file.endsWith('offline.js')
                && !/.*jquery.*\.js/.test(file)),
            css: this.#allFiles.filter(file => file.endsWith('.css')),
            html: this.#allFiles.filter(file => file.endsWith('.html')),
            json: this.#allFiles.filter(file => file.endsWith('.json')),
            res: this.#allFiles.filter(file => /\.(png|jpg|jpeg|gif|svg|webp|mp3|mp4|webm)$/.test(file))
        }

        this.#undisposedFiles = this.#allFiles.filter(file => !this.#obfuscableFiles.js.includes(file)
            && !this.#obfuscableFiles.css.includes(file)
            && !this.#obfuscableFiles.html.includes(file)
            && !this.#obfuscableFiles.json.includes(file)
            && !this.#obfuscableFiles.res.includes(file))
    }

    async #obfuscateFiles(source, level, output) {
        for (const [type, files] of Object.entries(this.#obfuscableFiles)) {
            this.#progress(0, `Find ${files.length} ${type.toUpperCase()} files`)

            await this.#obfuscateFile({ type, level, source, output, files })
        }
    }

    async #obfuscateFile({ type, level, source, output, files }) {
        const obfuscateContent = (
            type === 'js' ? this.#obfuscateJs
                : type === 'css' ? this.#obfuscateCss
                    : type === 'html' ? this.#obfuscateHtml
                        : type === 'json' ? this.#obfuscateJson
                            : type === 'res' ? this.#obfuscateRes
                                : (() => { throw new Error(`Unknown obfuscate type: ${type}`) })()
        ).bind(this)

        for (const file of files) {
            this.#progress(this.#calculateProgress(), `Obfuscating ${file}`)

            try {
                const sourcePath = join(source, file)
                const outputPath = join(output, file)
                const encoding = ['js', 'css', 'html'].includes(type) ? 'utf-8' : null

                const content = await fs.readFile(sourcePath, { encoding })

                const obfuscatedContent = await obfuscateContent(content, level)

                await fs.mkdir(path.dirname(outputPath), { recursive: true })
                await fs.writeFile(outputPath, obfuscatedContent, { encoding })

                this.#successCount++
            } catch (error) {
                this.#fail(`Obfuscate ${file} failed: ${error}`)

                this.#failCount++
            }
        }
    }

    async #obfuscateJs(content, level) {
        return JavascriptObfuscator.obfuscate(content, await this.#getJsObfuscatorOptions(level)).getObfuscatedCode()
    }

    async #getJsObfuscatorOptions(level) {
        return fs.readFile(pathResolver.resolveFromRoot(`config/${level.toLowerCase()}.json`), 'utf-8')
            .then(data => JSON.parse(data))
            .catch(error => this.#fail(`Get ${level} options failed of JS obfuscator: ${error}`))
    }

    async #obfuscateCss(content, level) {
        return new CleanCSS().minify(content).styles
    }

    async #obfuscateHtml(content, level) {
        const obfuscatedContent = Array.from(content)
            .map(char => '%' + char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
            .join('')

        return `<script>document.write(unescape('${obfuscatedContent}'))</script>`
    }

    async #obfuscateJson(content) {
        return JSON.stringify(JSON.parse(content))
    }

    async #obfuscateRes(content, level) {
        // 添加随机噪音
        return Buffer.concat([content, crypto.randomBytes(Math.random() * 20 + 32)])
    }

    async #copyUndisposedFiles(source, output) {
        this.#undisposedFiles.forEach(file => {
            this.#progress(this.#calculateProgress(), `Copying ${file}`)

            try {
                const sourcePath = join(source, file)
                const outputPath = join(output, file)

                fs.mkdir(path.dirname(outputPath), { recursive: true })
                fs.copyFile(sourcePath, outputPath)

                this.#successCount++
            } catch (error) {
                this.#fail(`Copy ${file} failed: ${error}`)

                this.#failCount++
            }
        })
    }

    #calculateProgress() {
        return Math.floor((this.#successCount + this.#failCount) / this.#allFiles.length * 100)
    }

    #detectCompletion() {
        const intervalId = setInterval(() => {
            if (this.#successCount + this.#failCount === this.#allFiles.length) {
                clearInterval(intervalId)

                if (this.#failCount === 0) {
                    this.#success()
                } else {
                    this.#fail(`${this.#failCount} files obfuscate failed`)
                }
            }
        }, 1000 / 60)
    }

    #progress(progress, text) {
        notifyProgress(progress, text)
    }

    #success() {
        notifySuccess('obfuscate')
    }

    #fail(message) {
        notifyFail('obfuscate', new Error(message))
    }
}

parentPort.on('message', (data) => {
    const { name, args } = data

    switch (name) {
        case 'obfuscate':
            new WebObfuscator().obfuscate(args)
            break
        default:
            notifyFail(name, new Error(`Unknown message name: ${name}`))
    }
})

function notifyProgress(progress, text) {
    notifyParent({ name: 'progress', args: { progress, text } })
}

function notifySuccess(name) {
    notifyParent({ name: 'success', args: { name } })
}

function notifyFail(name, error) {
    notifyParent({ name: 'fail', args: { name, error } })
}

function notifyParent(data) {
    parentPort.postMessage(data)
}