/**
 * @file src/main.js
 * @description this file contains the main function of the obfuscator
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

const ora = require('ora')
const { pathResolver } = require('./path-resolver.js')
const { Worker } = require('worker_threads')
const { exit } = require('process')

function obfuscate(source, level, output) {
    const spinner = ora('Preparing...').start()
    const worker = new Worker(pathResolver.resolveFromRoot('src/worker.js'))
    const finishWorker = () => worker.terminate()

    worker.on('message', data => {
        const { name, args } = data

        switch (name) {
            case 'progress':
                spinner.text = `[${args.progress}] ${args.text}`
                break
            case 'success':
                spinner.succeed(`Succeed to ${args.name}`)

                finishWorker()
                break
            case 'fail':
                spinner.fail(`Failed to ${args.name}: ${args.error}`)

                finishWorker()
                exit(1)
                break
            default:
                spinner.fail(`Unsupported message: ${name}`)
        }
    })

    worker.postMessage({ name: 'obfuscate', args: { source, level, output } })
}

exports.obfuscate = obfuscate