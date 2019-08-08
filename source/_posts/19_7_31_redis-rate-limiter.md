---
layout: post
title: 使用Redis-Lua脚本实现访问限流
date: 2019-07-31 18:01:04
categories: redis
tags: redis rate-limiter
toc: true
---
#### Redis中使用Lua脚本
----
* `减少网络开销` - 在Lua脚本中可以把多个命令放在同一个脚本中运行
* `原子操作` - redis会将整个脚本作为一个整体执行，中间不会被其他命令插入，编写脚本的过程中无需担心会出现竞态条件
* `复用性` - 客户端发送的脚本会永远存储在redis中，这意味着其他客户端可以复用这一脚本来完成同样的逻辑

&nbsp;

#### 令桶法限流
----

<img src="/css/img/redis-usage/bucket.png" style="width:100%;height:100%"/>
<center class="picture-desc">令桶法.gif</center>

<img src="/css/img/redis-usage/step.png" style="width:100%;height:100%"/>
<center class="picture-desc">具体流程.gif</center>

&nbsp;

#### 项目代码
----

##### 项目结构
```
    + config                                            
        RedisConfig.java------------------------------------------------初始化Redis方法
    + constant
        SysConstant.java------------------------------------------------常量类
    + controller
        IndexController.java--------------------------------------------测试接口
    + domain
        RateLimiterBucket.java------------------------------------------令桶实体
    + web
        RateLimiterFilter.java------------------------------------------限流过滤器
    Application.java----------------------------------------------------启动类     
    + resources
        + templates
            login.html--------------------------------------------------测试界面
    application.yml-----------------------------------------------------项目配置文件
    rate_limiter.lua----------------------------------------------------Redis脚本           
 ```
 
