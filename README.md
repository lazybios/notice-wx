# 云南大学主页通知微信推送接口
本程序读取云南大学主页上的通知列表，当有新通知发布时将自动推送到指定的微信企业号应用中。

## 如何使用

### 1. 在docker中使用

#### 1.1 编译Docker镜像

1. 下载程序代码
	`git clone https://github.com/ynu/notice-wx.git`
	
2. 执行`build`命令：
	`docker build -t ynuae/notice-wx .`
	
#### 1.2 运行Docker容器

由于此镜像已发布到DockerHub上，因此，最终用户可以不用`build`镜像，直接运行容器即可。

1. 打开程序中的`docker/docker-compose.yml`文件
2. 填入必要的参数
	- `QYH_CORPID=my_corpId` 微信企业号的corpId
    - `QYH_SECRET=my_secret` 管理组的secret
    - `NOTICE_TOKEN=app_token` 应用的Token
    - `NOTICE_AESKEY=app_aeskey` 应用的AESKEY
    - `NOTICE_AGENTID=4` 应用的ID
3. 保存并关闭文件
4. 使用`docker-compose`运行容器：`docker-compose up`