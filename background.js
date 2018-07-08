console.log('enter background.js');
//console.log('The color is green.');
String.prototype.getQueryString = function(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        var url = details.url;
        console.log("修改前的请求地址" + details.url);
        if (url.indexOf('https://api.geetest.com/') != -1) {
            if (url.indexOf('https://api.geetest.com/pageInfo') === 0) {
                //get browerinfo
                var browerinfo = url.getQueryString('data');
                console.log(browerinfo);
            }
            //return {redirectUrl: "https://google.com"};
            console.log("cancel: " + details.url);
            return { cancel: true };
        }
    }, { urls: ["<all_urls>"] }, ["blocking"]
    // {urls:["*://api.geetest.com/get*"]},  //监听页面请求,你也可以通过*来匹配。
    // ["blocking"] 
);
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.get('config', function(res) {
        if (!res.config) {
            console.log('init config');
            var config = {
                shareAbstract: true,
                reloadIndex: false,
                inpageSearch: true,
                addFav: true,
                autoPublish: true,
                editorEnhance: true,
                bigV: false,
                manualDraft: true,
                autoDraft: true,
                quickZan: false,
                autoZanAfterGetLatestArc: false,
                capBar: true,
                bigVTimeDiff: false,
                bigVTimeDiffMinutes: 0
            }
            chrome.storage.sync.set({
                config
            }, function() {});
        }
    })
    chrome.storage.sync.get('bigVs', function(res) {
        if (!res.bigVs) {
            console.log('init bigVs');
            /**
            var bigVs = [{
              bigVHour: "08",
              bigVId: "2234",
              bigVMinute: "00",
              bigVName: "南宫远",
              id: "bigV9154980-1525656271161"
            }, {
              bigVHour: "09",
              bigVId: "131507",
              bigVMinute: "45",
              bigVName: "圊呓语",
              id: "bigV8188420-1525656319589"

            }, {
              bigVHour: "22",
              bigVId: "692",
              bigVMinute: "00",
              bigVName: "区块佣兵",
              id: "bigV4215409-1525656897158"
            }, {
              bigVHour: "07",
              bigVId: "483",
              bigVMinute: "21",
              bigVName: "玩火的猴子",
              id: "bigV2148401-1525702811796"
            }, {
              bigVHour: "19",
              bigVId: "193849",
              bigVMinute: "15",
              bigVName: "区块链研究员",
              id: "bigV3217653-1525702860603"
            }, {
              bigVHour: "06",
              bigVId: "11880",
              bigVMinute: "30",
              bigVName: "湘乡的大树",
              id: "bigV7397220-1525702876499"
            }, {
              bigVHour: "11",
              bigVId: "9457",
              bigVMinute: "30",
              bigVName: "Bean",
              id: "bigV2719932-1525702897249"
            }, {
              bigVHour: "21",
              bigVId: "41279",
              bigVMinute: "21",
              bigVName: "钱串串",
              id: "bigV5567772-1525702920143"
            }, {
              bigVHour: "15",
              bigVId: "31673",
              bigVMinute: "00",
              bigVName: "孤独的异客",
              id: "bigV4420318-1525702969107"
            }, {
              bigVHour: "21",
              bigVId: "71115",
              bigVMinute: "09",
              bigVName: "天空之镜",
              id: "bigV8552996-1525702994240"
            }];
            */
            var bigVs = [];
            chrome.storage.sync.set({
                bigVs
            }, function() {});
        }

    });

})

chrome.alarms.create("autoTaskTimer", {
    when: Date.now() + 1000,
    periodInMinutes: 1
});

chrome.alarms.create("bigVTimer", {
    when: Date.now() + 31000,
    periodInMinutes: 1
});

chrome.alarms.create("refreshTimer", {
    when: Date.now() + 60 * 60 * 1000 + 10000,
    periodInMinutes: 120
});

chrome.alarms.create("refreshBigVs", {
    when: Date.now() + 60 * 60 * 1000 + 100000,
    //when: Date.now() +  1000,
    periodInMinutes: 180
});





