#!/usr/bin/env node

'use strict'
const tinify = require('tinify');
const fs = require('fs')
const path = require('path')
const fileTool = require('./fileTool');

/** 一个key每月只能压缩500张图，建议每人用邮箱注册一个 */
/** tinify接口认证key,这里后续多加几个key */
let key = '';

// 图片根目录，优先使用参数路径tinyimage [dirpath]，其次使用当前命令行运行的路径
let dirPath = ''

// 在dirPath同级目录下创建一个.copy${dirPath}的路径，做为压缩图片后的输出目录
let copyDirPath = '';

/** 开始压缩图片数 */
let img_count = 0;

/** dirPath中检索到的图片总数 */
let total_count = 0;

/** 已经压缩的图片,不管有没有成功 */
let has_compress_count = 0;

/** 因为一些原因压缩失败的图片地图,key是相对根目录的深度，value为完整路径 */
let faile_img_map = new Map();

/** 图片路径地图，key是相对根目录的深度，value为完整路径*/
let img_map = new Map();


let keys  = [];
function getKey() {
    if (keys.length == 0) {
        const configPath = path.join(__dirname,'config.json')
        const config = JSON.parse(fs.readFileSync(configPath).toString());
        keys = config.keys;
    }
    const count = 0;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key.available) {
            if (key.type == "free" && 500 - key.compressionCount >= count) {
                // 优先可用的free key
                return key;
            }
        }
    }

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key.available) { 
            if (key.type == "pay") {
                return key;
            }
        }
    }

    throw new Error("没有可用的key了，请使用命令行新增key")
}

function setKey() {
    const argv = process.argv;
    const configPath = path.join(__dirname,'config.json')
    const len = argv.length - 2;
    // 验证key
    function check(key) {
        const reg = /\w{32}/
        return reg.test(key)
    }
    if (argv[2] && argv[2] == '--key') {
        let remove = false;

        if (argv[3]) {
            if (argv[3] == "remove") {
                remove = true;
            } else if (check(argv[3])) {
                
            }
        }

        if (argv[3]) {
            if (check(argv[3])) {
                const config = JSON.parse(fs.readFileSync(configPath).toString());
                config.key = argv[3]
                fs.writeFileSync(configPath,JSON.stringify(config))
                console.log('写入key成功')
            } else {
                console.log('key不符合规则',argv[3])
            }
        }
    } else {
        const config = JSON.parse(fs.readFileSync(configPath).toString());
        if (config.key) {
            key = tinify.key = config.key;
            console.log('读取key配置',key)
        } else {
            console.log('没有配置key,请使用命令行配置再使用 tinyimage --key [keydata]')
        }
    }
}

function isDirectory(_path) {
    return fs.statSync(_path).isDirectory();
}


const imgReg = /\.(png|jpg|jpeg)/
function isImage(fileName) {
    const f = fileName.slice(-5).toLocaleLowerCase()
    return imgReg.test(f)
}

function replace() {
    console.log('准备替换根目录下的图片...')
    fileTool.copyAll(copyDirPath,dirPath);
    console.log('替换成功')
    if (faile_img_map.size > 0) {
        console.log(`尚有${faile_img_map.size}张图片压缩失败,分别是`)
        console.log(faile_img_map)
    }

    fileTool.deleteAll(copyDirPath)
}


function compress(imgPath,relative) {
    img_count ++;
    const n = img_count;
    console.log(`开始第${n}张图片压缩`,imgPath);
    const source = tinify.fromFile(imgPath)
    const toPath = path.join(copyDirPath,relative)
    source.toFile(toPath,(err,data)=>{
        has_compress_count ++;
        if (err) {
            faile_img_map.set(relative,imgPath)
            console.log('图片压缩失败',imgPath);
            console.warn('Error:',err)
        }
        if (has_compress_count == total_count) {
            !err && console.log(`最后一张图片已压缩,已输出到 ${toPath}`)
            if (faile_img_map.size == 0) {
                console.log('没有压缩失败的图片')
            } else {
                console.log(`有${faile_img_map.size}张图片压缩失败`)
            }
            console.log(`该key：${key},\n本月已压缩图片数为：${tinify.compressionCount}`)
            console.log('------------------------------------------------------------------------------------------')
            replace()
        } else {
            !err && console.log(`第${n}张图片已压缩,已输出到 ${toPath}`)
        }
    })
}

