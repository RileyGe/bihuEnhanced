var articleInfo;
var config;

function getArticleDom() {
    console.log('try to get the article dom');
    try {
        let user = document.getElementsByClassName('row article-user')[0];
        if (user) {
            console.log('got!');
            getArticleInfo();
        } else {
            setTimeout(getArticleDom, 1000);
        }
    } catch (e) {
        //setTimeout(getArticleDom,1000);
        console.log(e);

    }
}

function getArticleInfo() {
    let title;
    try {
        title = document.getElementsByClassName('row article-title')[0].firstElementChild.innerText;
    } catch (err) {
        title = '无题';
    }
    let author = document.getElementsByClassName('row article-user')[0].children[1].children[0].children[0].innerText;
    let time = document.getElementsByClassName('row article-user')[0].children[1].children[1].innerText;
    let url = window.location.href;
    let id = window.location.href.replace(/^\D+/g, '');
    let mobileUrl = url.replace('bihu', 'm.bihu');
    let abstract = document.getElementsByClassName('row article-content')[0].firstElementChild.innerText.replace(/[\r\n]/g, '');
    abstract = abstract.substr(0, 50) + '...';
    articleInfo = {
        title,
        author,
        time,
        url,
        id
    }
    let result = '作者：' + author + '\n' + '文章名：' + title + '\n' + '发表时间：' + time + '\n' + '电脑链接：' + url + '\n' +
        '手机链接：' + mobileUrl + '\n' + '摘要：' + abstract + '\n';
    //document.getElementById('articleInfo').value = result;
    if (config.shareAbstract) {
        addInfoDom(result);
    }
    if (config.addFav) {
        addFavDom();
    }

}

