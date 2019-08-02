---
layout: post
title: SpringSecurity-OAuth2-SpringSocial构建统一认证登陆中心 
date: 2019-07-25 10:42:04
categories: spring
tags: spring spring-social
toc: true
---
#### 流程简述           
----
<img src="/css/img/security-oauth/springsecurity-oauth2-social.png" style="width:100%;height:100%"/>
<center class="picture-desc">简单流程图.gif</center>

&nbsp;

#### 认证中心服务端代码           
----

##### 项目结构
```
    + controller                                            
        AccountController.java------------------------------------------统一账户控制器
        LoginController.java--------------------------------------------登录控制器
        UserController.java---------------------------------------------用户控制器
    + core
        + security
           AuthRedisTokenStore.java-------------------------------------Redis存储Token支持 
           AuthServerConfig.java ---------------------------------------初始化授权服务器
           ResourceServerConfig.java------------------------------------初始化资源服务器 
           SecurityConfig.java------------------------------------------SpringSecurity初始化配置 
        + social
           CertificationSocialUserDetailsService.java-------------------绑定统一账户服务类
           SignUpController.java----------------------------------------绑定统一账户控制器
           SocialConfig.java--------------------------------------------SpringSocial初始化配置   
    + dao
        AccountMapper.java----------------------------------------------统一账户Mapper
    + domain
        Account.java----------------------------------------------------统一账户实体
        Role.java-------------------------------------------------------角色实体
    + service
        + impl
             AccountServiceImpl.java------------------------------------统一账户服务实现 
        AccountService.java---------------------------------------------统一账户服务接口
    + util
        MyPasswordEncoder.java------------------------------------------加密工具类
    Application.java----------------------------------------------------启动类     
    + resources
        + mapper
            AccountMapper.xml-------------------------------------------统一账户Mapper
        + static
        + templates
            login.html--------------------------------------------------登录操作界面
            register.html-----------------------------------------------绑定操作界面
    application.yml-----------------------------------------------------项目配置文件
    logback-spring.xml--------------------------------------------------日志配置文件            
 ```

##### 项目依赖

```xml
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Finchley.SR2</spring-cloud.version>
        <docker.registry.name>xiaoxin008</docker.registry.name>
        <spring-social.version>1.1.6.RELEASE</spring-social.version>
        <spring-social-crypto.version>5.0.0.M2</spring-social-crypto.version>
        <spring-social.github.version>1.0.0.M4</spring-social.github.version>
        <mybatis.version>2.0.1</mybatis.version>
        <httpclient.version>4.5.3</httpclient.version>
        <fastjson.version>1.2.58</fastjson.version>
    </properties>

    <dependencies>
        <!--springboot监控节点-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!--redis依赖-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <!--thymeleaf依赖-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <!--web依赖-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!--mybatis依赖-->
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>${mybatis.version}</version>
        </dependency>
        <!--springcloud-eureka依赖-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
        </dependency>
        <!--oauth2依赖-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-oauth2</artifactId>
        </dependency>
        <!--springsocial 基础包-->
        <dependency>
            <groupId>org.springframework.social</groupId>
            <artifactId>spring-social-config</artifactId>
            <version>${spring-social.version}</version>
        </dependency>
        <!--springsocial 提供社交连接框架和OAuth 客户端支持 -->
        <dependency>
            <groupId>org.springframework.social</groupId>
            <artifactId>spring-social-core</artifactId>
            <version>${spring-social.version}</version>
        </dependency>
        <!--springsocial 提供社交安全支持 -->
        <dependency>
            <groupId>org.springframework.social</groupId>
            <artifactId>spring-social-security</artifactId>
            <version>${spring-social.version}</version>
        </dependency>
        <!--springsocial 管理web应用程序的连接 -->
        <dependency>
            <groupId>org.springframework.social</groupId>
            <artifactId>spring-social-web</artifactId>
            <version>${spring-social.version}</version>
        </dependency>
        <!-- springsocial 对spring-security提供支持-->
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-crypto</artifactId>
            <version>${spring-social-crypto.version}</version>
        </dependency>
        <!-- springsocial 对github提供支持-->
        <dependency>
            <groupId>org.springframework.social</groupId>
            <artifactId>spring-social-github</artifactId>
            <version>${spring-social.github.version}</version>
        </dependency>
        <!--httpclient-->
        <dependency>
            <groupId>org.apache.httpcomponents</groupId>
            <artifactId>httpclient</artifactId>
            <version>${httpclient.version}</version>
        </dependency>
        <!--json工具-->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>fastjson</artifactId>
            <version>${fastjson.version}</version>
        </dependency>
        <!--mysql-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
        <!--配置文件属性注入支持-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
            <optional>true</optional>
        </dependency>
        <!--lombok-->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!--测试-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
```

