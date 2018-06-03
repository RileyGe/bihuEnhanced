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
    })

}