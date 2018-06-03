var userInfo;
var config = null;

var newTime = null;

//main 入口
if (/https:\/\/bihu.com\/people\//.test(window.location.href)) {
    //console.log('enter content-userPage.js');
    chrome.runtime.sendMessage({
        'method': 'getConfig'
    }, function(response) {
        if (response.success) {
            config = response.config;
            if (!document.getElementById('userFavIcon')) {
                console.log('try add userFavIcon');
                setTimeout(getUserDom, 500);
                chrome.runtime.onMessage.addListener(
                    function(request, sender, sendResponse) {
                        if (request.method == "needRefresh") {
                            if (request.userId == userInfo.id) {
                                location.reload();
                            }
                        }
                    });
            }
        }
    });
    var url = window.location.href;
    var time_Reg = new RegExp("(^|&)" + 'time' + "=([^&]*)(&|$)", "i");
    time = window.location.search.substr(1).match(time_Reg);
    if (time) {
        newTime = unescape(time[2]);
    }
}

function getUserDom() {
    try {
        console.log('try to get the user dom');
        let head = document.getElementsByClassName('head-public head-info')[0];
        if (head.firstElementChild.innerText) {
            getUserInfo();
        } else {
            setTimeout(getUserDom, 200);
        }
    } catch (e) {
        console.log('getuserdom try ')
        console.log(e);
        setTimeout(getUserDom, 200);
    }
}

function getUserInfo() {
    let name = document.getElementsByClassName('head-public head-info')[0].firstElementChild.innerText;
    let url = window.location.href;
    let id = window.location.href.replace(/^\D+/g, '');
    let words = document.getElementsByClassName('head-public head-info')[0].children[1].innerText;
    userInfo = {
        name,
        url,
        id,
        words
    }
    if (config.addFav) {
        addFavDom();
    }
    if (config.inpageSearch) {
        addSearchDom();
    }
    if (config.quickZan) {
        addQuickZanDom();
    }
}

function addQuickZanDom() {
    if ($("#quickZanBox").get(0)) {
        return;
    }
    var zanDom = $("\
        <div  id='quickZanBox' style='border-radius: 2px;border: 1px solid #007bff;font-size: 12px;padding: 1px; background:white;'>\
        <div style='text-align:right;border-bottom: 1px solid #c3ced4; padding:2px; display:flex; flex-direction:row; justify-content: space-between'> \
        <div style='color:grey'>注意，频繁操作可能会被服务器屏蔽导致短期无法访问</div>\
        <div style='flex:1'></div>\
        <div>发文时间：<span style='margin-right:10px;' id='newTime'></span></div>\
        <div style='color:blue;margin-right:10px;' id='serverTime'></div>\
        <div style='color:red' id='zanAlert'></div>\
        <button style='margin-left:10px;background:#007bff; border-radius:10%; color:white; padding: 2px;' id='getLatestArticle'> 获取最新文章</button>\
        <button style='margin-left:10px;background:#25af1e; border-radius:10%; color:white; padding: 2px;' id='zanLatest'> 点赞</button>\
        <div style='color:red;margin-left:10px;' id='zanLog'></div> \
        </div>\
        <div style='text-align:right; margin: 10px 0px 10px'>\
        <div ><span id='latestTitle'></span><span>【题目】</span></div>\
        <div ><a id='latestUrl' target='_blank'></a><span>【链接】</span></div>\
        <div ><span id='latestTime'></span><span>【时间】</span></div>\
        <div ><span id='latestId'></span><span> 【编号】</span></div>\
        <div ><span id='latestVotes'></span><span>【票数】</span></div>\
        </div>\
        </div>\
        <div style='font-size: 12px;color: #c1c1c1; text-align: right; margin-bottom:10px;'>快速点赞模块By币乎增强插件</div>\
        ");
    zanDom.insertBefore('.alt-list');
    $("#zanLog").hide();
    $("#getLatestArticle").click(getLatestArticle);
    $("#zanLatest").click(zanLatest);
    $("#zanLatest").hide();
    if(newTime){
        $("#newTime").show();
        $("#newTime").text(newTime);
    }else{
        $("#newTime").hide();
    }
}