function compresImage(imgPath) {
    console.log('开始压缩图片')
    const copyImagePath = path.join(path.dirname(imgPath),'.copy_' + path.basename(imgPath))
    tinify.fromFile(imgPath).toFile(copyImagePath,(err) => {
        if (err) {
            console.log('图片压缩失败',imgPath);
            console.warn('Error:',err)
            return;
        }
        console.log('图片压缩成功')
        console.log(`该key：${key},\n本月已压缩图片数为：${tinify.compressionCount}`)
        fileTool.copyFile(copyImagePath,imgPath)
        fileTool.deleteFile(copyImagePath)
        console.log('图片替换成功')
    })
}

function createCopyDir(dir) {
    copyDirPath = path.join(path.dirname(dir),'.copy_' + path.basename(dir)) 
    if (fs.existsSync(copyDirPath)) {
        console.log('已经删除老的目录',copyDirPath)
        fileTool.deleteAll(copyDirPath)
    }
    fs.mkdirSync(copyDirPath)
    console.log('新建压缩输出图片目录:',copyDirPath)
}

function searchDir(dir,relative = '') {
    let files = fs.readdirSync(dir);
    files.forEach((file,i)=>{
        const curPath = path.join(dir,file);
        if (isDirectory(curPath)) {
            fs.mkdirSync(path.join(copyDirPath,relative,file))
            searchDir(curPath,path.join(relative,file))
        } else if(isImage(file)) {
            total_count ++;
            img_map.set(path.join(relative,file),curPath)
        }
    })
}

function initKey() {
    const argv = process.argv;
    const configPath = path.join(__dirname,'config.json')
    // 验证key
    function check(key) {
        const reg = /\w{32}/
        return reg.test(key)
    }
    if (argv[2] && argv[2] == '--key') {
        if (argv[3]) {
            if (check(argv[3])) {
                const config = JSON.parse(fs.readFileSync(configPath).toString());
                config.key = argv[3]
                fs.writeFileSync(configPath,JSON.stringify(config))
                console.log('写入key成功')
            } else {
                console.log('key不符合规则',argv[3])
            }
        }
    } else {
        const config = JSON.parse(fs.readFileSync(configPath).toString());
        if (config.key) {
            key = tinify.key = config.key;
            console.log('读取key配置',key)
        } else {
            console.log('没有配置key,请使用命令行配置再使用 tinyimage --key [keydata]')
        }
    }
}
initKey()

function main() {
    const argv = process.argv;
    if (argv[2] && argv[2] == '--key') {
        // 初始化key
        return;
    }
    
    function changPath(_path) {
        if (_path.search('./') == 0) {
            // 相对路径
            return path.join(process.cwd(),_path)
        } else {
            // 绝对路径
            return _path;
        }
    }

    // 如果有路径参数，使用参数作为根目录
    if (argv[2]) {
        if (!fs.existsSync(argv[2])) {
            throw new Error(argv[2],'不是一个有效的路径或路径不存在');
        }
        if (isDirectory(argv[2])) {
            dirPath = changPath(argv[2])
        } else if (isImage(argv[2])) {
            let imagePath = changPath(argv[2])
            compresImage(imagePath)
            return;
        } else {
            throw new Error(argv[2],'指定的文件不是图片');
        }
    } else {
        // 获取命令行运行目录
        dirPath = process.cwd()
    }
    console.log('--------------------------------------------------------------------------')
    console.log('图片根目录是：',dirPath)
    createCopyDir(dirPath)
    console.log('开始检索图片根目录...')
    searchDir(dirPath)
    console.log(`一共检索到${total_count}张图片,开始上传压缩...`)
    img_map.forEach((v,k)=>{
        compress(v,k)
    })

}
main()