##### 项目依赖
```xml
    <properties>
        <java.version>1.8</java.version>
        <fastjson.version>1.2.47</fastjson.version>
        <common.lang3.version>3.8.1</common.lang3.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>fastjson</artifactId>
            <version>${fastjson.version}</version>
        </dependency>

        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>${common.lang3.version}</version>
        </dependency>
    </dependencies>    
```
##### 核心解读
* RedisConfig.java
```java
package com.xiaoxin008.redisusage.config;
/**
 * Redis初始化
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@Configuration
public class RedisConfig{

    /**
     * redisTemplate相关配置
     * @param factory
     * @return
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {

        RedisTemplate<String, Object> template = new RedisTemplate<>();
        // 配置连接工厂
        template.setConnectionFactory(factory);

        //使用fastjson来序列化和反序列化reids的value值(默认使用jdk的序列化方式)
        GenericFastJsonRedisSerializer genericFastJsonRedisSerializer = new GenericFastJsonRedisSerializer();
        template.setDefaultSerializer(genericFastJsonRedisSerializer);
        template.setValueSerializer(genericFastJsonRedisSerializer);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(genericFastJsonRedisSerializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        //修改以上配置，使其生效
        template.afterPropertiesSet();

        return template;
    }

    /**
     * 对hash类型的数据操作
     *
     * @param redisTemplate
     * @return
     */
    @Bean
    public HashOperations<String, String, Object> hashOperations(RedisTemplate<String, Object> redisTemplate) {
        return redisTemplate.opsForHash();
    }

    /**
     * 对string类型的数据操作
     *
     * @param redisTemplate
     * @return
     */
    @Bean
    public ValueOperations<String, Object> valueOperations(RedisTemplate<String, Object> redisTemplate) {
        return redisTemplate.opsForValue();
    }

    /**
     * 对list类型的数据操作(链表)
     *
     * @param redisTemplate
     * @return
     */
    @Bean
    public ListOperations<String, Object> listOperations(RedisTemplate<String, Object> redisTemplate) {
        return redisTemplate.opsForList();
    }

    /**
     * 对set类型的数据操作(无序集合)
     *
     * @param redisTemplate
     * @return
     */
    @Bean
    public SetOperations<String, Object> setOperations(RedisTemplate<String, Object> redisTemplate) {
        return redisTemplate.opsForSet();
    }

    /**
     * 对zset类型的数据操作(有序集合)
     *
     * @param redisTemplate
     * @return
     */
    @Bean
    public ZSetOperations<String, Object> zSetOperations(RedisTemplate<String, Object> redisTemplate) {
        return redisTemplate.opsForZSet();
    }
}
```
* RateLimiterBucket.java
```java
package com.xiaoxin008.redisusage.domain;
/**
 * 令桶
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@Data
public class RateLimiterBucket implements Serializable {

    //容量
    private Long capacity;
    //速率
    private Long rate;
}
```
* RateLimiterFilter.java
```java
package com.xiaoxin008.redisusage.web;
/**
 * 限流过滤器
 *
 * @author xiaoxin008(313595055 @ qq.com)
 * @since 1.0.0
 */
@WebFilter(urlPatterns = "/index",filterName = "rateLimiterFilter")
public class RateLimiterFilter implements Filter {

    @Autowired
    private RedisTemplate<String,Object> redisTemplate;

    private RedisScript<Boolean> redisScript;

    private RateLimiterBucket limiterBucket;

    @Override
    public void init(FilterConfig config){
        //初始化令桶
        RateLimiterBucket bucket = new RateLimiterBucket();
        bucket.setCapacity(20L);
        bucket.setRate(100L);
        limiterBucket = bucket;
        //初始化脚本
        DefaultRedisScript script = new DefaultRedisScript<>();
        ClassPathResource resource=new ClassPathResource("rate_limiter.lua");
        script.setScriptSource(new ResourceScriptSource(resource));
        script.setResultType(Boolean.class);
        redisScript = script;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException,ServletException {
        HttpServletRequest req = (HttpServletRequest)request;
        HttpServletResponse res = (HttpServletResponse)response;
        String requestURI = req.getServletPath();
        //生成redis-key
        List<String> keys = generateKeys(requestURI);
        //执行lua脚本 传入key 令桶对象 返回是否受限结果
        Boolean isAllow = redisTemplate.execute(redisScript, keys, limiterBucket);
        if(isAllow){
            //true 不受限 正常放行
            chain.doFilter(request,response);
        }else{
            //false 受限 返回受限提示
            res.getWriter().print("server is too busy!!!");
        }
    }

    @Override
    public void destroy() {
        //清除所有限流
        redisTemplate.delete(SysConstant.REDIS_GROUP.concat(":").concat(SysConstant.RATE_LIMITER_GROUP));
    }

    private List<String> generateKeys(String url){
        List<String> keys = Arrays.asList(SysConstant.REDIS_GROUP, SysConstant.RATE_LIMITER_GROUP, url);
        return Arrays.asList(StringUtils.join(keys, ":"));
    }
}
```
* application.yml
```yaml
server:
  port: 8080
  servlet:
    context-path: "/rate"

spring:
  thymeleaf:
    cache: false
  redis:
    # 地址
    host: 127.0.0.1
    # 端口
    port: 6379
    # 连接超时时间（毫秒）
    timeout: 5000
    # 采用jedis方式实现
    jedis:
      pool:
        # 连接池最大连接数（使用负值表示没有限制）
        max-active: 8
        # 连接池最大阻塞等待时间（使用负值表示没有限制）
        max-wait: -1
        # 连接池中的最大空闲连接
        max-idle: 8
        # 连接池中的最小空闲连接
        min-idle: 0
```
* rate_limiter.lua
```lua
-- 取到传入的redis-key
local key = KEYS[1];
-- 取到传入的令桶速率（过期时间）
local rate = cjson.decode(ARGV[1]).rate;
-- 取到传入的令桶容量（redis-value）
local capacity = cjson.decode(ARGV[1]).capacity;
-- 去redis-server中取此key的值
local current = tonumber(redis.call("get",key));
-- 如果为null
if current == nil then
-- 存入数据 value =  令桶容量 - 1 过期时间为令桶速率   
    redis.call("setex",key,rate,capacity - 1);
else
-- 如果不为null 并且 value == 0 
    if current == 0 then
-- 返回false 限制其访问        
        return false
-- 如果不为null 并且 value != 0 
    else
-- 存入数据 value =  value - 1 过期时间为令桶速率       
        redis.call("setex",key,rate,current - 1);
    end
end
-- 返回true允许其访问
return true
```

&nbsp;

#### 源码地址 & 借鉴资料
----
* 源码地址：[https://github.com/xiaoxin008/redis-usage](https://github.com/xiaoxin008/redis-usage)
* 在Redis中使用Lua脚本：[https://my.oschina.net/u/3847203/blog/3023066](https://my.oschina.net/u/3847203/blog/3023066)
