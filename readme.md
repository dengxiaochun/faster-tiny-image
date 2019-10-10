## faster-tiny-image
# 快速、简单、图片压缩命令行工具

首先请移至[tinypng](https://tinypng.com/)官网注册自己的key,每个key每月可免费压缩500张图


第一次使用,请配置自己的key (如果需要更换key可以使用这个命令)

    tinypng --key 8fJv56BxFhMMJ1LqpyDXc9s3Vsf3qbzg


key配置好了之后打开终端,使用tinypng命令,该命令会检索当前目录的所有png/jpg/jpeg图片压缩后并替换，使用起来毫无感觉

    tinypng

如果需要指定目录使用命令,同样的会检索图片压缩替换，十分简洁

    tinypng C:\Users\Administrator\Desktop\nick\
    tinypng ./nick/

如果只是需要压缩单个图片,指定图片路径，会自动压缩并替换它,让图片感觉起来就是莫名其妙的小了

    tinypng C:\Users\Administrator\Desktop\nick\nick.jpg
    tinypng ./nick/nick.jpg

什么！在一个文件夹里有10张图，但只要压缩3张,怎么办？
把这三张图放一个新建文件夹中，指定目录压缩啊，兄弟~