let currentTab = 'article';
let articleList = [];
let userList = [];
let draftList = [];
let taskList = [];
let bigVList = [];
let config = null;



document.addEventListener('DOMContentLoaded', function() {

    // 添加列表元素
    //chrome.runtime.sendMessage({method: "getFavUsers"}, function(response) {
    //});

    // 处理所有的链接，使其可打开
    document.getElementById('favArtListBtn').onclick = getArtList;
    document.getElementById('favUserListBtn').onclick = getUserList;
    document.getElementById('draftsListBtn').onclick = getDraftsList;
    document.getElementById('tasksListBtn').onclick = getTasksList;
    document.getElementById('bigVListBtn').onclick = getBigVsList;
    document.getElementById('addBigVBtn').onclick = addBigV;
    document.getElementById('showFormBtn').onclick = function() {
        if ($("#theForm").is(':visible')) {
            $("#theForm").hide();
        } else {
            $("#theForm").show();

        }
    };
    $("#theForm").hide();


    document.getElementById('bigVName').onkeydown = checkInfo;
    document.getElementById('bigVId').onkeydown = checkInfo;
    document.getElementById('bigVHour').onkeydown = checkInfo;
    document.getElementById('bigVMinute').onkeydown = checkInfo;
    chrome.runtime.sendMessage({
        'method': 'getConfig'
    }, function(response) {
        if (response.success) {
            config = response.config;


            //获取列表
            chrome.storage.local.get(['ctab'], function(result) {
                if (result.ctab == 'users') {
                    getUserList();
                } else if (result.ctab == 'drafts') {
                    getDraftsList();
                } else if (result.ctab == 'tasks') {
                    getTasksList();
                } else if (result.ctab == 'bigVs') {
                    getBigVsList();
                } else {
                    getArtList();
                }
            });

            document.getElementById('policyBtn').onclick = showPolicy;
            //document.getElementById('policyBtn').onclick = function(){console.log('x');};
        }
    });

    $.getJSON("manifest.json", "", function(data) {　 //each循环 使用$.each方法遍历返回的数据date
        $("#version").text('V' + data.version);
        $.get('http://123.206.196.207/timeBase/getCurVersion/', '', function(res) {
            console.log(res.version);
            console.log(data.version);
            if (data.version != res.version) {
                $("#versionAlert").html('<a style="color:red;font-size:12px" href="https://bihu.com/article/330792" target="__blank">有新版</a>');
            }
        });
    });



    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-118826522-1']);
    _gaq.push(['_trackPageview']);

    (function() {
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        //ga.src = 'https://ssl.google-analytics.com/ga.js';
        ga.src = 'lib/ga.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
    })();

});

function checkInfo(evt) {
    evt = evt || window.event;
    if (evt.keyCode == 13) {
        addBigV();
    }
}

function addBigV() {
    var bigVName = document.getElementById('bigVName').value.replace(/\s/g, '');
    var bigVId = document.getElementById('bigVId').value;
    var bigVHour = document.getElementById('bigVHour').value;
    var bigVMinute = document.getElementById('bigVMinute').value;
    if (!bigVName) {
        alert('请输入大V名字');
        return;
    }
    if (!/^\d+$/.test(bigVId)) {
        alert('大V的币乎ID输入错误');
        return;
    }
    if (!/^\d+$/.test(bigVHour) || parseInt(bigVHour) > 24) {
        alert('时间小时输入错误');
        return;
    }
    if (!/^\d+$/.test(bigVMinute) || parseInt(bigVMinute) > 60) {
        alert('时间分钟输入错误');
        return;
    }
    if (parseInt(bigVHour) * 60 + parseInt(bigVMinute) > 24 * 60) {
        alert('时间输入错误');
        return;
    }
    bigVHour = '0' + bigVHour;
    bigVHour = bigVHour.slice(bigVHour.length - 2);
    bigVMinute = '0' + bigVMinute;
    bigVMinute = bigVMinute.slice(bigVMinute.length - 2);

    publishWeekday = $("#weekDayOption").val();
    if (!publishWeekday) {
        alert('请选择发文日');
        return;
    }

    var bigV = {
        bigVName,
        bigVId,
        bigVHour,
        bigVMinute,
        publishWeekday
    };
    chrome.runtime.sendMessage({
        method: "addBigV",
        data: bigV
    }, function(response) {
        if (response.success) {
            //console.log(response);
            document.getElementById("bigVLog").innerText = '添加成功!';
            setTimeout(function() {
                document.getElementById("bigVLog").innerText = '';
            }, 2000);
        }
        getBigVsList();
    });

}

