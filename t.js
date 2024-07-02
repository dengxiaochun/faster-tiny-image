/**
 * @typedef {Object} KeyObject
 * @property {string} key - The key string.
 * @property {number} compressionCount - The compression count.
 * @property {string} type - The type of the key.
 * @property {boolean} available - The availability of the key.
 * @property {number} t - The timestamp.
 * @property {number} leftCount
 */

/**
 * @typedef {Object} KeysObject
 * @property {KeyObject[]} keys - An array of key objects.
 */

/**
 * @typedef {Map<string, string>} stringMap
 * 字符串到数字的映射
 */


'use strict'
const { Command } = require('commander');
const tinify = require('tinify');
const fs = require('fs')
const path = require('path')
const fileTool = require('./fileTool');
const program = new Command();

// key配置路径
const configPath = path.join(__dirname,'config.json');

// key配置读取
/**
 * @type {KeysObject}
 */
const config = JSON.parse(fs.readFileSync(configPath).toString());

// 检索的图片数
/**
 * 检索的图片数
 * @type {string[]}
 */
const imglist = []; 

/** 开始压缩图片数 */
let img_count = 0;

/** dirPath中检索到的图片总数 */
let total_count = 0;

/** 已经压缩的图片,不管有没有成功 */
let has_compress_count = 0;

// 在dirPath同级目录下创建一个.copy${dirPath}的路径，做为压缩图片后的输出目录
let copyDirPath = path.join(process.cwd(),'.tempImgDir');

/**
 * 因为一些原因压缩失败的图片地图,key是相对根目录的深度，value为完整路径
 * @type {stringMap}
 */
let faile_img_map = new Map();

// 一次上传压缩数
const PER_COUNT = 100;

// 现阶段要压缩数量
let target_count = 0;

/**
 * 图片路径地图，key是相对根目录的深度，value为完整路径
 * @type {stringMap}
 */
let img_map = new Map();

// console.log("config",config)

// 验证key
function checkKey(key) {
    const reg = /\w{32}/
    return reg.test(key)
}

function isKeyExits(key) {
    for (let i = 0; i < config.keys.length; i++) {
        const e = config.keys[i];
        if (e && e.key == key) {
            return e;
        }
    }
    return undefined;
}

function writeToConfig() {
    fs.writeFile(configPath,JSON.stringify(config),(err)=>{
        if (err) {
            console.log("writeToConfig 失败了",err)
        }
        console.log("writeToConfig 成功")
    })
}

// 更新key的可用性
function updateKeys() {
    const now = new Date();
    const now_m = now.getMonth(),now_y = now.getFullYear();
    for (let i = 0; i < config.keys.length; i++) {
        const e = config.keys[i];
        if (e.type == "free") {
            const keyDate = new Date(e.t);
            const key_m = keyDate.getMonth(),key_y = keyDate.getFullYear();
            if (key_m == now_m && now_y == key_y) {
                // 免费的每月刷新500额度
                console.log("时间一至")
            } else {
                // 新的月份更新key
                e.compressionCount = 0;
                e.available = true;
                e.leftCount = 500;
                e.t = now.getTime();
            }
        } 
        // console.log(`类型: ${e.type} 本月已压缩：${e.compressionCount} 上次使用时间：${new Date(e.t).toLocaleDateString()}  key: ${e.key}`)
    }
    writeToConfig();
}


/**
 * 当一个免费key不够用时，使用多个key做处理
 * @type {KeyObject[]}
 */
const useAvailablekeys = [];

/**
 * 使用组合keys
 */
let isUseKeys = false;

function checkAvailableKey() {
    let freeAvailableCount = 0;
    let allAvailableCount = 0;
    /**
     * @type {KeyObject[]}
     */
    let freeAvailablekeys = [];
    /**
     * @type {KeyObject}
     */
    let paykey;
    for (let i = 0; i < config.keys.length; i++) {
        const e = config.keys[i];
        if (e.available) {
            if (e.type == "free") { 
                freeAvailableCount += e.leftCount;
                // 从早到后使用key
                if (e.leftCount >= total_count - has_compress_count) {
                    console.log("免费key",e.key)
                    return e.key;
                }
                freeAvailablekeys.push(e)
            } else if (paykey == undefined) {
                paykey = e;
            }
            allAvailableCount += e.leftCount;
        }
    }

    if (freeAvailableCount >= total_count - has_compress_count) {
        useAvailablekeys.push(...freeAvailablekeys);
    } else if (paykey) {
        if (freeAvailableCount > 0) {
            useAvailablekeys.push(...freeAvailablekeys);
            useAvailablekeys.push(paykey)
        } else {
            console.log("收费key",paykey.key)
            return paykey.key;
        }
    } else {
        console.log("没有可用的key了",config)
    }
}


