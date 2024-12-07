/**
 * @file src/utils/file-util.js
 * @description this file contains utility functions for file operations
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

const fs = require('fs').promises

module.exports.isExist = async path => {
    try {
        await fs.access(path)
        return true
    } catch (e) {
        return false
    }
}

module.exports.isDirectory = async path => {
    try {
        const stat = await fs.stat(path)
        return stat.isDirectory()
    } catch (e) {
        return false
    }
}