//定时task的数据结构
//id: 1111,
//title: 'xxxxx',
//content: html,
//time: 2010-02-02T10:00:00,
//board: EOS,
//boardId: 5,
//imgUrlBase64_id0:859c18d81e20d7c3c5269d93e81d3053
//serverTime: false
//status: inQueue(or outQueue)

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name == 'refreshBigVs') {
        console.log('enter refreshBigVs');
        refreshBigVs(function() {});
    } else if (alarm.name == 'refreshTimer') {
        chrome.storage.sync.get('config', function(res) {
            if (res.config.reloadIndex) {
                console.log('enter refreshTimer');
                setTimeout(function() {
                    openOrReloadAIndex(function() {});
                }, parseInt(Math.random() * 1000 * 3600));
                //}, parseInt(Math.random() * 1000 ));
            }
        })

    } else if (alarm.name == 'bigVTimer') {
        chrome.storage.sync.get('config', function(result) {
            if (result.config.bigV) {
                console.log('check bigVTime');

                chrome.storage.sync.get(['bigVs'], function(res) {
                    bigVs = res.bigVs;
                    if (!bigVs || bigVs.length == 0) {
                        return;
                    }
                    var changed = false;
                    for (var i in bigVs) {
                        var bHour = bigVs[i].bigVHour;
                        var bMin = bigVs[i].bigVMinute;
                        var bWeekday = (new Date()).getDay();
                        if (result.config.bigVTimeDiff) {
                            var btd = result.config.bigVTimeDiffMinutes;
                            if (!btd) {
                                btd = 0
                            };
                            var tmpNow = new Date();
                            tmpNow.setHours(bHour);
                            tmpNow.setMinutes(bMin);

                            tmpNow = new Date(tmpNow.getTime() + btd * 60 * 1000);
                            bHour = tmpNow.getHours();
                            bMin = tmpNow.getMinutes();
                            bWeekday = tmpNow.getDay();
                        }
                        var rightDay = false;
                        if (bigVs[i].publishWeekday) {
                            if (bigVs[i].publishWeekday + '' == '-1') {
                                rightDay = true;
                            }
                            if (bigVs[i].publishWeekday + '' == '7' && bWeekday == 0) {
                                rightDay = true;
                            }
                            if (bigVs[i].publishWeekday + '' == (bWeekday + '')) {
                                rightDay = true;
                            }
                        } else {
                            rightDay = true;
                        }
                        if (!rightDay) {
                            continue;
                        }
                        var bId = bigVs[i].bigVId;
                        var now = new Date();
                        var diff = 0;
                        if (parseInt(bHour) == 0 && now.getHours() == 23) {
                            diff = 60 - now.getMinutes() + parseInt(bMin);
                        } else {
                            diff = (now.getHours() * 60 + now.getMinutes()) - (parseInt(bHour) * 60 + parseInt(bMin));
                        }
                        if (diff <= 2 && diff >= -2) {
                            if (!bigVs[i].lastOpen) {
                                bigVs[i].lastOpen = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes();
                            } else {
                                if ((now - new Date(bigVs[i].lastOpen)) < 60000 * 60) {
                                    continue;
                                }
                                bigVs[i].lastOpen = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes();
                            }
                            console.log('one bigV is to publish');
                            changed = true;
                            chrome.tabs.create({
                                url: 'https://bihu.com/people/' + bigVs[i].bigVId + '?time=' + bigVs[i].bigVHour + ':' + bigVs[i].bigVMinute
                            }, function(tab) {});
                        }

                    }
                    if (changed) {
                        chrome.storage.sync.set({
                            'bigVs': bigVs
                        }, function() {});

                    }


                })

            }
        })
    } else if (alarm.name == "autoTaskTimer") {
        chrome.storage.sync.get('config', function(res) {
            if (res.config.autoPublish) {
                console.log('enter autoTaskTimer');
                chrome.storage.local.get(['tasks'], function(result) {
                    tasks = result.tasks;
                    if (!tasks) {
                        return;
                    }

                    function findTask(i) {
                        if (i >= tasks.length) {
                            return;
                        }
                        var task = tasks[i];
                        if (task.status == 'inQueue') {

                            openAIndex(function(tab) {
                                chrome.tabs.query({
                                    'url': 'https://bihu.com/edit?taskId=' + tasks[i].id
                                }, function(tabs) {
                                    if (tabs.length == 0) {
                                        var theTime = new Date(task.time);
                                        if (theTime - new Date() <= 360000) {
                                            chrome.tabs.sendMessage(tab.id, {
                                                method: 'prepareLocalStorage',
                                                task: task
                                            }, function(response) {
                                                chrome.tabs.create({
                                                    url: 'https://bihu.com/edit?taskId=' + task.id
                                                });
                                                processTask(task.id, function() {});
                                            });

                                            return true;
                                        } else {
                                            findTask(i + 1);
                                        }
                                    } else {
                                        findTask(i + 1);
                                    }
                                });

                            });
                        } else {
                            findTask(i + 1);
                        }
                    }
                    var i = 0;
                    findTask(i);
                });
            }
        });
    }
});

