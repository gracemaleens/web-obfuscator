#!/usr/bin/env node

const { program, Option } = require('commander')
const { obfuscate } = require('../src/main.js')

program
    .version('1.0.0')
    .name('wo')
    .description('A CLI for obfuscate web project')
    .argument('<input>', 'a web project path')
    .addOption(new Option('-l, --level <level>', 'obfuscate level', 'high').choices(['low', 'normal', 'high']).default('normal'))
    .option('-o, --output <output>', 'output path')
    .action((input, options, command) => {
        obfuscate(input, options.level, options.output)
    })

program.parse()