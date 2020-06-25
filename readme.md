## faster-tiny-image
# 快速、简单、小巧的图片压缩命令行工具

安装，命令行建议你全局安装

    npm i faster-tiny-image -g

首先，咱们需要一个key，移至[tinypng](https://tinypng.com/)官网注册自己的key,每个key每月可免费压缩500张图，当然没有默认也会有一个公共key供大家使用


然后,配置自己的key (如果您有多个key需要更换，也可以使用这个命令)

    tinypng --key 8fJv56BxFhMMJ1LqpyDXc9s3Vsf3qbzg


使用,在需要压缩的目录下打开终端，执行下面命令，该命令会检索当前目录的所有png/jpg/jpeg图片压缩后并替换，不知不觉图片变小了

    tinypng

如果需要指定其他目录压缩,同样的会检索该目录下所有图片并压缩替换，十分方便

    tinypng C:\Users\Administrator\Desktop\nick\
    tinypng ./nick/

如果只是需要压缩单张图,指定图片路径即可

    tinypng C:\Users\Administrator\Desktop\nick\nick.jpg
    tinypng ./nick/nick.jpg

什么！在一个文件夹里有10张图，但只要压缩3张,怎么办？
把这三张图放一个新建文件夹中，指定目录压缩啊，兄弟~