let curentKey = "";
/**
 * 
 * @param {string} key 
 */
function setTinifyKey(key) {
    if (curentKey == key) {

    } else {
        tinify.key = key;
        curentKey = key;
        writeToConfig();
    }
}

function setUseKeys() {
    // if (img_count <=)
    let availableCount = 0;
    for (let i = 0; i < useAvailablekeys.length; i++) {
        const e = useAvailablekeys[i];
        availableCount += e.leftCount;
        if (availableCount >= img_count) {
            // console.log("使用key",e.key)
            setTinifyKey(e.key)
            return;
            // return e.key;
        }
    }
}



/**
 * 
 * @param {string} paths 
 */
function dealParameterPath(paths) {
    // let paths = ['.'];
    const cdir = process.cwd(); 
    for (let i = 0; i < paths.length; i++) {
        // const element = array[i];
        const _path = paths[i]
        let resolvedPath = "";
        if (path.isAbsolute(_path)) {
            resolvedPath = _path;
        } else {
            resolvedPath = path.join(cdir,_path)
        }

        if (fileTool.isExits(resolvedPath)) {
            const stat = fs.statSync(resolvedPath);
            if (stat.isFile()) {
                if (fileTool.isImg(resolvedPath)) {
                    // console.log("文件",resolvedPath)
                    
                    imglist.push(resolvedPath);
                }
            } else if (stat.isDirectory()) {
                // console.log("目录",resolvedPath)
                const dirPaths = fs.readdirSync(resolvedPath).map(img=>path.join(resolvedPath,img))
                dealParameterPath(dirPaths);
            } else {
                console.log("不是文件也不是目录",resolvedPath)
            }
        } else {
            console.log("路径不存在",resolvedPath)
        }
    }
    
}

function replace() {

}

/**
 * 
 * @param {string} imgPath 
 * @returns 
 */
function dealImgMapKey(imgPath) {
    let base = path.basename(imgPath);
    if (img_map.has(base)) {
        const ext = path.extname(imgPath);
        const baseName = path.basename(imgPath, ext);
        let counter = 0;
        do {
            counter ++;
            base = `${baseName}_${counter}${ext}`;
        } while (img_map.has(base));
    }
    img_map.set(base,imgPath)
    return base;
}

function startCompress() {
    target_count = Math.min(target_count + PER_COUNT,total_count)
    for (let i = has_compress_count; i < target_count; i++) {
        // compress(imglist[i])
        compress2(imglist[i])
    }
}

// 更新当前key的信息
function setSinglekey() {
    config.keys.forEach((e)=>{
        if (e.key == curentKey) {
            e.compressionCount = tinify.compressionCount;
            if (e.type == 'free') {
                e.leftCount = 500 - e.compressionCount;
                if (e.leftCount == 0) {
                    e.available = false;
                    writeToConfig();
                }
            }
        }
    })
}

/**
 * 
 * @param {string} imgPath img图全路径
 */
function compress(imgPath) {
    let relative = dealImgMapKey(imgPath);
    img_count ++;
    const n = img_count;
    console.log(`开始第${n}张图片压缩`,imgPath);
    if (isUseKeys) {
        setUseKeys();
    }
    const source = tinify.fromFile(imgPath)
    const toPath = path.join(copyDirPath,relative)

    source.toFile(toPath,(err,data)=>{
        has_compress_count ++;
        if (err) {
            faile_img_map.set(relative,imgPath)
            console.log('图片压缩失败',imgPath);
            console.warn('Error:',err)
            // ttdo err信息做额外处理，比如key不可用了等等
        }

        setSinglekey();
        if (has_compress_count == total_count) {
            !err && console.log(`最后一张图片已压缩,已输出到 ${toPath}`)
            if (faile_img_map.size == 0) {
                console.log('没有压缩失败的图片')
            } else {
                console.log(`有${faile_img_map.size}张图片压缩失败`)
            }
            console.log(`该key：${curentKey},\n本月已压缩图片数为：${tinify.compressionCount}`)
            console.log('------------------------------------------------------------------------------------------')
            replace()
            writeToConfig();
        } else if (has_compress_count == target_count) {
            !err && console.log(`第${n}张图片已压缩,已输出到 ${toPath}`)
            startCompress();
        } else {
            !err && console.log(`第${n}张图片已压缩,已输出到 ${toPath}`)
        }
        // 
        
    })
}

/**
 * 
 * @param {string} imgPath img图全路径
 */