##### 项目核心类及核心配置解读
* application.yml
```yaml
    # 服务器端口号
    server:
      port: 9090
    
    # eureka注册中心地址
    eureka:
      client:
        serviceUrl:
          defaultZone: http://localhost:8070/eureka
    
    spring:
      # 应用名称
      application:
        name: certification-server
      # 关闭thymeleaf缓存  
      thymeleaf:
        cache: false
      # mysql
      datasource:
        name: local
        url: jdbc:mysql://localhost:3306/certification?
              useUnicode=true&characterEncoding=utf8&serverTimezone=UTC
        driver-class-name: com.mysql.jdbc.Driver
        username: root
        password: admin
      # redis  
      redis:
        host: 127.0.0.1
        port: 6379
    
    # mybatis配置
    mybatis:
      mapperLocations: classpath:/mapper/*.xml
      type-aliases-package: com.xiaoxin.certification.dao.*Mapper
    
    # 日志相关
    logging:
      config: classpath:logback-spring.xml
      path: ../certification-server/logs/
    
    # Github OAuth 服务器
    github:
      clientId: 55faa83726f98252c50e
      secret: 7b030111dcc88c652d045be5c599dcd661ac9aa7
      auth-url: /auth/github
    
    # 应用url
    application:
      url: http://localhost:9090/
```
* AuthServerConfig.java
```java
package com.xiaoxin.certification.core.security;
/**
 * 授权服务器配置类
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@Configuration
@EnableAuthorizationServer //启用授权服务器
public class AuthServerConfig extends AuthorizationServerConfigurerAdapter {

    @Autowired
    private RedisConnectionFactory redisConnectionFactory;

    @Autowired
    private DataSource dataSource;

    @Bean
    public TokenStore tokenStore() {
        return new AuthRedisTokenStore(redisConnectionFactory);
    }

    @Override
    public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
        //使用redis来存储验证返回的token
        endpoints.tokenStore(tokenStore());
        //请求token的request method 可以为 GET或者POST（方便测试，可以去除）
        endpoints.allowedTokenEndpointRequestMethods(HttpMethod.GET, HttpMethod.POST);
    }

    @Override
    public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
        //从数据库加载client信息
        clients.jdbc(dataSource);
    }

    @Override
    public void configure(AuthorizationServerSecurityConfigurer oauthServer) throws Exception {
        //允许表单认证
        oauthServer.allowFormAuthenticationForClients();
    }
}
```
* ResourceServerConfig.java
```java
package com.xiaoxin.certification.core.security;
/**
 * 资源服务器配置类
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@Order(6) //加载顺序必须在SecurityConfig.java之后
@Configuration
@EnableResourceServer //启用资源服务器
@EnableGlobalMethodSecurity(prePostEnabled = true) //使用表达式时间方法级别的安全性
public class ResourceServerConfig extends ResourceServerConfigurerAdapter {

    @Override
    public void configure(HttpSecurity http) throws Exception {
     http.csrf().disable().exceptionHandling()
                //处理错误信息
                .authenticationEntryPoint((request, response, authException) 
                    -> response.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                .and()
                .authorizeRequests()
                //所有通过的url全部需要权限过滤
                .anyRequest().authenticated()
                .and()
                //基于http基本验证
                .httpBasic();
    }
}
```
* SecurityConfig.java
```java
package com.xiaoxin.certification.core.security;

/**
 * SpringSecurity基础配置
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@EnableWebSecurity //启用SpringSecurity
@Configuration
@Order(2) //执行顺序一定要在 ResourceServerConfig.java 前
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
       HttpSecurity security = http.requestMatchers()
                .antMatchers("/account/**","/login","/auth/**","/signup","/connect/**","/register","/oauth/**") //拦截的url
                .and()
                .authorizeRequests()
                .antMatchers("/account/**").hasRole("ADMIN") //添加权限
                .antMatchers("/auth/**","/signup","/connect/**","/register","/oauth/**").permitAll() //放行的url
                .anyRequest().authenticated()
                .and()
                .formLogin().loginPage("/login").permitAll()
                .and().csrf().disable();
        security.apply(new SpringSocialConfigurer());
    }
}
```
* SocialConfig.java
```java
package com.xiaoxin.certification.core.social;
/**
 * SpringSocial初始化类
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@EnableSocial //启用SpringSocial
@Configuration
public class SocialConfig implements SocialConfigurer {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private Environment environment;

    /**
     * 创建链接工厂
     * @param configurer
     * @param environment
     */
    @Override
    public void addConnectionFactories(ConnectionFactoryConfigurer configurer, Environment environment) {
        //创建GitHubConnectionFactory(专门用来创建GitHubConnection对象的)
        configurer.addConnectionFactory(new GitHubConnectionFactory(environment.getProperty("github.clientId"), environment.getProperty("github.secret")));
    }

    /**
     * 创建用户保留和恢复连接设置
     * @param connectionFactoryLocator
     * @return UsersConnectionRepository
     */
    @Override
    public UsersConnectionRepository getUsersConnectionRepository(ConnectionFactoryLocator connectionFactoryLocator) {
        //从GitHub上获取的用户对象存入数据库中
        return new JdbcUsersConnectionRepository(dataSource, connectionFactoryLocator, Encryptors.noOpText());
    }

    @Override
    public UserIdSource getUserIdSource() {
        //基于SecurityContextHolder的UserIdSource实现类（为与SpringSecurity集成）
        return new AuthenticationNameUserIdSource();
    }

    /**
     * 创建ConnectController Bean
     * @param connectionFactoryLocator
     * @param connectionRepository
     * @return
     */
    @Bean
    public ConnectController connectController(
            ConnectionFactoryLocator connectionFactoryLocator,
            ConnectionRepository connectionRepository) {
        ConnectController connectController = new ConnectController(connectionFactoryLocator, connectionRepository);
        //设置应用url
        connectController.setApplicationUrl(environment.getProperty("application.url"));
        return connectController;
    }

    /**
     * 注册使用工具
     * @param connectionFactoryLocator
     * @param connectionRepository
     * @return
     */
    @Bean
    public ProviderSignInUtils providerSignInUtils(ConnectionFactoryLocator connectionFactoryLocator,
                                                   UsersConnectionRepository connectionRepository){
        //使用这个bean的doPostSignUp来关联本地统一账户和远程github账号
        return new ProviderSignInUtils(connectionFactoryLocator,connectionRepository);
    }
}
```
* SignUpController.java
```java
package com.xiaoxin.certification.core.social;
/**
 * 绑定页面
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@Controller
public class SignUpController {

    @Autowired
    private ProviderSignInUtils providerSignInUtils;

    @Autowired
    private Environment environment;

    @Autowired
    private AccountService accountService;

    @RequestMapping(value="/signup", method= RequestMethod.GET)
    public String signup(WebRequest request) {
        //当GitHub OAuth返回账号相关信息时，会使用UserIdSource的getUserId()去查询服务器是否为其
        //分配好了统一账户的userId，如果获得到的userId为NULL会跳至此接口让用户绑定统一账户，如果
        //不为NULL则直接进入所请求页面（在权限范围内）
        return "register";
    }

    @RequestMapping(value="/signup", method= RequestMethod.POST)
    public String signupForm(String phone,String password, WebRequest request) {
        //绑定页面提交的统一账户信息，如果存在此统一账户直接使用providerSignInUtils.doPostSignUp绑定GitHub账号和统一账户
        //如果不存在此统一账户，则创建之后再进行绑定
        Account account = accountService.getAccountByUsername(phone);
        if(account == null){
            Account a = new Account(phone,password);
            accountService.insertAccount(a);
        }
        providerSignInUtils.doPostSignUp(phone,request);
        //最后重定向到请求授权url 重新刷新上面的过程
        return "redirect:".concat(environment.getProperty("github.auth-url"));
    }
}
```
* CertificationSocialUserDetailsService.java
```java
package com.xiaoxin.certification.core.social;

/**
 * 获取统一账户
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@Service
public class CertificationSocialUserDetailsService implements SocialUserDetailsService {

    @Autowired
    private AccountService accountService;

    //SpringSocial获取所绑定的统一账户方法
    @Override
    public SocialUserDetails loadUserByUserId(String username) throws UsernameNotFoundException {
        Account account = accountService.getAccountByUsername(username);
        List<Role> roles = account.getRoles();
        List<String> roleNames = roles.stream().map(Role::getExpression).collect(Collectors.toList());
        SocialUser socialUser = new SocialUser(account.getUsername(), account.getPassword(), AuthorityUtils.createAuthorityList(roleNames.toArray(new String[roleNames.size()])));
        return socialUser;
    }
}

```
* UserController.java
```java
package com.xiaoxin.certification.controller;
/**
 * 用户控制器
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@Controller
public class UserController {

    /**
     * 向客户端返回用户信息接口
     * @param principal
     * @return
     */
    @RequestMapping("/user")
    @ResponseBody
    public Principal user(Principal principal) {
        OAuth2Authentication authentication = (OAuth2Authentication) principal;
        Authentication userAuthentication = authentication.getUserAuthentication();
        //因为SpringSecurity会把用户信息装成UsernamePasswordAuthenticationToken.class返回，而
        //SpringSocial会把用户信息封装为SocialAuthenticationToken.class，所以需要转换一下
        if(userAuthentication instanceof SocialAuthenticationToken){
            principal = new UsernamePasswordAuthenticationToken(
                    userAuthentication.getPrincipal(),userAuthentication.getCredentials(),userAuthentication.getAuthorities());
        }
        return principal;
    }
}
```

