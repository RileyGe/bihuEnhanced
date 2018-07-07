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
        url: '//jiyanapishenzhi.c2567.com/shibie_shenzhi',
        type: 'GET',
        timeout: 60000,
        beforeSend: function(request) {
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        },
        data: {
            'user': 'grlsr',
            'pass': 'grl19870606',
            'referer': 'https://bihu.com/edit',
            'format': 'utf8',
            'browserinfo': 'wHKfmBFgL43m61EsY5h06HXvDcS8JJlc0eYvPB62XaQXUUVkFSWN9HhT0c8qbszt2ARAtBH63Bv6zXMSF9QKk5Wt35LOOdytaFdeJ6(B(HNQtK8zo4JNf4(qo7JyFvYGgrxZMg9x51J3IDYKjlJMmTon3MYWDIk2XQHdL9FWSgAlgi1FAVyQHnQhj)2T0zIUYGepOGpNRsdKHEn(5p7GTLW6j)VK2bBBk78n0c(Clw)gdUdN5CH(qQHnafCn6qzWe6(ubCYc)unc))AvBbWzhKvsLVrwyH06Bk2hvDWEYrHc6a2tWMenq4i56lvGFZHK2y4C2f9aisBLlGkpSdBP3sLdwotKXqMn4tVh8TGBV2hRiN3PACOiJiKkuCNAhVkWbFB2VYvZI6gK8s6vpnFH1CX2TiLx4nnTjYo9ZCr07eVg6w0AY7Q5If13xnZ(W492WCHSoNDTp8ct1FmE5uuSDCCM)d(jnQOoDM5vkWmf1axhIjyAM23TshRb1Z7tdtGYUXy3t3sozwp1WUKpWa6QBfCUY8OWnlW3fznsd8(OgmgP2osInUDRNM8mFvvBGjZK4vV3D9ETzXkFdB0Xx4NvG1iLb)CiiYtYPWk7kjLWbbEsxX9LyJpk26WFyBzH0tzH))Xr8N458AH2UUHtKhlajd(ht11cjPnbFAlmHj5qriZ6Raci1Y0IaSja55pvhpScoCvwdzCyK9dYkSbqnwI7TqIPnzK(CaWTg3R7eJ617yPc8(ey5DQW))9pEZpSrucqpVBrLFSuI5EBajqzUP4sURT)EIWY(4EADPJAqHjmWfk2XRWdxGEkv0UmQxIRZCSJq5fuJXhNBTk0Ls0zWs64vWKoqFJ50IiCDbg4PJZdPRXe0nfPNGiPYWydoCh2EchuFJVlB4fAN5NBQlFLITQ8evS()ZMcMqCLZyBdv40KmlnYFzi6wDiJAYez33rtCbb)ewWaIBP2K56BnBkxcrEkLghT3ljkQcFvvFKY6XYwARkkDUz16Bro(X3(NbbG98tPDvDqKIJuoA)AiRg40BcZnogRhF8pNK4h1qePX3(GOHIgrnUnfp3M9)gani08RE95tac6jHATzPgRuOKp4GjTulSFHINJ)xNAKSnvS3RDek)ZEMiPNaT))KAJ9krfmfGCu8MAr)mWmDnLhHwNEATWLdv2)3D3OG9GKEr))qvfi8TvgHXCCAXTCcu7aB48v1MD9w6u1CzZomDkrlSWbPSKRl2lLb27wo9yENwo6blMiK797M14wQyeweajFcED1fn1YKEfOZeqiQJetJ6Fz62f2fY)yG0pBHIBzVMM947K32wrEDucOsIdl4GPUinZ1vOtRwU22pNcHL8PfSXV809qXJGiQn(bt0pxurIUUKNvs)czRfwlLtRCwVL(OqmldlQpDCg)sW2lCi9XhqTrve89Ank)Yv94hZoIt8F8OKy)hrW338IVLFC3YTgWM6bokbI9r9pub0Mo3zYgUUqJKu4MXdlKcbgO)jYeJKsGsRcvw6AZ2G7nI2xcA11dKpzUUHV81ZYw1DXEEOU2XXQQShkDgMEV3ACDoZDGwSJbxPPymKsRm53KyMDacs6niK1x2cRHxcMyzCz4o30aRa4R5M4tnxmNTMMS8h3lsLvy00igMdvh2VdBmwRg2b5kSytCPDtHGeUPPwVEJ(GLXT3SNokjU2frzIbssyd)kQLTZlBQwYgRD8aIOBjBAhBGz1qiDLaGpbI3XahU)9B4AM3BC5KnUsTKP5eBibmC3lbGgDsfr7L9y8yBRRpXtzGvhc3NEDEpdAforqSBj8(PnEm)zuOE8Pb23QrYL9LpxjJDoZViVZEOl6O9JLHDQxXfXlQjIk7OjUZoahZroht4HAb9hjHcCwhDmTMiWXEOXoXq8wL)yRG6xxi4mfxRSJJXkN(zagwBIBTcroBXcWa1KwTFgX3DpOYnAByuzp2mTeLbhl8U4Io.a7606e5f3ef9cac6ca83a79e24f8b31e16dc86cb01643a5584c6a914a41080f7e4a95a28c213fe9f45e419225f2a6a17aaf71a81d225d9e966fb52d5fe3e90f30edfab1b59374419f59aa805d65b4ce826579f8abd7be81c43278c55845a3a34c74876ed2ef328aaf86ea10f98eb2d1dbbb1baff7e2c3bfe7ddd218163d827fb'
        },
        success:function(res){
            //alert(res.resMsg);
            //window.close();
            //do nothing when last one message
            if(res.status == 'ok')
            {
                //loginCount = 0;
                //alert(res2.resMsg);
                //window.close();
                console.log('success');
            }
        }
    });
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