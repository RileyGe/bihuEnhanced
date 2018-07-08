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
    //var head = document.head || document.getElementsByTagName('head')[0];
    //head.innerText += '<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">';
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
    $.ajax({
        url: '//jiyanapi.c2567.com/shibie_shenzhi',
        type: 'GET',
        timeout: 60000,
        //dataType: 'jsonp',
        beforeSend: function(request) {
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        },
        data: {
            'user': 'grlsr',
            'pass': 'grl19870606',
            'referer': 'https://bihu.com/edit',
            'format': 'utf8',
            'browserinfo': '3jkKP6zz6VaIeXVKyb8LhDGD6ABEg9(wjUlfSE9T7iRN2Tj3MY81PDOqyPCt22Gne7b6LiEGzF4SviA(vCjpi)bZA(rmx2jY9ughxkNmk7sm5JDdpJsp5tijK6ZvsJtY0ZQoEQqqOgXIRRp67rO(K3(PfUpfkdywkL1eHKW3UGSn5TlNsD0mLv4WxjezCYxwnNn3KF(aTUF)gCWfjBwBk0(sq20rukjI5q5dN11Bpkqjzfw7qxcEABxqfFiS0JXKKFnIB6bV(4Cxx7fXWnWaANa26xTk7vU8XtMlzCoI2qP3)9jnrn6DYXk0idlgtl1g38Ej0C2H5fM9YBJ8P5dLb1lb8qZRH5U(pYvEj0a)SjuYSFteUPdHcQ8OcRF3b5EpyawCRhq9WLOuRQpCurilcyTlyMYVLvR)rhsOkUr4nA4BbKbek8NVl(iTxKolQ4EZbL5s88oXP)u01)TGKamlusWa6HH8JkAVNwB3tXy6DxaayDaiHzQwjVJ5f97PggffvEbk46kBrBMuPcrrmPamQ6pp8TVNv2v3lA)Jvv3VyXB9w9fFBQ4f92vQhOCD(Oa0lR7gas(wIC9axW(KTV3mmMl6a4p7cMXxUTNg55LWnRsPp0)C5r4DuZqwRncfa3pzFOOZXaY84pqp4bCgIbc4gqfRdVw4b4Wk5tdyC7LXm(EOiBMB9KyZheECHxloBFdY3lxQUQK9ewrHS)9CHqUbDLEoU7pq2tnx92Ny8CY5ePx(7X(vzg1QRi5SzUTKT3E)g7WVGvD9WrXnBrXyPIVlHLpptyNmyK2oodb7ThxF5uWrC1NltNkoBkQ1lGhQ8J)2LlT18tg7Dfc9C9XHx6N3kiCZM2RAFtxtUpo9mDFHVbKwGwPIXTtjR9gE(u6VfmG9i4LTzOFmSQXH50th1aYXYFYY5NQuKVLan9FOMr6uMPXMGZKy34HHGMqP7brRZWzhDJ(pREhDZEnd1Gi8FMwrAVaDf2MSaXimtMmqltpLggIENckGAia0w3n2YR82adXlFNB(Ef95(kwuTY2h5xgjeVCjeXUIfBHkICXDRajKBKNi)ooBpfv26udcw5iOW3lmmUFOq3Dfm23o6x7Yn4QUIKLYXd9SeUaD8AfkF4(SVFlB7yqvLslScuUkzxPpxh(rH)Xrla1riG6eBalqGi7OHk9yXFpxJCpyUba(TXChM7RIjxpFP5V0SVUyeuz1lxoQ1KrikjzJC3Fu((GldE4TDkKivZuWR6WWlP3QvoZ7SXi8nVxXDXzt5kvALpPqtIsePoVeYLrM4U6ohzO5HBEHu20eTYG91GH)00xUUMz9E7pTBPUbVZeweqyd(YZselhMYCNFPt)XcQpaXaQ8UM7U9xNUlCVSeUEAl2c(BlAy(SOZ5T4rsclc1)KlldaL(IPf6T8)RsoCJhCalW9rDVQIjLHIWjV3rPpp7q5OYTEY7oZ)jtaTUxaqd9fu6k9QWw8zzRlAsMOvGAqiC6IaTVCXY6)2bfe5hYC8aXa(xUNQTOe8fIb33JeMUz381ENPABNr1Il7GP4NBQGhh2fqFBr14NFgTlBvwP594woapfsSuwxNHZ7wNTlQbNFKWkthMmbM995ad4e9389d910d79b9954c1f57e079a0a7e683b685c9aa5a3879bda8cf7ca9cd6292584d38227752de431bb31073373197e1add10c650891845d1275bc21d5f3854ed0d0e83bbbf45b3fd287bd27cfea2edfcc84be9c584f98af84b72a9d27bee315c5985dadb7cd0a52272e72449bf6e7154146f1c970369e5b3b7270991f'
        },
        success: function(res) {
            //alert(res.resMsg);
            //window.close();
            //do nothing when last one message
            if (res.status == 'ok') {
                //loginCount = 0;
                //alert(res2.resMsg);
                //window.close();
                console.log('success');

            }
            $(".w-e-text-container").click();
            $(".LoaderButton.edit-ok").click();
        },
        error: function(xhr, textStatus) {
            if (textStatus == 'timeout') {
                //处理超时的逻辑
            } else {
                //其他错误的逻辑
            }
        }

    });

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