function zanLatest() {
    var url = 'https://be02.bihu.com/bihube-pc/api/content/upVote';
    var id = $("#latestId").text();
    var logInfo = localStorage.getItem('ANDUI_BIHU_LOGININFO');
    var userId = JSON.parse(logInfo).userId;
    var accessToken = JSON.parse(logInfo).accessToken;
    var params = {
        userId,
        accessToken,
        artId: id
    };
    $.get('https://bihu.com/article/'+id, function(res){});
    $.post(url, params, function(res) {
        if (res.resMsg == 'success') {
            $("#zanLog").text('点赞成功!');
            $("#zanLog").show();
        } else {
            $("#zanLog").text(res.resMsg);
            $("#zanLog").show();
        }
    })
    $("#zanLatest").prop('disabled', true);
    $("#zanLatest").css('background', '#babfc5');
    setTimeout(function() {
        $("#zanLatest").prop('disabled', false);
        $("#zanLatest").css('background', '#007bff');
    }, 2000);
}

var serverTime = null;
var serTimeInterval = null;

function refreshServerTime() {
    if (!serverTime) {
        return;
    }
    serverTime.setSeconds(serverTime.getSeconds() + 1);
    var hour = serverTime.getHours();
    var minute = serverTime.getMinutes() ;
    var second = serverTime.getSeconds();
    var str = ('0'+hour).slice((''+hour).length - 1) + ':' + ('0'+minute).slice((''+minute).length - 1) + ':' + ('0'+second).slice((''+second).length - 1) ;
    $("#serverTime").text('服务器时间 ' + str);
}

