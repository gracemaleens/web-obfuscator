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