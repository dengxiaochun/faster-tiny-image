'use strict'
const fs = require('fs')
const _path = require('path')

/**
 * 解析路径成数组
 * @param { String } path 绝对路径
 * 
 */
function separatePath(path) {
    const paths = path.split(_path.sep)
    return paths;
}

/**
 * 
 * @param { String } path 
 * @param { number } level 
 * @returns { String }
 */
function prepath(path,level) {
    const paths = separatePath(path);
    const p = paths.slice(0,paths.length - level);

    return p.join(_path.sep)
}

/**
 * 根据路径递归创建文件夹
 * @param { String } path 绝对路径
 */
function recursionCreate(path) {
    if (path.indexOf(_path.sep) == -1) {
        throw new Error('path 不是一个有效的路径',path)
    }
    const paths = separatePath(path)
    let currentpath = paths[0]
    const len = paths.length;
    for (let i = 1; i < len; i++) {
        const p = paths[i];
        currentpath = _path.join(currentpath,p)
        if (!fs.existsSync(currentpath)) {
            fs.mkdirSync(currentpath);
        }
    }
}

exports.separatePath = separatePath;
exports.prepath = prepath;
exports.recursionCreate = recursionCreate;