function showPolicy() {
    console.log('xxxyyyy');
    var policyDom = document.getElementById('policy')
    if (policyDom.style.display == 'none') {
        policyDom.style.display = 'block';
    } else {
        policyDom.style.display = 'none';
    }
}

function activeTab(domName) {
    var domList = ['favArtListBtn', 'favUserListBtn', 'draftsListBtn', 'tasksListBtn', 'bigVListBtn'];
    for (var i in domList) {
        if (domList[i] == domName) {
            document.getElementById(domList[i]).className = "tabActive tab";
        } else {
            document.getElementById(domList[i]).className = " tab";
        }
    }
}

function showContent(domName) {
    var domList = ['content-article', 'content-user', 'content-draft', 'content-task', 'content-bigV', 'noResult'];
    for (var i in domList) {
        if (domList[i] == domName) {
            document.getElementById(domList[i]).style.display = "";
        } else {
            document.getElementById(domList[i]).style.display = "none";
        }
    }
}

function sortBigVByTime(a, b) {
    if ((!a.fromServer) && b.fromServer) {
        return -1;
    }
    if (a.fromServer && (!b.fromServer)) {
        return 1;
    }
    if ((parseInt(a.bigVHour) * 60 + parseInt(a.bigVMinute)) > (parseInt(b.bigVHour) * 60 + parseInt(b.bigVMinute))) {
        return 1;
    } else {
        return -1;
    }
}

function renderBigVs(response) {

    if (!response.success) {
        return;
    }
    response = response.bigVs;
    response.sort(sortBigVByTime);
    let itemAreaDom = document.getElementById('itemArea-bigV');
    if (JSON.stringify(response) == "{}" || JSON.stringify(response) == "[]" || (!response)) {} else {
        showContent("content-bigV");
        itemAreaDom.innerHTML = '';
        bigVList = response;
        var fromServerSign = false;
        var tmpHeader = document.createElement('div');
        tmpHeader.innerHTML = `本地数据`;
        tmpHeader.style.setProperty('font-weight', 'bold');
        tmpHeader.style.setProperty('background', '#eefd7c');
        if (response.length > 0 && (!response[0].fromServer)) {
            itemAreaDom.appendChild(tmpHeader);
        }

        for (let i in response) {


            var bHour = response[i].bigVHour;
            var bMinute = response[i].bigVMinute;
            if (config.bigVTimeDiff) {
                var btd = parseInt(config.bigVTimeDiffMinutes);
                var tmpNow = new Date();
                tmpNow.setHours(bHour);
                tmpNow.setMinutes(bMinute);

                tmpNow = new Date(tmpNow.getTime() + btd * 60 * 1000);
                bHour = tmpNow.getHours();
                bMinute = tmpNow.getMinutes();
            }
            //console.log(response[i].bigVHour + '-' + response[i].bigVMinute);
            //console.log(bHour + '-' + bMinute);
            if (response[i].fromServer && (!fromServerSign)) {
                tmpHeader = document.createElement('div');
                tmpHeader.innerHTML = `联网数据&nbsp;&nbsp;<span id="refreshBtn" style='color:blue;cursor:pointer;padding:0px;width:40px;font-size:12px;'>刷新</span>`;
                tmpHeader.style.setProperty('font-weight', 'bold');
                tmpHeader.style.setProperty('background', '#eefd7c');
                itemAreaDom.appendChild(tmpHeader);
                fromServerSign = true;
            }
            var publishWeekdayStr = '';
            if (response[i].publishWeekday) {
                switch ('' + response[i].publishWeekday) {
                    case '1':
                        publishWeekdayStr = '周一'
                        break;
                    case '2':
                        publishWeekdayStr = '周二'
                        break;
                    case '3':
                        publishWeekdayStr = '周三'
                        break;
                    case '4':
                        publishWeekdayStr = '周四'
                        break;
                    case '5':
                        publishWeekdayStr = '周五'
                        break;
                    case '6':
                        publishWeekdayStr = '周六'
                        break;
                    case '7':
                        publishWeekdayStr = '周日'
                        break;
                    case '-1':
                        publishWeekdayStr = '每天'
                        break;
                }

            } else {
                publishWeekdayStr = '每天';
            }
            console.log(response[i].publishWeekday);
            console.log(publishWeekdayStr);

            var now = new Date();
            if (now.getHours() * 60 + now.getMinutes() <= (parseInt(bHour) * 60 + parseInt(bMinute))) {
                response[i].background = '#bdffbd';
            }

            let tmpDom = document.createElement('div');
            tmpDom.setAttribute('class', 'favItem');
            tmpDom.style.setProperty('background', response[i].background);
            tmpDom.innerHTML = `<div style='width:20px' > ${i}.&nbsp;</div>\
                <div class='itemCell ' title='发文时间' style='width:60px;margin-left:20px;' >${response[i].bigVHour}:${response[i].bigVMinute}</div>\
                <div class='itemCell ' title='发文日' style='width:60px;margin-left:20px;' >${publishWeekdayStr}</div>\
                <div class='itemCell' title='大V链接' ><a href="https://bihu.com/people/${response[i].bigVId}">${response[i].bigVName}(id：${response[i].bigVId})</a></div>\
                <div class='itemCell itemHref' style="border-bottom:1px dashed #cccccc;overflow:hidden"></div>\
                <i title="删除" id="item${response[i].id}" class="iconfont icon-close"></i></div>`;
            itemAreaDom.appendChild(tmpDom);
        }
        let items = document.getElementsByClassName("iconfont icon-close");
        for (let i in items) {
            items[i].onclick = delItemBigV;
        }
        document.getElementById("bigVName").focus();

        $("#refreshBtn").click(function() {

            let itemAreaDom = document.getElementById('itemArea-bigV');
            itemAreaDom.innerHTML = '';

            chrome.runtime.sendMessage({
                method: "refreshBigVs"
            }, function(resp) {
                if (resp.success) {

                    renderBigVs(resp);
                    addHref();
                }
            })
        });

    }
}

