'use strict'
const fs = require('fs')
const path = require('path')
const { recursionCreate } = require('./filePathTool')

// 兼容老版本，简化版的copyFileSync
if (!fs.copyFileSync) {
    fs.copyFileSync = function copyFileSync(src, dist) {
        fs.writeFileSync(dist, fs.readFileSync(src));
    }
}


const imgReg = /\.(png|jpg|jpeg)/
/**
 * @param { String } file 
 */
function isImg(file) {
    const f = file.slice(-5).toLocaleLowerCase()
    return imgReg.test(f)
}

/**
 * @param { String } file 
 */
function isExits(file) {
    return fs.existsSync(file)
}

/**
 * @param { String } files 
 */
function deleteAll(files) {
    if (isExits(files)) {
        if (fs.statSync(files).isDirectory()) {
            deleteDir(files,false)
        } else {
            deleteFile(files,false)
        }
    } else {
        throw new Error('路径不存在 ' + files)
    }
}

/**
 * @param { String } file 
 */
function deleteFile(file,check = true) {
    if (check) {
        if (!isExits(file)) {
            throw new Error('路径不存在 ' + file)
        }
    } 
    fs.unlinkSync(file)
}

/**
 * @param { String } files 
 */
function deleteDir(files,check = true) {
    if (check) {
        if (!isExits(files)) {
            throw new Error('路径不存在 ' + files)
        }
        if (!fs.statSync(files).isDirectory()) {
            console.warn('目标不是文件夹，请使用deleteFile()方法')
            fs.unlinkSync(file)
            return;
        }
    }

    const _files = fs.readdirSync(files)
    _files.forEach(function(file,index) {
        const curPath = path.join(files,file)
        if (fs.statSync(curPath).isDirectory()) {
            deleteDir(curPath,false)
        } else {
            fs.unlinkSync(curPath)
        }
    })
    fs.rmdirSync(files)
}

/**
 * 
 * @param { String } src   原文件夹
 * @param { String } dest  复制到文件夹
 */
function copyAll(src,dest) {
    if (isExits(src)) {
        if (fs.statSync(src).isDirectory()) {
            copyDir(src,dest)
        } else {
            copyFile(src,dest,false)
        }
    } else {
        throw new Error('路径不存在 ' + src)
    }
}

/**
 * 该方法会覆盖dest文件
 * @param { String } src 
 * @param { String } dest 
 */
function copyFile(src,dest,check = true) {
    if (check) {
        if (!isExits(src)) {
            throw new Error('路径不存在 ' + src)
        }
        if (fs.statSync(src).isDirectory()) {
            console.warn(`目标是文件夹,请使用copyDir()方法`,src)
            copyDir(src,dest,false)
            return;
        }
    }
    recursionCreate(path.dirname(dest))
    fs.copyFileSync(src,dest)
}

/**
 * 该方法会覆盖dest已有的文件
 * @param { String } src 
 * @param { String } dest 
 */
function copyDir(src,dest,check = true) {
    if (check) {
        if (!isExits(src)) {
            throw new Error('路径不存在 ' + src)
        }
        if (fs.statSync(src).isFile()) {
            console.warn(`目标是文件,copyFile()方法`,src)
            copyFile(src,dest)
        }
        recursionCreate(dest)
    }
    const files = fs.readdirSync(src)
    files.forEach(function (file,index) {
        const curPath = path.join(src,file)
        if (fs.statSync(curPath).isDirectory()) {
            const curDestPath = path.join(dest,file)
            if (!isExits(curDestPath)) fs.mkdirSync(curDestPath)
            copyDir(curPath,curDestPath,false)
        } else {
            fs.copyFileSync(curPath,path.join(dest,file))
        }
    })
}

exports.isExits = isExits;
exports.deleteAll = deleteAll;
exports.deleteFile = deleteFile;
exports.deleteDir = deleteDir;
exports.copyAll = copyAll;
exports.copyFile = copyFile;
exports.copyDir = copyDir;
exports.isImg = isImg;
