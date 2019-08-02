---
layout: post
title: Soul使用文档
date: 2019-07-04 13:47:04
tags: soul gateway
categories: gateway
toc: true
---
#### HTTP调用
--------------------
##### soul-admin配置
<div class="picture-font">1. 打开soul-admin控制台，登陆之后，选择【系统管理-插件管理】界面，确保divide插件开启</div>
<img src="/css/img/soul/plugin.png" style="width:100%;height:100%"/>
<center class="picture-desc">插件管理.png</center>
<div class="picture-font">2. 打开divide插件，添加选择器</div>
<center><img src="/css/img/soul/divide-selector.png" style="width:50%;height:50%;"/></center>
<center class="picture-desc">创建divide插件选择器.png</center>
<div class="picture-font">3. 选中添加后的选择器，添加规则列表</div>
<center><img src="/css/img/soul/divide-rule.png" style="width:50%;height:50%;"/></center>
<center class="picture-desc">创建规则列表.png</center>

&nbsp;
&nbsp; 

##### postman发送HTTP请求
<div class="picture-font">1. 添加header参数</div>
<img src="/css/img/soul/divide-add-header.png" style="width:100%;height:100%"/>
<center class="picture-desc">添加header.png</center>
<div class="picture-font">2. 添加body参数（接口参数）</div>
<img src="/css/img/soul/divide-add-body.png" style="width:100%;height:100%"/>
<center class="picture-desc">添加body.png</center>
<div class="picture-font">3. 执行结果</div>
<img src="/css/img/soul/divide-result.png" style="width:100%;height:100%"/>
<center class="picture-desc">执行结果.png</center>

&nbsp; 
&nbsp;

#### DUBBO调用
--------------------
##### soul-admin配置
<div class="picture-font">1. 先检查是否已开启dubbo插件，与上述类似不再赘述。打开dubbo插件，添加选择器</div>
<center><img src="/css/img/soul/dubbo-selector.png" style="width:50%;height:50%;"/></center>
<center class="picture-desc">创建dubbo插件选择器.png</center>
<div class="picture-font">2. 选中添加后的选择器，添加规则列表</div>
<center><img src="/css/img/soul/dubbo-rule.png" style="width:50%;height:50%;"/></center>
<center class="picture-desc">创建规则列表.png</center>

&nbsp;
&nbsp; 

##### postman发送HTTP请求调用DUBBO接口
<div class="picture-font">1. 添加header参数</div>
<img src="/css/img/soul/dubbo-add-header.png" style="width:100%;height:100%"/>
<center class="picture-desc">添加header.png</center>
<div class="picture-font">2. 添加body参数（DUBBO接口相关参数）</div>
<img src="/css/img/soul/dubbo-add-body.png" style="width:100%;height:100%"/>
<center class="picture-desc">添加body.png</center>
<div class="picture-font">3. 执行结果</div>
<img src="/css/img/soul/dubbo-result.png" style="width:100%;height:100%"/>
<center class="picture-desc">执行结果.png</center>
<div class="note"><span style="color:red">*</span>DUBBO接口相关参数，请参照官方文档：<a href="https://dromara.org/website/zh-cn/docs/soul/dubbo.html">soul-dubbo插件参数传递</a></div>

&nbsp; 
&nbsp;

#### 权限过滤
--------------------
##### soul-admin配置
<div class="picture-font">1. 先检查是否已开启sign插件(默认关闭)，与上述类似不再赘述。打开sign插件，添加选择器</div>
<center><img src="/css/img/soul/sign-selector.png" style="width:50%;height:50%;"/></center>
<center class="picture-desc">创建sign插件选择器.png</center>
<div class="picture-font">2. 选中添加后的选择器，添加规则列表</div>
<center><img src="/css/img/soul/sign-rule.png" style="width:50%;height:50%;"/></center>
<center class="picture-desc">创建规则列表.png</center>
<div class="picture-font">3. 添加appKey与appSecret，进入【系统管理-认证管理】菜单，添加数据</div>
<center><img src="/css/img/soul/sign-appKey.png" style="width:50%;height:50%;"/></center>
<center class="picture-desc">添加appKey.png</center>
<div class="note"><span style="color:red">*</span>根据官方加密方式获取sign值，具体见：<a href="https://dromara.org/website/zh-cn/docs/soul/sign.html">soul-sign插件使用规则</a></div>

&nbsp;
&nbsp; 

##### postman发送HTTP请求调用DUBBO接口验证权限

<div class="picture-font">未加入权限验证参数</div>
<img src="/css/img/soul/sign-auth-fail.png" style="width:100%;height:100%"/>
<center class="picture-desc">验证拦截.png</center>
<div class="picture-font">加入权限验证参数</div>
<img src="/css/img/soul/sign-auth-success.png" style="width:100%;height:100%"/>
<center class="picture-desc">验证通过.png</center>
<div class="note"><span style="color:red">*</span>参数来源具体见：<a href="https://dromara.org/website/zh-cn/docs/soul/sign.html">soul-sign插件使用规则</a></div>

&nbsp; 
&nbsp;

#### 参考文档
--------------------
* [Soul网关项目GitHub地址](https://github.com/Dromara/soul)
* [Soul网关官方参考文档](https://dromara.org/website/zh-cn/docs/soul/soul.html)