/**
  chrome.webRequest.onBeforeRequest.addListener(function(details) {
    if (details.url == 'https://bihu.com//skins/lightgray/skin.min.css') {
      return {
        redirectUrl: chrome.runtime.getURL('tinymce/skins/lightgray/skin.min.css')
      }
    }
    if (details.url == 'https://bihu.com//skins/lightgray/content.min.css') {
      return {
        redirectUrl: chrome.runtime.getURL('tinymce/skins/lightgray/content.min.css')
      }
    }
    if (details.url == 'https://bihu.com/fonts/tinymce.woff') {
      return {
        redirectUrl: chrome.runtime.getURL('tinymce/skins/lightgray/fonts/tinymce.woff')
      }
    }
    if (details.url == 'https://bihu.com/fonts/tinymce.ttf') {
      return {
        redirectUrl: chrome.runtime.getURL('tinymce/skins/lightgray/fonts/tinymce.ttf')
      }
    }
    if (details.url == 'https://bihu.com//langs/zh_CN.js') {
      return {
        redirectUrl: chrome.runtime.getURL('tinymce/langs/zh_CN.js')
      }
    }
    if (details.url.startsWith('https://bihu.com//plugins/')) {
      return {
        redirectUrl: chrome.runtime.getURL('tinymce/' + details.url.replace('https://bihu.com/', ''))
      }
    }
  }, {
    urls: ['<all_urls>'],
  }, [
    'blocking'
  ]);
  */


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('get a message');
    console.log(message);
    if (message.method == 'getFavArticles') {
        getFavArticles(function(result) {
            //console.log('in callback')
            //console.log(result);
            sendResponse({
                'success': true,
                'result': result.favArticleInfo
            });
        });
    } else if (message.method == 'getFavUsers') {
        getFavUsers(function(result) {
            //console.log('in callback')
            //console.log(result);
            sendResponse({
                'success': true,
                'result': result.favUserInfo
            });
        });
    } else if (message.method == 'checkFavArticle') {
        checkFavArticle(message.articleId, function(result) {
                //console.log(message);
                //console.log('checkFavArticle, result:'+result);
                sendResponse({
                    'success': result
                });
            })
            //return true; 加上这一行可以暗示sendResponse为异步调用。 
    } else if (message.method == 'checkFavUser') {
        checkFavUser(message.userId, function(result) {
            sendResponse({
                'success': result
            });
        })
    } else if (message.method == 'addFavArticle') {
        //console.log('addFavArticle');
        addFavArticle(message.data, function() {
            sendResponse({
                'success': true
            });
        })
    } else if (message.method == 'addFavUser') {
        addFavUser(message.data, function() {
            sendResponse({
                'success': true
            });
        })
    } else if (message.method == 'delFavArticle') {
        delFavArticle(message.articleId, function() {
            sendResponse({
                'success': true
            });
        })
    } else if (message.method == 'delFavUser') {
        delFavUser(message.userId, function() {
            sendResponse({
                'success': true
            });
        })
    } else if (message.method == 'startDog') {
        startDog();
        sendResponse({
            'success': true
        });
    } else if (message.method == 'killDog') {
        killDog();
        sendResponse({
            'success': true
        });
    } else if (message.method == 'notification') {
        notify(message.opt, message.id);
    } else if (message.method == 'getDrafts') {
        getDrafts(message.auto, function(res) {
            console.log(res);
            var result;
            if (message.auto) {
                result = res.draftsAuto;
            } else {
                result = res.drafts;
            }
            sendResponse({
                'success': true,
                'result': result
            });
        });
    } else if (message.method == 'getDraft') {
        getDraft(message.id, function(res) {
            sendResponse({
                'success': true,
                'result': res
            });
        });
    } else if (message.method == 'saveDraft') {
        saveDraft(message.draft, function(draft) {
            sendResponse({
                'success': true,
                'draft': draft
            });
        });
    } else if (message.method == 'delDraft') {
        delDraft(message.id, function() {
            sendResponse({
                'success': true
            });
        })
    } else if (message.method == 'getTask') {
        getTask(message.id, function(task) {
            sendResponse({
                'success': true,
                'task': task
            })
        })
    } else if (message.method == 'getTasks') {
        getTasks(function(result) {
            sendResponse({
                'success': true,
                'tasks': result.tasks
            })
        })
    } else if (message.method == 'delTask') {
        delTask(message.id, function() {
            sendResponse({
                'success': true
            })
        })
    } else if (message.method == 'addTask') {
        addTask(message.task, function(task) {
            sendResponse({
                'success': true,
                'task': task
            })
        })
    } else if (message.method == 'finishTask') {
        finishTask(message.taskId, function() {
            sendResponse({
                'success': true
            })
        })
    } else if (message.method == 'checkTaskOpenUnique') {
        checkTaskOpenUnique(message.id, function(isUnique) {
            sendResponse({
                'success': true,
                'isUnique': isUnique
            })
        });
    } else if (message.method == 'addBigV') {
        addBigV(message.data, function(bigV) {
            sendResponse({
                'success': true,
                'bigV': bigV
            })
        })
    } else if (message.method == 'getBigVs') {
        getBigVs(function(bigVs) {
            sendResponse({
                'success': true,
                'bigVs': bigVs.bigVs
            })
        })
    } else if (message.method == 'delBigV') {
        delBigV(message.id, function() {
            sendResponse({
                'success': true
            })
        })
    } else if (message.method == 'getConfig') {
        getConfig(function(result) {
            sendResponse({
                'success': true,
                'config': result.config
            })
        })
    } else if (message.method == 'getServerVList') {
        getServerVList(function(result) {
            sendResponse({
                'success': true,
                'vlist': result
            })
        })
    } else if (message.method == 'refreshBigVs') {
        refreshBigVs(function(result) {
            sendResponse({
                'success': true,
                'bigVs': result
            })

        })
    }
    return true;
});
//watch for url change
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {


    if (/https:\/\/bihu.com\/edit\//.test(details.url)) {
        chrome.tabs.executeScript(null, {
            file: "content-autoPublish.js"
        });
        chrome.tabs.insertCSS(null, {
            file: "content-autoPublish.css"
        });
    } else if (/https:\/\/bihu.com\/article\//.test(details.url)) {
        chrome.tabs.executeScript(null, {
            file: "content-articlePage.js"
        });
        chrome.tabs.insertCSS(null, {
            file: "content-articlePage.css"
        });
    } else if (/https:\/\/bihu.com\/people\//.test(details.url)) {
        chrome.tabs.executeScript(null, {
            file: "content-userPage.js"
        });
        chrome.tabs.insertCSS(null, {
            file: "content-userPage.css"
        });
    }
});
//获取vlist 服务器的
function getServerVList(callback) {
    chrome.storage.sync.get(['bigVs'], function(result) {
        var vlist = [];
        for (var i in result.bigVs) {
            if (result.bigVs[i].fromServer) {
                vlist.push(result.bigVs[i].bigVId);
            }
        }
        callback(vlist);
    });
}