function getBigVsList() {
    chrome.storage.local.set({
        ctab: 'bigVs'
    }, function() {});
    activeTab('bigVListBtn');
    showContent('content-bigV');

    chrome.runtime.sendMessage({
        method: "getBigVs"
    }, function(response) {
        renderBigVs(response);
        addHref();

    });
}

/**
function refreshBigVs(vlist) {
    chrome.runtime.sendMessage({
        method: "refreshBigVs"
    }, function(response) {
        //console.log(response);
        if (!response.success) {
            console.log('error');
            return;
        }
    });
}
*/

function delItemBigV(e) {
    console.log('delBigV');
    chrome.runtime.sendMessage({
        method: "delBigV",
        id: e.target.id.replace('item', '')
    }, function(response) {
        //console.log(response);
        if (!response.success) {
            console.log('error');
            return;
        }
        console.log('delItem');
        console.log(e.target.id);
        let theItem = document.getElementById(e.target.id).parentNode;
        theItem.parentNode.removeChild(theItem);
        document.getElementById("bigVLog").innerText = '删除成功！';
        setTimeout(function() {
            document.getElementById("bigVLog").innerText = '';
        }, 2000);
    });

}

function getTasksList() {
    chrome.storage.local.set({
        ctab: 'tasks'
    }, function() {});
    activeTab('tasksListBtn');
    showContent('content-task');
    if (taskList && taskList.length > 0) {
        return;
    }
    chrome.runtime.sendMessage({
        method: "getTasks"
    }, function(response) {
        console.log(response);
        if (!response.success) {
            return;
        }
        response = response.tasks;
        let itemAreaDom = document.getElementById('itemArea-task');
        if (JSON.stringify(response) == "{}" || JSON.stringify(response) == "[]" || (!response)) {
            showContent("noResult");
        } else {
            showContent("content-task");
            taskList = response;
            console.log(taskList);
            for (let i in response) {
                let tmpDom = document.createElement('div');
                tmpDom.setAttribute('class', 'favItem');
                tmpDom.innerHTML = `<div class='itemCell'> ${i}.&nbsp;</div>\
                <div class='itemCell itemHref' title=${response[i].title} ><a href="https://bihu.com/edit?taskId=${response[i].id}">${response[i].title.slice(0,30)}&nbsp;</a></div>\
                <div class='itemCell' title=${response[i].time} >${response[i].time.substr(5).replace('T','~')}</div>\
                <div class="itemCell ${response[i].status=='inQueue'?'greenCell':''}" title=${response[i].time} >${response[i].status=='inQueue'?'有效' : response[i].status=='processing'?'处理中':'已完成'}</div>\
                <i title="删除" id="item${response[i].id}" class="iconfont icon-close"></i></div>`;
                itemAreaDom.appendChild(tmpDom);
            }
            let items = document.getElementsByClassName("iconfont icon-close");
            for (let i in items) {
                items[i].onclick = delItemTask;
            }
        }
        addHref();
    });

}

