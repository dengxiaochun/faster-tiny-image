
'use strict'
const { Command } = require('commander');
const tinify = require('tinify');
const fs = require('fs')
const path = require('path')
const fileTool = require('./fileTool');
const program = new Command();

// key配置路径
const configPath = path.join(__dirname,'config.json');

const config = JSON.parse(fs.readFileSync(configPath).toString());

console.log("config",config)

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
        console.log("writeToConfig 成功",err)
    })
}

// 判断时间更新key的可用性
function updateKeys() {
    const now = new Date();
    const now_m = now.getMonth(),now_y = now.getFullYear();
    for (let i = 0; i < config.keys.length; i++) {
        const e = config.key[i];
        const keyDate = new Date(e.t);
        const key_m = now.getMonth(),key_y = now.getFullYear();
        if (key_m == now_m && now_y == key_y) {
            // 免费的每月刷新500额度
            console.log("时间一至")
        } else {
            e.compressionCount = 0;
            e.available = true;
        }
        // console.log(`类型: ${e.type} 本月已压缩：${e.compressionCount} 上次使用时间：${new Date(e.t).toLocaleDateString()}  key: ${e.key}`)
    }
    writeToConfig();
}
// program.help("这是帮助")

// 设置版本和描述
program.name("tinypng")
  .version('v1.0.0')
  .description('简单好用的tinypng压缩工具');

// 默认命令
program
  .arguments('[dirs...]')
  .description('压缩命令，默认压缩当前目录')
  .action((paths  = ['.']) => {
    console.log("33333",paths);
   
  });

program.command("addkey [keys...]")
.description("addkey,可以增加多个")
.option('-t,--type <type>','设置键的类型 free：免费key pay:收费key')
.action((keys,options)=>{
    const type = options.type || 'free';
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
  .command('--keys')
  .description('展示所有的 key,本月压缩数和可用性可能不准确')
  .action(() => {
    updateKeys();
    console.log('所有的 key:');
    for (let i = 0; i < config.keys.length; i++) {
        const e = config.key[i];
        console.log(`可用性：${e.available} 类型: ${e.type} 本月已压缩：${e.compressionCount} 上次使用时间：${new Date(e.t).toLocaleDateString()}  key: ${e.key}`)
    }
  });

    
// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