//2-3小时定时刷新iframe
setInterval(function() {
    setTimeout(function() {
        console.log('refresh frame');
        var theIframe = document.getElementById('nm_iframe');
        if (theIframe) {
            theIframe.parentNode.removeChild(theIframe)
        }
        var tmpiframe = document.createElement('iframe');
        tmpiframe.name = 'nm_iframe';
        tmpiframe.id = 'nm_iframe';
        tmpiframe.src = 'https://bihu.com/';
        tmpiframe.style.display = 'none';
        document.body.appendChild(tmpiframe);
    }, Math.random() * 1000 * 3600);
}, 7200000);

//查找某taskid是否只打开了一个窗口
function checkTaskOpenUnique(id, callback) {
    var theUrl = 'https://bihu.com/edit?taskId=' + id;
    chrome.tabs.query({
        'url': theUrl
    }, function(tabs) {
        if (tabs.length == 1) {
            callback(true);
        } else {
            callback(false);
        }
    })
}

//查找是否有打开一个bihu.com标签页,没有的话打开一个
function openAIndex(callback) {
    chrome.tabs.query({
        'url': 'https://bihu.com/'
    }, function(tabs) {
        if (tabs.length > 0) {
            callback(tabs[0]);
        } else {
            chrome.tabs.create({
                url: 'https://bihu.com'
            }, function(tab) {
                setTimeout(function() {
                    callback(tab);
                }, 5000);
            });
        }
    });
}
//查找是否有打开一个bihu.com标签页,没有的话打开一个,有的话刷新一下
function openOrReloadAIndex(callback) {
    chrome.tabs.query({
        'url': 'https://bihu.com/'
    }, function(tabs) {
        if (tabs.length > 0) {
            chrome.tabs.reload(tabs[0].id, function() {
                setTimeout(function() {
                    callback(tabs[0].id);
                }, 5000);
            });
        } else {
            chrome.tabs.create({
                url: 'https://bihu.com'
            }, function(tab) {
                setTimeout(function() {
                    callback(tab);
                }, 5000);
            });
        }
    });
}