function getDraftsList() {
    chrome.storage.local.set({
        ctab: 'drafts'
    }, function() {});

    activeTab('draftsListBtn');
    showContent('content-draft');

    if (draftList.length > 0) {
        return;
    }

    chrome.runtime.sendMessage({
        method: "getDrafts",
        auto: true
    }, function(response1) {
        console.log(response1);
        if (!response1.success) {
            return;
        }
        if (!response1.result) {
            response1.result = [];
        }
        chrome.runtime.sendMessage({
            method: "getDrafts",
            auto: false
        }, function(response2) {
            console.log(response2);
            if (!response2.success) {
                return;
            }
            if (!response2.result) {
                response2.result = [];
            }
            response = response1.result.concat(response2.result);
            let itemAreaDom = document.getElementById('itemArea-draft');
            if (JSON.stringify(response) == "{}" || JSON.stringify(response) == "[]" || (!response)) {
                showContent("noResult");
            } else {
                showContent("content-draft");
                draftList = response;
                for (let i in response) {
                    let tmpDom = document.createElement('div');
                    let autoSign = '';
                    if (response[i].auto) {
                        autoSign = '[自动]';
                    }
                    tmpDom.setAttribute('class', 'favItem');
                    tmpDom.innerHTML = `<div class='itemCell itemNo'> ${i}.&nbsp;</div>\
                <div>${autoSign}</div>\
                <div class='itemCell itemHref' title=${response[i].title} ><a href='https://bihu.com/edit?draftId=${response[i].id}'>${response[i].title.slice(0,10)}&nbsp;</a></div>\
                <div class='itemCell '  title='字数：${response[i].words}' >${response[i].words}字&nbsp;</div>\
                <div class='itemCell '  title='图片数：${response[i].pics}' >${response[i].pics}图&nbsp;</div>\
                <div class='itemCell '  title='时间：${response[i].timeStr}'>${response[i].timeStr}</div>\
                <i title="删除" id="${response[i].id}" class="iconfont icon-close"></i></div>`;
                    itemAreaDom.appendChild(tmpDom);
                }
                let items = document.getElementsByClassName("iconfont icon-close");
                for (let i in items) {
                    items[i].onclick = delItemDraft;
                }
                addHref();
            }
        })
    })
}

function getUserList() {

    activeTab("favUserListBtn");
    showContent("content-user");

    chrome.storage.local.set({
        ctab: 'users'
    }, function() {});
    if (userList.length > 0) {
        return;
    }
    chrome.runtime.sendMessage({
        method: "getFavUsers"
    }, function(response) {
        //console.log(response);
        if (!response.success) {
            //console.log('error');
            return;
        }
        response = response.result;
        let itemAreaDom = document.getElementById('itemArea-user');
        if (JSON.stringify(response) == "{}" || JSON.stringify(response) == "[]" || (!response)) {
            showContent("noResult");
        } else {
            showContent("content-user");

            userList = response;
            for (let i in response) {

                let tmpDom = document.createElement('div');
                tmpDom.setAttribute('class', 'favItem');
                tmpDom.innerHTML = `<div class='itemCell'> ${i}.&nbsp;</div>\
                <div class='itemCell'title=${response[i].name} ><a href=${response[i].url}>${response[i].name.slice(0,5)}&nbsp;</a></div>\
                <div class='itemCell itemHref'  title=${response[i].words} >${response[i].words}&nbsp;</div>\
                <i title="删除" id="item${response[i].id}" class="iconfont icon-close"></i></div>`;
                itemAreaDom.appendChild(tmpDom);
            }
            let items = document.getElementsByClassName("iconfont icon-close");
            for (let i in items) {
                items[i].onclick = delItemUser;
            }
        }
        addHref();
    });

}