function getLatestArticle() {
    $("#zanLatest").hide();
    $("#latestTitle").text('????');
    $("#latestTime").text('????');
    $("#latestUrl").text('????');
    $("#latestVotes").text('????');
    $("#latestId").text('????');
    $("#zanAlert").text('');
    var id = window.location.href.replace(/.*people\//, '').replace(/\?.*/, '').replace('/', '');
    if (!(/^\d+$/.test(id))) {
        alert('网址错误');
        return;
    }
    console.log('try to get ' + id + '\'s article');
    var url = 'https://be01.bihu.com/bihu-be/api/content/show/getUserArtList';
    var logInfo = localStorage.getItem('ANDUI_BIHU_LOGININFO');
    var userId = JSON.parse(logInfo).userId;
    var accessToken = JSON.parse(logInfo).accessToken;
    var params = {
        queryUserId: id,
        pageNum: 1,
        userId,
        accessToken
    }
    $.get(window.location.href, function(res){});
    $.post(url, params, function(data) {
        if (data.resMsg == 'success') {
            $("#zanLatest").show();
            var latestArc = data.data.list[0];
            var pubTime = new Date(latestArc.createTime);
            var timeStr = pubTime.getFullYear() + '-' + (pubTime.getMonth() + 1) + '-' + pubTime.getDate() + ' ' + pubTime.getHours() + ':' + pubTime.getMinutes() + ':' + pubTime.getSeconds();

            $("#latestTitle").text(latestArc.title);
            $("#latestTime").text(timeStr);
            $("#latestVotes").text(latestArc.ups);
            $("#latestId").text(latestArc.id);
            $("#latestUrl").prop('href', 'https://bihu.com/article/' + latestArc.id);
            $("#latestUrl").text('https://bihu.com/article/' + latestArc.id);
            //console.log($(".content-public.title").get(0).innerText );
            //console.log(latestArc.title);



            if ($(".content-public.title").get(0).innerText != latestArc.title) {
                $("#quickZanBox").css('box-shadow', '0px 0px 20px #007bff');
                $("#zanAlert").text('有新文章!');
                if (config.autoZanAfterGetLatestArc) {

                    url = 'https://be02.bihu.com/bihube-pc/api/content/upVote';
                    var params = {
                        userId,
                        accessToken,
                        artId: latestArc.id
                    };
                    $.post(url, params, function(res) {
                        if (res.resMsg == 'success') {
                            $("#zanLog").text('点赞成功!');
                            $("#zanLog").show();
                        } else {
                            $("#zanLog").text(res.resMsg);
                            $("#zanLog").show();
                        }
                    })
                    $("#zanLatest").prop('disabled', true);
                    $("#zanLatest").css('background', '#babfc5');
                    setTimeout(function() {
                        $("#zanLatest").prop('disabled', false);
                        $("#zanLatest").css('background', '#007bff');
                    }, 2000);

                }
            }

        }
    });



    $("#getLatestArticle").prop('disabled', true);
    $("#getLatestArticle").css('background', '#babfc5');
    setTimeout(function() {
        $("#getLatestArticle").prop('disabled', false);
        $("#getLatestArticle").css('background', '#007bff');
    }, 1000 + Math.random() * 1000);

    $.ajax({
        async: false,
        cache: false,
        complete: function(req, textStatus) {
            var dateString = req.getResponseHeader('Date');
            if (dateString.indexOf('GMT') === -1) {
                dateString += ' GMT';
            }
            serverTime = new Date(dateString);
            if (serTimeInterval) {
                clearInterval(serTimeInterval);
            }
            serTimeInterval = setInterval(refreshServerTime, 1000);
        }
    });

}

function updateFav() {
    //console.log(userInfo);
    let favDom = document.getElementsByClassName('favIcon')[0];
    chrome.runtime.sendMessage({
        method: "checkFavUser",
        userId: userInfo.id
    }, function(response) {
        //console.log(response);
        if (response.success) {
            favDom.children[1].children[0].innerText = '已收藏';
            favDom.children[0].children[0].style.color = 'blue';
        } else {
            favDom.children[1].children[0].innerText = '未收藏';
            favDom.children[0].children[0].style.color = '';
        }
    });
}

function addFavDom() {
    if ($("#userFavIcon").get(0)) {
        return;
    }
    document.getElementsByClassName('head-public head-btn')[0].firstElementChild.style.setProperty('right', '140px', 'important');
    let headBox = document.getElementsByClassName('head-box-child')[0];
    let favDom = document.createElement('div');
    favDom.setAttribute('class', 'favIcon');
    favDom.setAttribute('id', 'userFavIcon');
    favDom.innerHTML = '<div><i class="iconfont theFavIcon" style="font-size: 30px; display: block !important"  title="收藏到币乎增强插件">&#xe60d;</i></div><div><span class="selfNote theFavNote">未收藏</span></div>';
    //favDom.style.setProperty('display','block','important');

    favDom.style.cssText = " \
    display: block !important;\
       position: absolute;\
    top: 32px;\
    right: 70px;\
    text-align: center;\
    cursor:pointer;\
    ";
    headBox.appendChild(favDom);
    favDom.onclick = clickFav;
    updateFav();
}



function clickFav() {
    //console.log('click fav button');
    chrome.runtime.sendMessage({
        method: "checkFavUser",
        userId: userInfo.id
    }, function(response) {
        //console.log(userInfo);
        if (response.success) {
            chrome.runtime.sendMessage({
                method: 'delFavUser',
                userId: userInfo.id
            }, function(response) {
                if (response.success) {
                    updateFav();
                }
            })
        } else {
            chrome.runtime.sendMessage({
                method: 'addFavUser',
                data: userInfo
            }, function(response) {
                if (response.success) {
                    updateFav();
                }
            })
        }
    });

}

//function: search the page
//date: 2018-4-19 10:45

var userHeaderDom;
var loopId = -1;
var searchContent;
var loadCount = 0;

//watch for the change of dom, and filter

/**watch the url change
(function(history){
    var pushState = history.pushState;
    history.pushState = function(state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({state: state});
        }
        return pushState.apply(history, arguments);
    };
})(window.history);
window.onpopstate = history.onpushstate = function(e) { 
    $("$watchLog").hide();
    stopSearch();
}
**/


function addSearchDom() {
    if ($("#searchLi").get(0)) {
        return;
    }
    var $liAdd = $("<li id='searchLi'><input id='searchContent'/><button id='search'><i class='iconfont' >&#xe631;</i></button>\
        <button id='stopSearch'> 停止</button></li>");
    var $ul = $(".head-list");
    $ul.append($liAdd);
    //$liAdd[0].style.setProperty('display', 'flex', 'important');
    $liAdd[0].style.cssText = "    display:flex;/*Flex布局*/\
    display: -webkit-flex; /* Safari */\
    align-items:center;/*指定垂直居中*/\
    ";

    $("#searchContent")[0].style.cssText = "    width: 100px;\
    display: block !important;\
    border-radius: 20px;\
    text-align: center;\
    font-size: 13px;\
    ";

    $("#search")[0].style.cssText = "    margin-left: 10px;\
    display: block !important;\
    padding: 2px;\
    font-size: 12px;\
    ";


    $("#stopSearch")[0].style.cssText = " margin-left: 20px;\
    padding: 2px;\
    background: #ff8247;\
    color: white;\
    border-radius: 2px;\
    border: 1px solid #ff8247;\
    font-size: 12px;";
    $("#searchContent").keydown(function(e) {
        if (e.keyCode == 13) {
            search();
        }
    })
    $("#stopSearch").hide();
    $("#search").on("click", function() {
        search();
    });
    $("#stopSearch").on("click", function() {
        stopSearch();
    });
    var log = "<div style='display:none' id='searchLog'>\
    <span id='status'>搜索中...</span>\
    匹配<span id='matched'>0</span>项\
    <em style='color:grey'>&nbsp;&nbsp;&nbsp;by 币乎增强插件</em>\
    </div>";
    //$(".alt-list").prepend(log);
    $(".head-box").append(log);
    //log[0].style.setProperty('display','flex','important');
    $("#searchLog")[0].style.cssText = "\
    color: blue;\
    font-size: 12 px;\
    padding: 2 px;\
    background: white;\
    margin-bottom: 5 px;\
    text-align: center;\
    display: none;\
    ";
    $("#matched")[0].style.cssText = "\
      font-weight: bold;\
    color: green;\
    margin-left: 2px;\
    margin-right: 2px;\
    font-size: 16px ;\
    ";

    $("ul.head-list a").each(function() {
        $(this).click(function() {
            $("#searchLog").hide();
            stopSearch();
        })
    });
}

function search() {
    loadCount = 0;
    console.log('enter search');
    clearHighLight();
    $("#status").text("搜索中...");
    $("matched").text('0');
    $("#search").hide();
    $("#searchLog").show();
    $("#stopSearch").show();
    searchContent = $("#searchContent").val();
    startSearch();
}

function startSearch() {
    console.log('enter startSearch');
    var url = window.location.href;
    var flag = url.substr(url.length - 1, 1);
    var flag = url.replace(/.*index=/, '');
    var theFuc;
    if (flag == 1) { //文章搜索
        theFuc = showArticleSearch;
    } else if (flag == 2) {
        theFuc = showAttentionSearch;
    } else if (flag == 3) {
        theFuc = showFanSearch;
    } else {
        theFuc = showArticleSearch;
    }
    theFuc();
    if (searchContent) {
        loopId = setInterval(showMoreSearch, 1500, theFuc);
    } else {
        stopSearch();
    }
}

function showMoreSearch(theMethod) {
    loadCount += 1;

    theMethod();
    if (loadCount >= 5) {
        stopSearch();
        alert('每次最多请求5页，可点击搜索按钮搜索下5页！');
    } else {
        var btns = document.getElementsByClassName("LoaderButton load");
        if (btns.length > 0) {
            btns[0].click();
        } else {
            stopSearch();
        }
    }
}

function showArticleSearch() {
    console.log('enter showArticleSearch');
    $('.content-public.title').each(function() {
        var text = $(this).text().toLowerCase();
        if (text.indexOf(searchContent.toLowerCase()) == -1) {
            $(this).parent().parent().parent().hide();

        } else {
            $(this).parent().parent().parent().show();
            $(this).html($(this).html().replace(searchContent, "<span style='background:yellow'>" + searchContent + "</span>"));
        }
        $("#matched").text($('.content-public.title:visible').length);
    });
}

function showAttentionSearch() {
    $('.attention-item-info').each(function() {
        var text = $(this).find("p").eq(0).text().toLowerCase();
        if (text.indexOf(searchContent.toLowerCase()) == -1) {
            $(this).parent().hide();
        } else {
            $(this).parent().show();
            $(this).html($(this).html().replace(searchContent, "<span style='background:yellow'>" + searchContent + "</span>"));
        }
        $("#matched").text($('.attention-item:visible').length);
    });
}


function showFanSearch() {
    $('.attention-item-info').each(function() {
        var text = $(this).find("p").eq(0).text().toLowerCase();
        if (text.indexOf(searchContent.toLowerCase()) == -1) {
            $(this).parent().hide();
        } else {
            $(this).parent().show();
            $(this).html($(this).html().replace(searchContent, "<span style='background:yellow'>" + searchContent + "</span>"));
        }
        $("#matched").text($('.attention-item:visible').length);
    });
}


function stopSearch() {
    clearInterval(loopId);
    $("#search").show();
    $("#stopSearch").hide();
    $("#status").text("搜索完成√");
    loopId = -1;
}

function clearHighLight() {
    $('.content-public.title').each(function() {
        $(this).html($(this).html().replace(/background:yellow/g, ''));
    });
}