function updateFav() {
    //console.log(articleInfo);
    let favDom = document.getElementsByClassName('favIcon')[0];
    chrome.runtime.sendMessage({
        method: "checkFavArticle",
        articleId: articleInfo.id
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
    let articleParent = document.getElementsByClassName('article-con')[0];
    let titleDom = document.getElementsByClassName('article-title')[0];
    titleDom.style.setProperty('width', '90%', 'important');
    let favDom = document.createElement('div');
    favDom.setAttribute('class', 'favIcon');
    Object.assign(favDom.style, {
        'position': 'absolute',
        'right': '30px',
        'text-align': 'center',
        'cursor': 'pointer',
        'display': 'block !important'

    })
    favDom.setAttribute('id', 'articleFavIcon');
    favDom.innerHTML = '<div><i class="iconfont" style="font-size:40px;" title="收藏到币乎增强插件">&#xe60d;</i></div><div><span class="selfNote theFavNote">未收藏</span></div>';
    favDom.style.setProperty('display', 'block', 'important');
    if (!titleDom) {
        let userDom = document.getElementsByClassName('article-user')[0];
        let tmpTitle = document.createElement('div');
        tmpTitle.innerHTML = "<div style='height:40px'></div>"
        tmpTitle.style.setProperty('display', 'block', 'important');
        articleParent.insertBefore(favDom, userDom);

        articleParent.insertBefore(tmpTitle, userDom);

    } else {
        articleParent.insertBefore(favDom, titleDom);
    }
    favDom.onclick = clickFav;
    updateFav();
}

function clickFav() {
    //console.log('click fav button');
    chrome.runtime.sendMessage({
        method: "checkFavArticle",
        articleId: articleInfo.id
    }, function(response) {
        //console.log(articleInfo);
        if (response.success) {
            chrome.runtime.sendMessage({
                method: 'delFavArticle',
                articleId: articleInfo.id
            }, function(response) {
                if (response.success) {
                    updateFav();
                }
            })
        } else {
            chrome.runtime.sendMessage({
                method: 'addFavArticle',
                data: articleInfo
            }, function(response) {
                if (response.success) {
                    updateFav();
                }
            })
        }
    });
}


function addInfoDom(result) {
    //console.log(result);
    let articleParent = document.getElementsByClassName('article-con')[0];
    let articleDom = document.getElementsByClassName('article-content')[0];
    let infoDom = document.createElement('div');
    //infoDom.setAttribute('class','infoArea')
    //infoDom.innerHTML = "<div class='infoPanel' id='infoContent'>"+result.replace(/\n/g,'<br>')+"</div> \
    infoDom.innerHTML = "<div style='border-radius: 2px;border: 1px solid #007bff;font-size: 12px;padding: 10px;' id='infoContent'>" + result.replace(/\n/g, '<br>') + "</div> \
    <div style='font-size: 12px;color: #c1c1c1; text-align: right;'>分享摘要By币乎增强插件</div>";
    articleParent.insertBefore(infoDom, articleDom);
    infoDom.style.setProperty('display', 'block', 'important');
    //document.getElementById('infoContent').innerText = result;
    //set css
    //infoArea
    $(infoDom).css({
        'margin-bottom': '40px'
    })

}

/* 
 * 根据当前页面于滚动条的位置，设置提示对话框的TOP和left 
 * add by rileyge
 */
function showDialog() {
    var objw = $(window); //获取当前窗口 
    var objc = $(".dialog"); //获取当前对话框 
    var brsw = objw.width(); //获取页面宽度 
    var brsh = objw.height(); //获取页面高度 
    var sclL = objw.scrollLeft(); //获取页面左滑动条信息 
    var sclT = objw.scrollTop();
    var curw = objc.width(); //获取对话框宽度 
    var curh = objc.height(); //获取对话框高度 

    var left = sclL + (brsw - curw) / 2; //计算对话框居中时的左边距 
    var top = sclT + (brsh - curh) / 2; //计算对话框居中时的上边距      

    objc.css({ "left": left, "top": top }); //设置对话框居中    
}

//main 入口
if (/https:\/\/bihu.com\/article\//.test(window.location.href)) {
    //console.log('enter content-shareInfo.js');
    //if(!articleInfo){
    chrome.runtime.sendMessage({
        'method': 'getConfig'
    }, function(response) {
        if (response.success) {
            config = response.config;
            if (!document.getElementById('articleFavIcon')) {
                getArticleDom();
                chrome.runtime.onMessage.addListener(
                    function(request, sender, sendResponse) {
                        if (request.method == "needRefresh") {
                            if (request.articleId == articleInfo.id) {
                                location.reload();
                            }
                        }
                    });

            }
        }
    });

    var btnLoaded = false;
    var tryCount = 0;
    var clks = setInterval(function() {
        btn = $("button.LoaderButton.load");
        if (btn.length < 1) {
            tryCount++;
        } else {
            btnLoaded = true;
        }

        if ((btnLoaded === false) && (tryCount < 6))
            return;

        if (!btn.is(':visible')) {
            clearInterval(clks);

            $("div.comment-title").append('<span id="set-bwlist" style="margin-left: 30px;color: #007bff;cursor: pointer;">黑白名单设置</span>');
            $("body").append('<div class="mask"></div>\
            <div class="dialog">\
                <div class="title">\
                    <img alt="点击可以关闭" src="https://bihu2001.oss-cn-shanghai.aliyuncs.com/img/218c2ddcc07e29bab659253ac5eb575b.png?x-oss-process=style/size_lg" width="20px" height="20px;">\
                    管理黑&白名单\
                </div>\
                <div class="content">\
                </div>\
                <div class="bottom">\
                    <input style="margin: 10px; margin-right: 40px;" type="button" id="bwlist-ok" value="确定" class="btn">\
                </div>\
            </div>');
            //$(document).ready(function(){
            $("#set-bwlist").click(function() {
                //设置 div 元素的不透明级别：透明度取值(取值范围[0.0,1.0]) 
                $(".mask").css("opacity", "0.3").css("position", "fixed").show();
                
                var bwlist =  $.parseJSON(localStorage.getItem(key + "_bwlist"));
                var count = 0;
                $("div.content").empty();

                if (bwlist !== null) {
                    for (var item in bwlist["blist"]) {
                        count++;
                        $("div.content").append(
                                '<p><span style="display: inline-block;padding: 0px;float: none;width: 115px;overflow: hidden;">'
                                + bwlist["blist"][item] + 
                                '</span><span style="float:none;color: #bcc7d7;font-size: 12px;margin-left: 2px;margin-right: 2px">\
                                <input checked=true style="margin-right:2px" type="checkbox" class=nblist>黑名单</span>\
                                <span style="float:none;color: #bcc7d7;font-size: 12px;margin-left: 2px;margin-right: 2px">\
                                <input style="margin-right:2px" type="checkbox" class=nwlist>白名单</span></p>');
                    }

                    for (var item in bwlist["wlist"]) {
                        count++;
                        $("div.content").append(
                                '<p><span style="display: inline-block;padding: 0px;float: none;width: 115px;overflow: hidden;">'
                                + bwlist["wlist"][item] + 
                                '</span><span style="float:none;color: #bcc7d7;font-size: 12px;margin-left: 2px;margin-right: 2px">\
                                <input style="margin-right:2px" type="checkbox" class=nblist>黑名单</span>\
                                <span style="float:none;color: #bcc7d7;font-size: 12px;margin-left: 2px;margin-right: 2px">\
                                <input checked=true style="margin-right:2px" type="checkbox" class=nwlist>白名单</span></p>');
                    }

                    $("input.nblist").click(function() {
                        if($(this)[0].checked == true)
                        {
                            $(this)[0].parentNode.parentNode.childNodes[3].childNodes[1].checked = false;
                        }
                    });
                    $("input.nwlist").click(function() {
                        if($(this)[0].checked == true)
                        {
                            $(this)[0].parentNode.parentNode.childNodes[1].childNodes[1].checked = false;
                        }
                    });
                }
                //制作对话框 
                showDialog();
                //展现css的特效 
                $(".dialog").show();
            });

            //当页面窗口大小改变时触发的事件 
            $(window).resize(function() {
                if (!$(".dialog").is(":visible")) {
                    return;
                }
                showDialog();
            });

            //注册关闭图片单击事件 
            $(".title img").click(function() {
                //隐藏效果 
                $(".dialog").hide();
                $(".mask").hide();
            });

            //确定按钮事假 
            $("#bwlist-ok").click(function() {
                $(".dialog").hide();
                $(".mask").hide();
                var nodes = $("div.content")[0];
                var nbwlist = $.parseJSON("{\"blist\":[], \"wlist\":[]}");
                for (var item = 0; item < nodes.childNodes.length; item++) {
                    var node = nodes.childNodes[item];
                    var un = node.childNodes[0].innerText;
                    if(node.childNodes[1].childNodes[1].checked)
                    {
                        nbwlist["blist"].push(un);

                    }else if(node.childNodes[3].childNodes[1].checked)
                    {
                        nbwlist["wlist"].push(un);
                    }                    
                }

                var auth = $.parseJSON(localStorage.getItem("ANDUI_BIHU_LOGININFO"));
                var key = auth.userId;
                localStorage.setItem(key + "_bwlist", JSON.stringify(nbwlist));
            });
            

            var comments = $("div.row.comment-info");

            var auth = $.parseJSON(localStorage.getItem("ANDUI_BIHU_LOGININFO"));
            var key = auth.userId;
            var bwlist = null;
            if (localStorage.getItem(key + "_bwlist") != null) {
                bwlist = $.parseJSON(localStorage.getItem(key + "_bwlist"));
            }
            //allitems += comments.length;
            comments.each(function() {
                //var innerText = $(this).find("p.first-comment-content").text().length;
                var userName = this.children[0].children[1].children[0].text + "";

                //如果在黑名单里面，直接删除
                if (bwlist !== null) {
                    for (var item in bwlist["blist"]) {
                        if (bwlist["blist"][item] == userName) //注意：此处的item不是数组项，而是数组项的索引
                        {
                            $(this).remove();
                            return;
                        }
                    }

                    for (var item in bwlist["wlist"]) {
                        if (bwlist["wlist"][item] == userName) //注意：此处的item不是数组项，而是数组项的索引
                        {
                            $(this.children[0].children[1].children[1]).after('<span style="color: #bcc7d7;font-size: 12px;margin-left: 2px;margin-right: 2px"><input style="margin-right:2px" type="checkbox" class=blist>黑名单</span><span style="color: #bcc7d7;font-size: 12px;margin-left: 2px;margin-right: 2px"><input checked=true style="margin-right:2px" type="checkbox" class=wlist>白名单</span>');
                            return;
                        }
                    }
                }

                if ($(this).find("p.first-comment-content").text().length < 5)
                    $(this).remove();
                else {
                    $(this.children[0].children[1].children[1]).after('<span style="color: #bcc7d7;font-size: 12px;margin-left: 2px;margin-right: 2px"><input style="margin-right:2px" type="checkbox" class=blist>黑名单</span><span style="color: #bcc7d7;font-size: 12px;margin-left: 2px;margin-right: 2px"><input style="margin-right:2px" type="checkbox" class=wlist>白名单</span>');
                }
            });
            $("input.blist").click(function() {
                var auth = $.parseJSON(localStorage.getItem("ANDUI_BIHU_LOGININFO"));
                var key = auth.userId;
                var bwlist = null;
                if (localStorage.getItem(key + "_bwlist") == null) {
                    bwlist = $.parseJSON("{\"blist\":[], \"wlist\":[]}");
                } else {
                    bwlist = $.parseJSON(localStorage.getItem(key + "_bwlist"));
                }
                if (this.checked === true) {
                    var userName = this.parentNode.parentNode.childNodes[0].text;
                    for (var item in bwlist["blist"]) {
                        if (bwlist["blist"][item] == userName) //注意：此处的item不是数组项，而是数组项的索引
                        {
                            alert("用户\"" + userName + "\"已经在黑名单中！");
                            return;
                        }
                    }
                    bwlist["blist"].push(userName);
                    localStorage.setItem(key + "_bwlist", JSON.stringify(bwlist));
                    alert("已将用户\"" + userName + "\"增加到黑名单，下次将不会显示其评论！");
                } else {
                    var userName = this.parentNode.parentNode.childNodes[0].text;
                    for (var item in bwlist["blist"]) {
                        if (bwlist["blist"][item] == userName) //注意：此处的item不是数组项，而是数组项的索引
                        {
                            delete bwlist["blist"][item];
                        }
                    }
                    localStorage.setItem(key + "_bwlist", JSON.stringify(bwlist));
                    alert("已将用户\"" + userName + "\"从黑名单从删除！");
                }
            });
            $("input.wlist").click(function() {
                var auth = $.parseJSON(localStorage.getItem("ANDUI_BIHU_LOGININFO"));
                var key = auth.userId;
                var bwlist = null;
                if (localStorage.getItem(key + "_bwlist") == null) {
                    bwlist = $.parseJSON("{\"blist\":[], \"wlist\":[]}");
                } else {
                    bwlist = $.parseJSON(localStorage.getItem(key + "_bwlist"));
                }
                if (this.checked === true) {
                    var userName = this.parentNode.parentNode.childNodes[0].text;
                    for (var item in bwlist["wlist"]) {
                        if (bwlist["wlist"][item] == userName) //注意：此处的item不是数组项，而是数组项的索引
                        {
                            alert("用户\"" + userName + "\"已经在白名单中！");
                            return;
                        }
                    }
                    bwlist["wlist"].push(userName);
                    localStorage.setItem(key + "_bwlist", JSON.stringify(bwlist));
                    alert("已将用户\"" + userName + "\"增加到白名单！");
                } else {
                    var userName = this.parentNode.parentNode.childNodes[0].text;
                    for (var item in bwlist["wlist"]) {
                        if (bwlist["wlist"][item] == userName) //注意：此处的item不是数组项，而是数组项的索引
                        {
                            delete bwlist["wlist"][item];
                        }
                    }
                    localStorage.setItem(key + "_bwlist", JSON.stringify(bwlist));
                    alert("已将用户\"" + userName + "\"从白名单从删除！");
                }
            });
        } else {
            btn.click();
        }
    }, 1000);
    //});
}
