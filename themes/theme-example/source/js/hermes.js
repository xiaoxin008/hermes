var Hermes = (function () {

    var _init = function () {
        //为card加入随机图片
        $.each($(".cardImg"),function (i,item) {
            $(item).attr("src","/css/img/rabbit"+(i+1)+".png");
        })
    };

    var _bind = function(){
        //为card绑定mouseover mouseout事件
        $(".card-body").on("mouseover",function () {
            var img = $(this).find(".cardImg");
            var imgPath = img.attr("src");
            img.attr("src",imgPath.substring(0,imgPath.lastIndexOf("."))+".gif");
        });

        $(".card-body").on("mouseout",function () {
            var img = $(this).find(".cardImg");
            var imgPath = img.attr("src");
            img.attr("src",imgPath.substring(0,imgPath.lastIndexOf("."))+".png");
        });
    };

    var HermesFun = function(){

    };

    HermesFun.prototype.init = function() {
        _init();
        _bind();
        return this;
    };

    //返回构造函数
    return HermesFun;

})($,document,window);