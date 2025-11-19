#!/usr/bin/env node

/**
 * @file bin/cli.js
 * @description this file contains the CLI implementation
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

const { program, Option } = require('commander')
const { obfuscate } = require('../src/main.js')

program
    .version('1.0.0')
    .name('wo')
    .description('A CLI for obfuscate web project')
    .argument('<input>', 'a web project path')
    .addOption(new Option('-l, --level <level>', 'obfuscate level', 'high').choices(['low', 'normal', 'high']).default('low'))
    .option('-o, --output <output>', 'output path')
    .action((input, options, command) => {
        obfuscate(input, options.level, options.output)
    })

program.parse()