//标记为已完成
function finishTask(id, callback) {
    chrome.storage.local.get(['tasks'], function(res) {
        console.log(res.tasks);
        for (var i in res.tasks) {
            if (res.tasks[i].id == id) {
                res.tasks[i].status = 'outQueue';
                chrome.storage.local.set({
                    'tasks': res.tasks
                }, function() {
                    console.log(res.tasks);
                    callback('');
                })
                return;
            }
        }
    });
}
//标记为处理中
function processTask(id, callback) {
    chrome.storage.local.get(['tasks'], function(res) {
        console.log(res.tasks);
        for (var i in res.tasks) {
            if (res.tasks[i].id == id) {
                res.tasks[i].status = 'processing';
                chrome.storage.local.set({
                    'tasks': res.tasks
                }, function() {
                    callback('');
                })
                return;
            }
        }
    });
}

function refreshBigVs(callback) {
    var bigVs = [];
    chrome.storage.sync.get(['bigVs'], function(res) {
        bigVs = res.bigVs;
        var vlist = [];
        var vlist_Mapping2i = {};
        var ilist = new Set();
        for (var i in res.bigVs) {
            if (res.bigVs[i].fromServer) {
                vlist.push(parseInt(res.bigVs[i].bigVId));
                vlist_Mapping2i[res.bigVs[i].bigVId] = i;
                ilist.add(i);
            }
        }
        $.post('http://123.206.196.207/timeBase/refreshTimings/', {
            vlist: vlist
        }, function(res) {
            for (var i in res) {
                var tmpRetured = res[i];
                var savedIndex = vlist_Mapping2i[tmpRetured.bihuId];
                ilist.delete(savedIndex);
                var tmpSaved = bigVs[savedIndex];
                tmpSaved.bigVHour = tmpRetured.publishTime.substr(0, 2);
                tmpSaved.bigVMinute = tmpRetured.publishTime.substr(3, 2);
                tmpSaved.publishWeekday = tmpRetured.publishWeekday;
                bigVs[savedIndex] = tmpSaved;
            }
            ilist.forEach(function(item) {
                bigVs.splice(item, 1);
            })
            chrome.storage.sync.set({
                'bigVs': bigVs
            }, function() {
                console.log('刷新成功!');
                callback(bigVs);
            });

        })
    })
}

