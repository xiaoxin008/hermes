---
layout: post
title: 使用Docker部署SpringBoot项目
date: 2019-07-15 10:07:04
categories: docker
tags: docker docker-compose springboot
toc: true
---
#### 项目中添加Dockerfile
----

```dockerfile
# 基础镜像
FROM openjdk:8-jdk-alpine
# 挂载临时目录
VOLUME /tmp
# 创建变量JAR_FILE
ARG JAR_FILE
# 把jar放入容器中
ADD ${JAR_FILE} test.jar
# 暴露端口
EXPOSE 8999
# 容器启动时执行命令
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/test.jar"]
```
在项目下添加此`Dockerfile`文件

&nbsp;

#### 添加Maven插件
----

```xml
 <plugin>
    <groupId>com.spotify</groupId>
    <artifactId>dockerfile-maven-plugin</artifactId>
    <version>1.4.0</version>
    <!--构建jar包时 自动打包为image package时执行build deploy 执行 push-->
    <executions>
        <execution>
            <id>default</id>
            <goals>
                <goal>build</goal>
                <goal>push</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <repository>${docker.registry.name}/${project.artifactId}</repository>
        <tag>${project.version}</tag>
        <!--使用setting.xml进行dockerhub 远程认证-->
        <useMavenSettingsForAuth>false</useMavenSettingsForAuth>
        <buildArgs>
            <JAR_FILE>target/${project.build.finalName}.jar</JAR_FILE>
        </buildArgs>
    </configuration>
</plugin>
```
在SpringBoot项目中的pom.xml `<build>-><plugins>-><plugin>` 里添加此插件，再执行`package`命令即可把此项目打包为镜像放入本地Docker images中，执行`deploy`命令会把打包后的镜像上传到Docker Registry（远程仓库）。
变量说明：
* `${docker.registry.name}`：docker registry（远程仓库）名称-上传的远程仓库的url，需在`properties`标签中定义
* `${project.artifactId}`：项目名称-image名称
* `${project.version}`：项目版本-image的tag
* `${project.build.finalName}`：项目构建后名称-构建参数（Dockerfile使用）

&nbsp;

#### 打包项目
----
使用指令 `mvn clean install -U -DskipTests`指令即可构建此项目镜像

&nbsp;

#### 启动容器
----
使用指令`docker run --name test -d ${docker.registry.name}/${project.artifactId}:${project.version}`

&nbsp;

#### 使用docker-compose构建多容器微服务
----
```dockerfile
# 使用的docker版本
version: '3'
services:
  # zookeeper服务  
  zookeeper-service:
    image: docker.io/zookeeper:latest
    ports:
      - "2181:2181"
  # mysql服务    
  mysql-service:
    image: docker.io/mysql:latest
    volumes:
      - /opt/docker_v/mysql/conf:/etc/mysql/conf.d
    environment:
      MYSQL_ROOT_PASSWORD: admin
    ports:
      - "3306:3306"
  # 项目一    
  test1:
    image: xiaoxin008/test1:1.0.5-RELEASE
    # 挂载日志目录
    volumes:
      - /logs/admin
    ports:
      - "8888:8888"
    # 错误后是否重启  
    restart: always
    # 依赖的服务（决定启动容器的顺序）
    depends_on:
      - mysql-service
      - zookeeper-service
  # 项目二    
  test2:
    image: xiaoxin008/test2:1.0.0
    volumes:
      - /logs
    ports:
      - "8999:8999"
    restart: always
    depends_on:
      - zookeeper-service
```
在项目下添加`docker-compose`文件

&nbsp;

#### 启动docker-compose多容器微服务
----
使用指令`docker-compose up -d `