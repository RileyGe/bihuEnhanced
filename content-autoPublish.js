let targetDom;
let targetDomParent;
let autoBtn;
let theTime;
let inLoop = false;
let notified = {
    oneMinute: false,
    fiveMinutes: false
}
let uploadDom;
let timeDiff = 0;
let curTask = null;
let taskId = null;
let curDraft = null;
let draftId = null;

let published = false;

let intervalId = -1;

let config = null;

let boardMap = {
    '比特币': 1,
    'CYBEX': 2,
    'DEW': 3,
    'ENG': 4,
    'EOS': 5,
    '以太坊': 6,
    'KEY': 7,
    '路印协议': 8,
    'MKR': 9,
    'NEO': 10,
    'ONT': 11,
    '唯链': 12,
    '安全资产': 13,
    '百咖说': 14,
    '币圈八卦': 15,
    '大咖访谈': 16,
    '行情解读': 17,
    '精链币答': 18,
    'LAUNCH': 19,
    '通证经济': 20,
    '挖矿': 21,
    '小白入门': 22,
    '项目分析': 23,
    '知识库': 24
}

if (/https:\/\/bihu.com\/edit/.test(window.location.href)) {
    getTargetDom();
}

function getTargetDom() {
    console.log('try to get the target dom');
    try {
        targetDomParent = document.getElementById('edit');
        targetDom = document.getElementsByClassName('add-forum-bottom')[0];
        if (targetDom && targetDomParent) {
            console.log('got!')
            addActions();
        } else {
            setTimeout(getTargetDom, 1000);
        }
    } catch (e) {
        //setTimeout(getTargetDom,1000);
        console.log(e);
    }
}

function setDisabled(status) {
    document.getElementById('year').disabled = status;
    document.getElementById('month').disabled = status;
    document.getElementById('day').disabled = status;
    document.getElementById('hour').disabled = status;
    document.getElementById('minute').disabled = status;
    document.getElementById('second').disabled = status;
}

function checkTime() {
    if (!inLoop) {
        return;
    }
    let now = new Date();
    if (now >= theTime && (!published)) {
        if (curTask) {
            chrome.runtime.sendMessage({
                method: "finishTask",
                taskId: curTask.id
            }, function(response) {});
        }
        //document.getElementsByClassName('LoaderButton edit-ok')[0].click();
        inLoop = false;
        published = true;
        clearInterval(intervalId);
        fakePublish();
        notify_published();
        document.getElementById('resStr').innerHTML = '已发布！';
    } else {
        let diff = theTime - now;
        if (diff > 60000 && diff < 300000) {
            if (!notified.fiveMinutes) {
                notify_minute(5);
                notified.fiveMinutes = true;
            }
        }
        if (diff <= 60000) {
            if (!notified.oneMinute) {
                notify_minute(1);
                notified.oneMinute = true;
            }
            document.getElementById('resStr').style.color = 'red';
        }
        let diffHour = parseInt(diff / 60000 / 60);
        let diffMinute = parseInt(diff / 60000 - diffHour * 60);
        let diffSecond = parseInt(diff / 1000 - diffHour * 60 * 60 - diffMinute * 60);
        let resStr = '距离发布还有 ' + diffHour + '时' + diffMinute + '分' + diffSecond + '秒';

        document.getElementById('resStr').innerHTML = resStr;
    }
}

function startLoop() {
    clearInterval(intervalId);
    intervalId = setInterval(checkTime, 1000);
}

function cancel() {
    setDisabled(false);
    inLoop = false;
    published = false;
    clearInterval(intervalId);

    document.getElementById('resStr').innerHTML = '';
    document.getElementById('log').style.display = 'none';
    document.getElementById('startTimer').style.display = '';
    document.getElementById('cancelTimer').style.display = 'none';
}

function showData(result) {
    console.log(result);
}