&nbsp;

#### 认证中心客户端代码           
----

##### 项目结构
```
    + config                                            
        ResourceServerConfig.java---------------------------------------初始化资源服务器
    + controller
        IndexController.java--------------------------------------------首页控制器
    + security
        SecurityConfig.java---------------------------------------------SpringSecurity初始化配置
    Application.java----------------------------------------------------启动类     
    + resources
        + static
        + templates
            index.html--------------------------------------------------首页操作界面
            securedPage.html--------------------------------------------受保护界面
    application.yml-----------------------------------------------------项目配置文件
    logback-spring.xml--------------------------------------------------日志配置文件            
 ```

##### 项目依赖

```xml
    <properties>
        <java.version>1.8</java.version>
        <spring-cloud.version>Finchley.SR2</spring-cloud.version>
        <docker.registry.name>xiaoxin008</docker.registry.name>
        <thymeleaf-extras-springsecurity4.version>3.0.2.RELEASE</thymeleaf-extras-springsecurity4.version>
    </properties>

    <dependencies>
        <!--thymeleaf-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <!--web-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!--eureka-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
        </dependency>
        <!--oauth2-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-oauth2</artifactId>
        </dependency>
        <!--springsecurity-->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-security</artifactId>
        </dependency>
        <!--支持thymeleaf使用springsecurity相关标签 并且 只支持2.10以下版本的springboot-->
        <dependency>
            <groupId>org.springframework.security.oauth.boot</groupId>
            <artifactId>spring-security-oauth2-autoconfigure</artifactId>
        </dependency>
        <dependency>
            <groupId>org.thymeleaf.extras</groupId>
            <artifactId>thymeleaf-extras-springsecurity4</artifactId>
            <version>${thymeleaf-extras-springsecurity4.version}</version>
        </dependency>
        <!--lombok-->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!--test-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>    
```
##### 项目核心类及核心配置解读
* application.yml
```yaml
# 服务器
server:
  port: 8882
  servlet:
    # 一定要有上下文，因为启用单点登录时，SpringSecurity会对"/"有特殊处理   
    context-path: /client
  session:
    cookie:
      name: SESSION1
      
# spring-security
security:
  auth-server: http://localhost:9090
  oauth2:
    # oAuth认证中心配置   
    client:
      clientId: certification
      clientSecret: 123456
      accessTokenUri: ${security.auth-server}/oauth/token
      userAuthorizationUri: ${security.auth-server}/oauth/authorize
      scope: read
    resource:
      userInfoUri: ${security.auth-server}/user

# spring
spring:
  application:
    name: certification-client-1
  thymeleaf:
    cache: false

# eureka
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8070/eureka

# 日志
logging:
  config: classpath:logback-spring.xml
  path: ../logs/certification-client-1
```
* ResourceServerConfig.java
```java
package com.xiaoxin008.client.config;

/**
 * 资源服务器配置类
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@Order(6) //加载顺序必须在SecurityConfig.java之后
@Configuration
@EnableResourceServer //启用资源服务器
@EnableGlobalMethodSecurity(prePostEnabled = true) //使用表达式时间方法级别的安全性
public class ResourceServerConfig extends ResourceServerConfigurerAdapter {

    @Override
    public void configure(HttpSecurity http) throws Exception {
     http.csrf().disable().exceptionHandling()
                //异常处理  
                .authenticationEntryPoint((request, response, authException) -> response.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                .and()
                .authorizeRequests()
//                .antMatchers(HttpMethod.GET,"/read").access("#oauth2.hasScope('read')")
//                .antMatchers(HttpMethod.GET,"/write").access("#oauth2.hasScope('write')")
                //所有资源必须经过权限过滤
                .anyRequest().authenticated()
                .and()
                .httpBasic();
    }
}
```
* SecurityConfig.java
```java
package com.xiaoxin008.client.security;

/**
 * 安全初始化配置
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@Order(2) //执行顺序一定要在 ResourceServerConfig.java 前
@EnableOAuth2Sso //启用单点登录
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    public void configure(HttpSecurity http) throws Exception {
        http.requestMatchers()
                //拦截所有url
                .antMatchers("/**")
                .and()
                .authorizeRequests()
                //放行登陆url    
                .antMatchers("/login**","/").permitAll()
                //其余url进行权限过滤
                .anyRequest().authenticated()
                .and()
                //禁用csrf
                .csrf().disable().cors();
    }
}
```
* securedPage.html(使用thymeleaf对SpringSecurity标签支持)
```html
<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org"
      xmlns:sec="http://www.thymeleaf.org/thymeleaf-extras-springsecurity4">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Spring Security SSO</title>
    <link rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" />
</head>

<body>
<div class="container">
    <div class="col-sm-12">
        <h1>Secured Page</h1>
        <!--Welcome, <p>登录者:<span th:text="${#httpServletRequest.remoteUser}"></span></p>-->
        <div sec:authorize="isAuthenticated()">
            <p>已有用户登录</p>
            <p>登录者:<span sec:authentication="name"></span></p>
            <p>角色:<span sec:authentication="authorities"></span></p>
            <p>是否是管理员:<span sec:authorize="hasRole('ROLE_ADMIN')">是</span><span sec:authorize="!hasRole('ROLE_ADMIN')">否</span></p>
        </div>
        <div sec:authorize="isAnonymous()">
            <p>未有用户登录</p>
        </div>
    </div>
</div>
</body>
</html>
```

