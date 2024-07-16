## faster-tiny-image
# 快速、简单、小巧的图片压缩命令行工具

安装，命令行建议你全局安装

    npm i faster-tiny-image -g

使用,在需要压缩的目录下打开终端，执行下面命令，该命令会检索当前目录的所有png/jpg/jpeg/webp图片压缩后并替换，不知不觉图片变小了

    tinypng

如果需要指定其他目录压缩,同样的会检索该目录下所有图片并压缩替换，十分方便

    tinypng C:\Users\Administrator\Desktop\nick\
    tinypng ./nick/

如果只是需要压缩单张图,指定图片路径即可

    tinypng C:\Users\Administrator\Desktop\nick\nick.jpg
    tinypng ./nick/nick.jpg

你还可以一次指定多个目录或文件

    tinypng C:\Users\Administrator\Desktop\nick\ C:\Users\Administrator\Desktop\judy\ C:\Users\Administrator\Desktop\icon.png

如果你经常有图片压缩需求，咱们需要一个自己的api key，移至[tinypng](https://tinypng.com/)官网注册自己账户，登录成功后在Account Page->API选项中生成免费key,每个key每月可免费压缩500张图，当然没有默认也会有一个公共key供大家使用,但这个key可能本月会没免费额度

然后,配置自己的key,一次可配置1个或多个,使用addkey，如

    tinypng addkey 8fJv56BxFhMMJ1LqpyDXc9s3Vsf3qbzg
    tinypng addkey 8fJv56BxFhMMJ1LqpyDXc9s3Vsf3qbzg 9fJv56BxFhMMJ1LqpyDXc9s3Vsf3qbzg

如有有付费key，可以设置付费类型，默认为免费key(收费key没有压缩数目限制)

    tinypng addkey -t pay 8fJv56BxFhMMJ1LqpyDXc9s3Vsf3qbzg

如果你需要移除不想要的key，执行rmkey

    tinypng rmkey 8fJv56BxFhMMJ1LqpyDXc9s3Vsf3qbzg
    tinypng rmkey 8fJv56BxFhMMJ1LqpyDXc9s3Vsf3qbzg 9fJv56BxFhMMJ1LqpyDXc9s3Vsf3qbzg

查看现有的key

    tinypng keys

## 最近更新 
### [2.0.0] - 2024/7/16
- 多目录：可一次指定多个目录或文件压缩
- key：新增可配置多个key，key还可删除查看
- 多个key联合压缩：新增如果某次压缩图片超过一个免费key的限额，会在用完额度后使用下一个免费key或付费key，使用key的数目没有限制
- 分段压缩：在一次压缩超过100张后容易被api限制，现使用分段压缩，在数量超过100张时会先压缩前100张，以此类推，再多图片也能一条命令压缩完

个人开发，如有bug，请在[issues](https://github.com/dengxiaochun/faster-tiny-image/issues/)反馈，我会及时处理，感谢使用！