//获取config
function getConfig(callback) {
    chrome.storage.sync.get(['config'], callback);
}

//获取所有bigV
function getBigVs(callback) {
    chrome.storage.sync.get(['bigVs'], callback);
}
//增加bigV
function addBigV(bigV, callback) {
    chrome.storage.sync.get(['bigVs'], function(result) {
        if (!result.bigVs) {
            result.bigVs = [];
        }
        bigV.id = 'bigV' + Math.round(Math.random() * 10000000) + '-' + Date.now();
        bigV.lastOpen = null;
        chrome.storage.sync.set({
            'bigVs': result.bigVs.concat(bigV)
        }, function() {
            console.log('大V增加成功!');
            callback(bigV);
        });
    });
}
//删除bigV
function delBigV(id, callback) {
    let bigVs;
    chrome.storage.sync.get(['bigVs'], function(result) {
        bigVs = result.bigVs;
        let theI = -1;
        for (var i in bigVs) {
            if (bigVs[i].id == id) {
                theI = i;
                break;
            }
        }
        if (theI > -1) {
            bigVs.splice(theI, 1);
            chrome.storage.sync.set({
                'bigVs': bigVs
            }, callback);
        }
    });

}

//获取所有task
function getTasks(callback) {
    chrome.storage.local.get(['tasks'], callback);
}
//获取特定task
function getTask(id, callback) {
    chrome.storage.local.get(['tasks'], function(res) {
        for (var i in res.tasks) {
            if (res.tasks[i].id == id) {
                callback(res.tasks[i]);
                return;
            }
        }
        callback('');
    });
}
//增加task
function addTask(task, callback) {
    chrome.storage.local.get(['tasks'], function(result) {
        if (!result.tasks) {
            result.tasks = [];
        }
        task.id = 'task' + Math.round(Math.random() * 10000000) + '-' + Date.now();
        chrome.storage.local.set({
            'tasks': result.tasks.concat(task)
        }, function() {
            console.log('任务保存成功!');
            callback(task);
        });
    });
}
//删除task
function delTask(id, callback) {
    let tasks;
    console.log('background delTask id:' + id);
    chrome.storage.local.get(['tasks'], function(result) {
        tasks = result.tasks;
        let theI = -1;
        for (var i in tasks) {
            if (tasks[i].id == id) {
                theI = i;
                break;
            }
        }
        if (theI > -1) {
            tasks.splice(theI, 1);
            chrome.storage.local.set({
                'tasks': tasks
            }, callback);
        }
    });

}

//获取所有草稿列表
function getDrafts(auto, callback) {

    if (auto) {
        chrome.storage.local.get(['draftsAuto'], callback);
    } else {
        chrome.storage.local.get(['drafts'], callback);
    }
}

function getDraft(id, callback) {
    chrome.storage.local.get(['drafts'], function(res) {
        for (var i in res.drafts) {
            if (res.drafts[i].id == id) {
                callback(res.drafts[i]);
                return;
            }
        }
        chrome.storage.local.get(['draftsAuto'], function(res) {
            for (var i in res.draftsAuto) {
                if (res.draftsAuto[i].id == id) {
                    callback(res.draftsAuto[i]);
                    return;
                }
            }
            callback('');
        })
    });
}
//保存草稿
function saveDraft(draft, callback) {
    if (!draft.auto) {
        chrome.storage.local.get(['drafts'], function(result) {
            if (!result.drafts) {
                result.drafts = [];
            }
            draft.id = 'draft' + result.drafts.length + '-' + Date.now();
            chrome.storage.local.set({
                'drafts': result.drafts.concat(draft)
            }, function() {
                console.log('草稿保存成功!');
                _notify('通知', '草稿保存成功，请点击浏览器插件按钮查看!');
                callback(draft);
            });
        });
    } else {

        chrome.storage.local.get(['draftsAuto'], function(result) {
            if (!result.draftsAuto) {
                result.draftsAuto = [];
            }
            if (result.draftsAuto.length >= 5) {
                result.draftsAuto.splice(0, 1);
            }
            draft.id = 'draftsAuto' + result.draftsAuto.length + '-' + Date.now();
            chrome.storage.local.set({
                'draftsAuto': result.draftsAuto.concat(draft)
            }, function() {
                console.log('草稿自动保存成功!');
                callback(draft);
            });
        });
    }

}
//删除草稿
function delDraft(id, callback) {
    var target;
    if (id.indexOf('draftsAuto') == -1) {
        target = 'drafts'
    } else {
        target = 'draftsAuto'
    }
    chrome.storage.local.get([target], function(res) {
        drafts = res[target];
        if (!drafts || drafts.length == 0) {
            return;
        }
        let theI = -1;
        for (var i in drafts) {
            if (drafts[i].id == id) {
                theI = i;
                break;
            }
        }
        if (theI > -1) {
            drafts.splice(theI, 1);
        } else {
            return;
        }
        chrome.storage.local.set({
            [target]: drafts
        }, callback);
    })
}
//本脚本通知
function _notify(title, message) {
    var _opt = {
        type: "basic",
        title: title,
        message: message,
        iconUrl: "icon/icon128.png"
    }
    chrome.notifications.create('', _opt, function(id) {
        console.log(id);
    });
}
//接收外部请求
function notify(opt, id) {
    chrome.notifications.create('' + id, opt, function(id) {
        console.log(id);
    });
}