&nbsp;

#### 结果演示    
----
* 正常登陆演示
<img src="/css/img/security-oauth/common.gif" style="width:100%;height:100%"/>
<center class="picture-desc">正常登陆.gif</center>
* GitHub登陆演示
<img src="/css/img/security-oauth/github.gif" style="width:100%;height:100%"/>
<center class="picture-desc">GitHub登陆.gif</center>
* 单点登录演示
<img src="/css/img/security-oauth/sso.gif" style="width:100%;height:100%"/>
<center class="picture-desc">单点登陆.gif</center>

&nbsp;

#### 优化方向    
----
* 从数据库中动态加载权限数据
* 资源服务器相关配置优化
* 错误页面
* 微信，微博等登陆实现
* 实现 `scope` 权限控制
* 取消绑定和退出登录功能实现
* 登录加入验证码
* `Remember Me` 功能实现
* 加入短信登录方式和短信登录绑定
* 实现前后端分离

&nbsp;

#### 源码地址 & 借鉴资料           
----
* 源码地址：[https://github.com/xiaoxin008/certification](https://github.com/xiaoxin008/certification)
* OAuth2设计理念：[http://www.ruanyifeng.com/blog/2014/05/oauth_2_0.html](http://www.ruanyifeng.com/blog/2014/05/oauth_2_0.html)
* SpringSecurity基于OAuth2单点登录：[https://www.cnblogs.com/xifengxiaoma/p/10043173.html](https://www.cnblogs.com/xifengxiaoma/p/10043173.html)
* SpringSocial文档：[https://docs.spring.io/spring-social/docs](https://docs.spring.io/spring-social/docs/current-SNAPSHOT/reference/htmlsingle/#section_how-to-get)
* SpringSocial-GitHub简易登录：[https://www.cnblogs.com/sky-chen/p/10530678.html](https://www.cnblogs.com/sky-chen/p/10530678.html)