function start() {
    notified = {
        oneMinute: false,
        fiveMinutes: false
    }
    let year = document.getElementById('year').value;
    let month = document.getElementById('month').value;
    let day = document.getElementById('day').value;
    let hour = document.getElementById('hour').value;
    let minute = document.getElementById('minute').value;
    let second = document.getElementById('second').value;
    if (!/\d\d\d\d/.test(year) || year.length > 4) {
        alert('年份输入错误，样例：2018');
        return;
    }
    if (!/\d\d?/.test(month) || month.length > 2 || parseInt(month) > 12) {
        alert('月份输入错误，样例：04');
        return;
    }
    if (!/\d\d?/.test(day) || day.length > 2 || parseInt(day) > 31) {
        alert('天数输入错误，样例：20');
        return;
    }
    if (!/\d\d?/.test(hour) || hour.length > 2 || parseInt(hour) > 24) {
        alert('小时输入错误，样例：14');
        return;
    }
    if (!/\d\d?/.test(minute) || minute.length > 2 || parseInt(minute) > 60) {
        alert('分钟输入错误，样例：00');
        return;
    }
    if (!/\d\d?/.test(minute) || minute.length > 2 || parseInt(minute) > 60) {
        alert('秒数输入错误，样例：00');
        return;
    }
    if (document.getElementsByClassName('edit-title')[0].value == '') {
        alert('请输入标题！');
        return;
    }
    if (document.getElementsByClassName('public-btn edit-btn')[0].innerHTML == '添加版块') {
        alert('请先选择好版块!');
        return;
    }
    theTime = new Date(year, parseInt(month) - 1, day, hour, minute, second);
    document.getElementById('log').style.display = '';
    document.getElementById('startTimer').style.display = 'none';
    document.getElementById('cancelTimer').style.display = '';
    setDisabled(true);
    inLoop = true;
    published = false;
    timeDiff = 0;
    startLoop();
}

function addActions() {
    actionsArea = document.createElement('div');
    actionsArea.setAttribute('class', 'areaWrapper');
    actionsArea.innerHTML = "<div style=' border: 1px solid #007bff; border-radius: 3px;padding: 5px;'  > \
    <div class='timeBar'>\
    <span class='alertNote'>发布时间:</span>\
    <input class='myInput' placeholder='2018' id='year' ></input>\
    <span>年</span>\
    <input class='myInput' placeholder='4' id='month' ></input>\
    <span>月</span>\
    <input  class='myInput'placeholder='12' id='day' ></input>\
    <span>日</span>\
    <input class='myInput' placeholder='05' id='hour' ></input>\
    <span>点</span>\
    <input class='myInput' placeholder='00' id='minute' ></input>\
    <span>分</span>\
    <input class='myInput' placeholder='00' id='second' ></input>\
    <span>秒</span>\
    <span style='flex:1'></span>\
    </div> \
    <div class='timeBar'>\
    <span style='flex:1'></span>\
    <button id='startTimer'>定时发布</button>\
    <button id='cancelTimer'>取消</button>\
    </div>\
    <div style='text-align:right'>\
    <span id='log' ><span id='resStr'></span>...</span>\
    </div>\
    </div>\
    <div class='selfNote'>定时模块By币乎增强插件</div>";
    targetDomParent.insertBefore(actionsArea, targetDom);
    $('.areaWrapper')[0].style.setProperty('display', 'block', 'important');


    $(".LoaderButton.edit-ok").hide();
    $(".LoaderButton.edit-preview").hide();
    var fakePublishBtn = $('<button id="fakePublishBtn" class="LoaderButton" style="margin-left:10px">发布</button>');
    var fakePreviewBtn = $('<button id="fakePreviewBtn" class="LoaderButton">预览</button>');
    fakePublishBtn.insertBefore(".LoaderButton.edit-ok");
    fakePreviewBtn.insertBefore("#fakePublishBtn");
    $("#fakePublishBtn").click(fakePublish);
    $("#fakePreviewBtn").click(fakePreview);

    document.getElementById('startTimer').onclick = start;
    document.getElementById('cancelTimer').onclick = cancel;
    document.getElementById('log').style.display = 'none';
    document.getElementById('cancelTimer').style.display = 'none';
    if (!taskId) {
        let now = new Date();
        now.setHours(now.getHours() + 1);
        document.getElementById('year').value = now.getFullYear();
        document.getElementById('month').value = now.getMonth() + 1;
        document.getElementById('day').value = now.getDate();
        document.getElementById('hour').value = now.getHours();
        document.getElementById('minute').value = '00';
        document.getElementById('second').value = '00';
    }
}

function fakePreview(e) {
    if (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
    }
    $(".LoaderButton.edit-preview").click();
}

function fakePublish(e) {
    if (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
    }
    $(".w-e-text-container").click();
    $(".LoaderButton.edit-ok").click();
}

function notify_published() {
    var opt = {
        type: "basic",
        title: "币乎增强插件通知",
        message: "您在币乎的文章已按时发布,感谢使用！",
        iconUrl: "icon/icon128.png"
    }
    chrome.runtime.sendMessage({
        method: "notification",
        opt: opt,
        id: '' + parseInt(Math.random() * 1000)
    }, function(response) {});
}

function notify_minute(n) {
    var opt = {
        type: "basic",
        title: "币乎增强插件通知",
        message: "距离您定时发文还有不到" + n + "分钟",
        iconUrl: "icon/icon128.png"
    }
    chrome.runtime.sendMessage({
        method: "notification",
        opt: opt,
        id: '' + parseInt(Math.random() * 1000)
    }, function(response) {});
}