function delItemTask(e) {
    console.log('delTask');
    chrome.runtime.sendMessage({
        method: "delTask",
        id: e.target.id.replace('item', '')
    }, function(response) {
        //console.log(response);
        if (!response.success) {
            console.log('error');
            return;
        }
        console.log('delItem');
        console.log(e.target.id);
        let theItem = document.getElementById(e.target.id).parentNode;
        theItem.parentNode.removeChild(theItem);
    });

}

function getArtList() {
    chrome.storage.local.set({
        ctab: 'articles'
    }, function() {});
    activeTab("favArtListBtn");
    showContent("content-article");

    if (articleList.length > 0) {
        document.getElementById('noResult').style.display = "none";
        return;
    }
    chrome.runtime.sendMessage({
        method: "getFavArticles"
    }, function(response) {
        console.log('in popup.js');
        if (!response.success) {
            console.log('error');
            return;
        }
        response = response.result;
        let itemAreaDom = document.getElementById('itemArea-article');
        if (JSON.stringify(response) == "{}" || JSON.stringify(response) == "[]" || (!response)) {
            showContent("noResult");
        } else {
            showContent("content-article");
            articleList = response;
            for (let i in response) {
                let tmpDom = document.createElement('div');
                tmpDom.setAttribute('class', 'favItem');
                tmpDom.innerHTML = `<div class='itemCell'> ${i}.&nbsp;</div>\
                <div class='itemCell'title=${response[i].author.slice(0,5)} >${response[i].author.slice(0,5)}&nbsp;</div>\
                <div class='itemCell itemHref'> <a href=${response[i].url} title=${response[i].title}>${response[i].title}&nbsp;</a></div>  \
                <div class='itemCell'>  <i title="删除" id="item${response[i].id}" class="iconfont icon-close"></i></div>`;
                itemAreaDom.appendChild(tmpDom);
            }
            let items = document.getElementsByClassName("iconfont icon-close");
            for (let i in items) {
                items[i].onclick = delItemArticle;
            }
        }
        addHref();
    });
}

function delItemUser(e) {
    //console.log(e.target.id);
    chrome.runtime.sendMessage({
        method: "delFavUser",
        userId: e.target.id.replace('item', '')
    }, function(response) {
        //console.log(response);
        if (!response.success) {
            console.log('error');
            return;
        }
        console.log('delItem');
        console.log(e.target.id);
        let theItem = document.getElementById(e.target.id).parentNode;
        console.log(theItem);
        console.log(theItem.parentNode);
        theItem.parentNode.removeChild(theItem);
        console.log(theItem.parentNode);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                method: "needRefresh",
                userId: e.target.id.replace('item', '')
            }, function(response) {});
        });

    });
}

function delItemArticle(e) {
    //console.log(e.target.id);
    chrome.runtime.sendMessage({
        method: "delFavArticle",
        articleId: e.target.id.replace('item', '')
    }, function(response) {
        //console.log(response);
        if (!response.success) {
            console.log('error');
            return;
        }
        let theItem = document.getElementById(e.target.id).parentNode.parentNode;
        //console.log(theItem);
        //console.log(theItem.parentNode);
        theItem.parentNode.removeChild(theItem);
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                method: "needRefresh",
                articleId: e.target.id.replace('item', '')
            }, function(response) {});
        });

    });
}

function delItemDraft(e) {
    chrome.runtime.sendMessage({
        method: "delDraft",
        id: e.target.id
    }, function(response) {
        //console.log(response);
        if (!response.success) {
            console.log('error');
            return;
        }
        let theItem = document.getElementById(e.target.id).parentNode;
        theItem.parentNode.removeChild(theItem);
    });
}

function addHref() {
    var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        (function() {
            var ln = links[i];
            var location = ln.href;
            ln.onclick = function() {
                chrome.tabs.create({
                    active: true,
                    url: location
                });
            };
        })();
    }
}

function test() {
    console.log('x');
}