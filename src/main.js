const ora = require('ora')
const { pathResolver } = require('./path-resolver.js')
const { Worker } = require('worker_threads')

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
                break
            default:
                spinner.fail(`Unsupported message: ${name}`)
        }
    })

    worker.postMessage({ name: 'obfuscate', args: { source, level, output } })
}

exports.obfuscate = obfuscate