//获取收藏的文章
function getFavArticles(callback) {
    chrome.storage.sync.get(['favArticleInfo'], callback);
}

//获取收藏的用户
function getFavUsers(callback) {
    chrome.storage.sync.get(['favUserInfo'], callback);
}

// check if a article is  in favorite set
function checkFavArticle(articleId, callback) {
    //console.log(articleId);
    if (!articleId) {
        return;
    }
    //console.log(callback);
    let favArts;
    chrome.storage.sync.get(['favArticleInfo'], function(result) {
        favArts = result.favArticleInfo;
        for (var i in favArts) {
            if (favArts[i].id == articleId) {
                callback(true);
                return;
            }
        }
        callback(false);
    });
}
// check if a user is in favorite set
function checkFavUser(userId, callback) {
    let favUsers;
    chrome.storage.sync.get(['favUserInfo'], function(result) {
        favUsers = result.favUserInfo;
        for (var i in favUsers) {
            if (favUsers[i].id == userId) {
                callback(true);
            }
        }
        callback(false);
    });
}
// 收藏新的文章
function addFavArticle(data, callback) {
    chrome.storage.sync.get('favArticleInfo', function(result) {
        result = result.favArticleInfo;
        if (!result) {
            result = [];
        }
        //console.log(result);
        chrome.storage.sync.set({
            'favArticleInfo': result.concat(data)
        }, callback);
    });
}
// 收藏新的用户
function addFavUser(data, callback) {
    chrome.storage.sync.get('favUserInfo', function(result) {
        result = result.favUserInfo;
        if (!result) {
            result = [];
        }
        chrome.storage.sync.set({
            'favUserInfo': result.concat(data)
        }, callback);
    });
}

//删除收藏的文章
function delFavArticle(articleId, callback) {
    //console.log('enter delFavArticle');
    //console.log(articleId);
    let favArts;
    chrome.storage.sync.get(['favArticleInfo'], function(result) {
        favArts = result.favArticleInfo;
        let theI = -1;
        for (var i in favArts) {
            if (favArts[i].id == articleId) {
                theI = i;
                break;
            }
        }
        if (theI > -1) {
            favArts.splice(theI, 1);
        } else {
            return;
        }
        chrome.storage.sync.set({
            'favArticleInfo': favArts
        }, callback);
    });
}
//删除收藏的用户
function delFavUser(userId, callback) {
    //console.log('enter delFavUser');
    let favUsers;
    chrome.storage.sync.get(['favUserInfo'], function(result) {
        favUsers = result.favUserInfo;
        //console.log(result);
        //console.log(userId);
        let theI = -1;
        for (var i in favUsers) {
            if (favUsers[i].id == userId) {
                theI = i;
                break;
            }
        }
        if (theI > -1) {
            favUsers.splice(theI, 1);
            chrome.storage.sync.set({
                'favUserInfo': favUsers
            }, callback);
        }
    });
}