function compress2(imgPath) {
    let relative = dealImgMapKey(imgPath);
    img_count ++;
    const n = img_count;
    console.log(`开始第${n}张图片压缩`,imgPath);
    if (isUseKeys) {
        setUseKeys();
    }

    // const source = tinify.fromFile(imgPath)
    const toPath = path.join(copyDirPath,relative)

    setTimeout(() => {
        has_compress_count ++;
        let err = undefined;
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
            console.log(`该key：${curentKey},\n本月已压缩图片数为：${tinify.compressionCount}`)
            console.log('------------------------------------------------------------------------------------------')
            replace()
            
        } else if (has_compress_count == target_count) {
            !err && console.log(`第${n}张图片已压缩,已输出到 ${toPath}`)
            startCompress();
        } else {
            !err && console.log(`第${n}张图片已压缩,已输出到 ${toPath}`)
        }
    }, Math.random() * 3000);
}

// 设置版本和描述
program.name("tinypng")
  .version('v1.0.0')
  .description('简单好用的tinypng压缩工具');

/**
 * 默认命令
 * @param {string[]} paths - 一个或多个路径
 */
program
  .arguments('[dirs...]')
  .description(`压缩命令
    不传参递归压缩命令行所在目录所有图片文件
    传目录递归压缩命令行所在目录所有图片文件
    可以传入绝对路径 C:\\faster-tiny-image\\img\\
    也可以传相对路径 ./img/
    还可以是图片文件 ./img/picture.png ./img/picture.JPG
    可以传入多个路径 ./img/ ./otherImg/ `)
  .action((paths  = ['.']) => {
    // let dirPath = "";
    if (paths.length == 0) {
        paths = ['.']
    }
    dealParameterPath(paths);
    total_count = imglist.length;
    if (fileTool.isExits(copyDirPath)) {
        fileTool.deleteAll(copyDirPath)
        fs.mkdirSync(copyDirPath)
    } else {
        fs.mkdirSync(copyDirPath)
    }
    // 刷新keys
    updateKeys();
    const key = checkAvailableKey();
    if (key) {
        console.log("使用key",key)
        setTinifyKey(key);
    } else if (useAvailablekeys.length > 0) {
        console.log("使用组合key",useAvailablekeys.map(v=>v.key))
        isUseKeys = true;
    } else {
        // console.log("没有可用的")
        return;
    }
    console.log(imglist);
    startCompress();

    // imglist.forEach((img)=>{
    //     console.log(dealImgMapKey(img))
    // })
    // img_map.forEach((v,k)=>{
    //     console.log("key",k,v)
    // })
    // console.log(img_map.values())

    // console.log(imglist,total_count);
  });

program.command("addkey [keys...]")
.description("addkey,可以增加多个")
.option('-t,--type <type>','设置键的类型 free：免费key pay:收费key')
.action((keys,options)=>{
    const type = options.type || 'free';
    const isFree = type == 'free';
    keys.forEach((key,i) => {
        if (checkKey(key)) {
            const keyinfo = isKeyExits(key);
            if (keyinfo) {
                console.log("key已存在",key)
            } else {
                console.log("增加key",key)
                config.keys.push({
                    "key": "F5LVG1yFJKL0SqRffWhNyPcnF6mX2KgY",
                    "compressionCount": 0,
                    "leftCount": isFree ? 500 : 9999999,
                    "type":type,
                    "available": true,
                    "t": Date.now()
                })
            }
        }
    })

    writeToConfig()
})

program.command("rmkey [keys...]")
.description("rmkey,删除无用的key")
.action((keys)=>{
    console.log("keys",keys)
    keys.forEach((key,i) => {
        if (checkKey(key)) {
            const keyinfo = isKeyExits(key);
            if (keyinfo) {
                console.log("移除key",key)
            } else {
                console.log("key不存在",key)
            }
            for (let i = 0; i < config.keys.length; i++) {
                const e = config.keys[i];
                if (e && e.key == key) {
                    config.keys[i] = undefined;
                }
            }
        } else {
            console.log("无效的key值 key为32为字母数字",key)
        }
    });
    config.keys = config.keys.filter(Boolean);

    // console.log("rmkeys",config.keys)

    writeToConfig();
})


program
  .command('keys')
  .description('展示所有的 key,本月压缩数和可用性可能不准确')
  .action(() => {
    updateKeys();
    console.log('所有的 key:');
    for (let i = 0; i < config.keys.length; i++) {
        const e = config.keys[i];
        console.log(`可用性：${e.available} 类型: ${e.type} 本月已压缩：${e.compressionCount} 上次使用时间：${new Date(e.t).toLocaleDateString()}  key: ${e.key}`)
    }
  });

    
// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
