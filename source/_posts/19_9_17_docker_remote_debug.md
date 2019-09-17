---
layout: post
title: 使用IDEA远程调试Springboot项目（Docker环境）
date: 2019-09-17 18:01:04
categories: docker
tags: docker springboot
toc: true
---
#### 在IDEA中创建远程连接
----

<img src="/css/img/docker-debug/connection.png" style="width:100%;height:100%"/>
<center class="picture-desc">在IDEA中创建远程连接.png</center>

&nbsp;

#### Dockerfile构建镜像
----

```dockerfile
# 基础镜像
FROM openjdk:8-jdk-alpine
# 挂载临时目录
VOLUME /tmp
# 创建变量JAR_FILE
ARG JAR_FILE
# 把jar放入容器中
ADD ${JAR_FILE} certification-server.jar
# 暴露端口,这里的端口要与配置项中的address一致
EXPOSE 9090
# 容器启动时执行命令,这里的配置与远程连接配置中的参数一致
ENTRYPOINT ["java","-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=9090","-jar","/certification-server.jar"]
```

&nbsp;

#### 远程调试
----

##### 开始调试

<div class="picture-font">1. 先启动容器</div>

<img src="/css/img/docker-debug/start-container.png" style="width:100%;height:100%"/>
<center class="picture-desc">启动容器.png</center>

<div class="picture-font">2. 在启动容器的同时再启动remote-debug(一定是在容器启动之后，启动完成之前)</div>

<img src="/css/img/docker-debug/remote-debug.png" style="width:100%;height:100%"/>
<center class="picture-desc">启动远程调试.png</center>

##### 调试演示

<div class="picture-font">1. 访问接口</div>

<img src="/css/img/docker-debug/interface.png" style="width:100%;height:100%"/>
<center class="picture-desc">访问接口.png</center>

<div class="picture-font">2. 看其是否进入断点</div>

<img src="/css/img/docker-debug/break-point.png" style="width:100%;height:100%"/>
<center class="picture-desc">进入断点.png</center>