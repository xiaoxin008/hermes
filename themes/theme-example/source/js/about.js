$(function () {

    $(".button-3d").on("click",function () {
        var type = $(this).attr("name");
        var cardName = "."+type+"-card";
        if($(this).hasClass("button-"+type+"-3d-active")){
            $(this).removeClass("button-"+type+"-3d-active");
            $(cardName).css("display","none");
        }else{
            $.each($(".button-3d"),function (i,item) {
                $(item).removeClass("button-"+$(item).attr("name")+"-3d-active");
                $("."+$(item).attr("name")+"-card").css("display","none");
            })
            $(this).addClass("button-"+type+"-3d-active");
            $(cardName).css("display","block");
        }
    });

});