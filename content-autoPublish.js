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
let useServerTime = false;
let timeDiff = 0;
let curTask = null;
let taskId = null;
let curDraft = null;
let draftId = null;

let published = false;

let intervalId = -1;

let config = null;

let currentEditor = 'bihu'; // or = 'tinyMCE'
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
    chrome.runtime.sendMessage({
        'method': 'getConfig'
    }, function(response) {
        if (response.success) {
            config = response.config;

            var url = window.location.href;
            var taskId_Reg = new RegExp("(^|&)" + 'taskId' + "=([^&]*)(&|$)", "i");
            taskId = window.location.search.substr(1).match(taskId_Reg);
            if (taskId) {
                taskId = unescape(taskId[2]);
            }
            var draftId_Reg = new RegExp("(^|&)" + 'draftId' + "=([^&]*)(&|$)", "i");
            draftId = window.location.search.substr(1).match(draftId_Reg);
            if (draftId) {
                draftId = unescape(draftId[2])
                getDraft(draftId, function() {
                    if (!targetDom) {
                        getTargetDom();
                    }
                });
            } else {
                if (!targetDom) {
                    getTargetDom();
                }

            }
        }
    });
}

function getDraft(draftId, callback) {
    chrome.runtime.sendMessage({
        method: 'getDraft',
        id: draftId
    }, function(response) {
        if (response.success) {
            var draft = response.result;
            curDraft = draft;
            saveToLS(draft);
            callback('');
        }
    })

}

function saveToLS(draft) {
    var logInfo = localStorage.getItem('ANDUI_BIHU_LOGININFO');
    var userId = JSON.parse(logInfo).userId;
    var savedArt = {
        boardId: "",
        boardName: "",
        editorContent: draft.content,
        imgUrlBase64: [],
        title: draft.title
    }
    localStorage.setItem('ANDUI_EDIT_' + userId, JSON.stringify(savedArt));
}

function getTargetDom() {
    console.log('try to get the target dom');
    try {
        targetDomParent = document.getElementById('edit');
        targetDom = document.getElementsByClassName('add-forum-bottom')[0];
        if (targetDom && targetDomParent) {
            console.log('got!')
            if(config.autoPublish){
                addActions();
            }
            if(config.editorEnhance){
                addEditorBtns();
            }
            if(config.manualDraft){
                addDraftDom();
            }
            if (!taskId) {
                loadDraft();
            } else {
                loadTask();
            }
            //loadTinyMCE();
        } else {
            setTimeout(getTargetDom, 1000);
        }
    } catch (e) {
        //setTimeout(getTargetDom,1000);
        console.log(e);

    }
}

function addEditorBtns() {
    //add fullscreen entering and exit btn
    var enterFullscreenBtn = $('<div id="enterFullscreenBtn" class="w-e-menu" style="z-index:11;">  <i class="iconfont" title="全屏编辑">&#xe606;</i></div>');
    var exitFullscreenBtn = $('<div id="exitFullscreenBtn"  class="w-e-menu" style="z-index:11;"> <i class="iconfont" title="取消编辑">&#xe73a;</i></div>');
    exitFullscreenBtn.hide();
    $(".w-e-toolbar").append(enterFullscreenBtn);
    $(".w-e-toolbar").append(exitFullscreenBtn);
    enterFullscreenBtn.click(enterFullscreen);
    exitFullscreenBtn.click(exitFullscreen);

    $(window).resize(function() {
        if ($('#exitFullscreenBtn').is(':visible')) {
            var theHeight = $(window).height() - 30;
            $(".w-e-text-container").get(0).style.setProperty("height", theHeight + "px", "important");
        }

    });
}

function enterFullscreen() {
    $("#enterFullscreenBtn").hide();
    $("#exitFullscreenBtn").show();
    //$(".w-e-text").css("height", "800px");
    var theHeight = $(window).height() - 30;
    $(".w-e-text-container").get(0).style.setProperty("height", theHeight + "px", "important");
    $("#root").css("height", "0px");
    $(".editorElem").css({
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'width': '100%',
        'height': 'auto',
        'z-index': '101',
        'overflow': 'hidden'
    })
}

function exitFullscreen() {
    $("#enterFullscreenBtn").show();
    $("#exitFullscreenBtn").hide();
    $(".w-e-text-container").get(0).style.setProperty("height", "");
    $(".w-e-text").css("height", "100%");
    $("#root").css("height", "");
    $(".editorElem").css({
        'position': '',
        'width': '',
        'height': '',
        'z-index': '',
        'overflow': ''
    })
}

function loadTask() {
    console.log('loadTask');
    chrome.runtime.sendMessage({
        method: 'checkTaskOpenUnique',
        id: taskId
    }, function(response) {
        if (response.success) {
            if (!response.isUnique) {
                alert('当前任务只能打开一个窗口，请关闭其他窗口');
                return;
            }
            chrome.runtime.sendMessage({
                method: 'getTask',
                id: taskId
            }, function(response) {
                if (response.success) {
                    curTask = response.task;
                    if (curTask.status == 'outQueue') {
                        return;
                    }
                    //title
                    $(".edit-title").val(curTask.title);
                    $(".w-e-text").html(curTask.content);
                    var theTime = new Date(curTask.time);

                    $("#year").val(theTime.getFullYear());
                    $("#month").val(theTime.getMonth() + 1);
                    $("#day").val(theTime.getDate());
                    $("#hour").val(theTime.getHours());
                    $("#minute").val(theTime.getMinutes());
                    $("#second").val(theTime.getSeconds());
                    if (curTask.serverTime) {
                        $("#useServerTime")[0].checked = true;
                    } else {
                        $("#useServerTime")[0].checked = false;
                    }
                    $("#startTimer").click();

                }
            })
        }

    })

}

function syncToBihu() {
    var mceContent = getMCEContent(); // tinymce.activeEditor.getContent();
    $('.w-e-text').empty().append($(mceContent));
}

function getMCEContent() {
    var editor = tinymce.activeEditor;
    var mceContent = editor.getContent();
    //console.log($('<div><div>xxfjei</div></div>').html());
    //console.log(editor.getBody().innerHTML);
    //console.log($(mceContent));
    //console.log($(mceContent).html());
    //console.log($(editor.getBody()));
    var body = $(editor.getBody());
    //body.find("P").css({cssText: 'color: red !important;'});
    body.find("P").css({
        'margin-top': '10px'
    });
    body.find("img").css({
        'margin-top': '10px',
        'margin-bottom': '10px'
    });
    body.find("pre").css({
        'background': '#f5f2f0'
    });
    body.find("table").each(function(index) {
        //$(this).get(0).style.removeProperty('border');
        var theDom = $(this).get(0);

        if (theDom.style.border) {
            theDom.style.setProperty('border', theDom.style.border, 'important');
        } else {
            theDom.style.setProperty('border', '2px solid #aaa ', 'important');
        }
        if (theDom.style.width) {
            theDom.style.setProperty('max-width', theDom.style.width, 'important');
        }
    });
    body.find("span").each(function() {
        //$(this).get(0).style.removeProperty('border');
        var theDom = $(this).get(0);
        if (theDom.style['background-color']) {
            //theDom.style.setProperty('background-color', theDom.style['background-color'], 'important');
            theDom.outerHTML = theDom.outerHTML.replace('span', 'strong');
        }
    });
    body.find("p").each(function() {
        //$(this).get(0).style.removeProperty('border');
        var theDom = $(this).get(0);
        if (theDom.style['background-color']) {
            theDom.style.setProperty('background-color', theDom.style['background-color'], 'important');
        }
    });
    body.find("tr").each(function(index) {
        var theDom = $(this).get(0);
        if (index % 2 == 0) {
            theDom.style.setProperty('background', '#DDDDDD');
        } else {
            theDom.style.setProperty('background', 'white');
        }
    });
    body.find("td").each(function(index) {
        //$(this).get(0).style.removeProperty('border');
        var theDom = $(this).get(0);
        if (theDom.style.border) {
            theDom.style.setProperty('border', theDom.style.border, 'important');
        } else {
            theDom.style.setProperty('border', '1px solid #aaa ', 'important');
        }
        if (theDom.style.width) {
            theDom.style.setProperty('max-width', theDom.style.width, 'important');
        }
    });
    //body.find("table").css({cssText: 'border: 1px solid #aaa !important;'});
    //body.find("td").css({'border': '1px solid #aaa'});
    //body.find("table").each(function(){
    //})
    //body.find("td").css({cssText: 'border: 1px solid #aaa !important;'});
    //console.log(body.html());
    //return mceContent;
    return body.html().replace(/span/, 'label');

    //editor.formatter.apply('myTable');

}

function loadTinyMCE() {
    var newForm = $('  <form method="post" id="tinyMCEForm"  >\
        <textarea id="mytextarea" ></textarea>\
        </form>');
    //   $(".edit").prepend(newForm);
    newForm.hide();
    newForm.insertBefore(".add-forum");
    tinymce.init({
        selector: '#mytextarea',
        height: 500,
        theme: 'modern',
        plugins: 'code print preview fullpage  searchreplace autolink directionality   visualchars fullscreen image link media template  table charmap hr pagebreak nonbreaking anchor  insertdatetime advlist lists textcolor wordcount  imagetools  contextmenu colorpicker textpattern  codesample, help',
        //plugins: 'print preview fullpage powerpaste searchreplace autolink directionality advcode visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists textcolor wordcount tinymcespellchecker a11ychecker imagetools mediaembed  linkchecker contextmenu colorpicker textpattern help',
        toolbar1: 'formatselect fontselect fontsizeselect | bold italic strikethrough forecolor backcolor |  alignleft aligncenter alignright alignjustify | fullscreen ',
        toolbar2: ' styleselect template | numlist bullist outdent indent  | link unlink  hr addImage  table |  charmap | removeformat ',
        //font_formats: 'Arial=arial,helvetica,sans-serif;Courier New=courier new,courier,monospace;AkrutiKndPadmini=Akpdmi-n',
        font_formats: 'Arial=arial,helvetica,sans-serif;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Times New Roman=times new roman,times; 宋体=宋体;微软雅黑=微软雅黑;楷体=楷体;仿宋=仿宋;黑体=黑体',
        //font_formats: 'Lato=Lato;Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats',
        fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt 36pt',
        // this not saved with contents//content_style: "p {margin: 10px; border: 5px solid red; padding: 3px}",
        formats: {
            myTable: {
                block: 'p',
                styles: {
                    border: '1px solid #aaa'
                }
            }
        },
        //table_default_styles: {
        //    border: '5px solid #aaa!important'
        //},


        style_formats: [{
            title: '引用',
            block: 'div',
            styles: {
                'font-style': 'normal',
                'font-size': '16px',
                'margin-left': '32px',
                'border-left': '4px solid #CCC',
                'padding-left': '8px'
            }
        }, {
            title: '标注',
            block: 'h1',
            styles: {
                color: '#ffff00',
                background: '#ff0000'
            }
        }, {
            title: '单行方框',
            inline: 'span',
            styles: {
                display: 'inline-block',
                border: '1px solid #2276d2',
                'border-radius': '5px',
                padding: '2px 5px',
                margin: '0 2px',
                color: '#2276d2'
            }
        }, {
            title: '多行方框',
            block: 'div',
            styles: {
                border: '1px solid #2276d2',
                'border-radius': '5px',
                padding: '2px 5px',
                margin: '0 2px',
                color: '#2276d2'
            }
        }],



        //menubar: 'file edit insert view format table tools ',
        image_advtab: true,
        //imagetools_cors_hosts: ['bihu.com','bihu2001.oss-cn-shanghai.aliyuncs.com'],
        templates: [{
            title: '标题',
            content: '<section data-role="outer" label="Powered by 135editor.com" style="font-size:16px;"><section class="_135editor" data-tools="135编辑器" data-id="92235" style="border: 0px none; box-sizing: border-box;"><section data-role="paragraph" class="_135editor" style="border: 0px none; padding: 0px; box-sizing: border-box;"><section style="width:100%;margin: 5px auto;text-align: center;" data-width="100%"><section style="display: inline-block;width: auto"><section style="display: flex;display: -webkit-flex;align-items: center;-webkit-align-items: center;"><section style=" width:60px;"><section style="width:60px;height: 46px;background-image: url(http://image2.135editor.com/cache/remote/aHR0cHM6Ly9tbWJpei5xbG9nby5jbi9tbWJpel9wbmcvdU4xTElhdjdvSjhXazVjWmJ4bjlrQ0g4aWJ1Nm81aWNDZ2dIaWNaUnNWWUZpYlhRcmlhSjE3Ull0bFVpY3FHc29XR0k3SGJ3WTc3cHRrY3g3cG16eE5xZ1QxRUEvMD93eF9mbXQ9cG5n);background-size: 100% auto;background-repeat: no-repeat;"></section></section><section style="margin-left: -50px;margin-top: 5px;"><section style="display: inline-block;width: auto;"><section style="color:#888;" class="135brush" data-brushtype="text"><p style="margin: 0">简约标题样式</p></section></section></section></section></section></section></section></section><p><br></p></section>'
        }, {
            title: '序号2',
            content: '<section data-role="outer" label="Powered by 135editor.com" style="font-size:16px;"><section class="_135editor" data-tools="135编辑器" data-id="92614" style="border: 0px none; box-sizing: border-box;"><section style="width:100%; text-align:center;" data-width="100%"><section style="display:inline-block; background-image:url(http://mpt.135editor.com/mmbiz_png/fgnkxfGnnkSWfkf9Klib9GNb7c3vy1MNaPnPAAhkMEZ2m6fOXB6GPtoVCRTkj8dszgY13QhOUwJ1zRFtLTGyPVw/0?wx_fmt=png); width:40px; height:40px; background-repeat:no-repeat; background-size:100% auto;"><section style="font-size:16px; color:#fff; line-height:36px; width:30px; margin-left:8px; font-weight:500;">0<span class="autonum" data-original-title="" title="">1</span></section></section></section></section><p><br></p></section>'
        }, {
            title: '序号',
            content: '<section data-role="outer" label="Powered by 135editor.com" style="font-size:16px;"><section class="_135editor" data-tools="135编辑器" data-id="89434" style="border: 0px none; box-sizing: border-box;"><section style="text-align:center;"><section style="width:2.5em;height:3em;color:#fff;font-size:1em;line-height:3em;display:inline-block;text-align:center;background-image:url(http://rdn.135editor.com/cache/remote/aHR0cHM6Ly9tbWJpei5xbG9nby5jbi9tbWJpel9naWYvZmdua3hmR25ua1RNTnRHeTdLV2ZDcmRKaWJBWVk2SHRJVU03anV5NVV3WlRxeXduSXRKd2ptZ09BbmxIUDVqMm40aWNzSDNxaG9GQ05tdzV5QVBJc28wUS8wP3d4X2ZtdD1naWY=);background-repeat:no-repeat;background-size:100%;background-position:0"><p class="autonum" style="margin:0" data-original-title="" title="" aria-describedby="tooltip67986">1</p></section></section></section><p><br></p></section>'
        }, {
            title: '引用2',
            content: '<section data-role="outer" label="Powered by 135editor.com" style="font-size:16px;"><section class="_135editor" data-tools="135编辑器" data-id="92585" style="border: 0px none; box-sizing: border-box;"><section style="padding: 10px 0px; box-sizing: border-box;"><section style="width: 100%; border-top: 1px solid rgb(170, 170, 171); border-bottom: 1px solid rgb(170, 170, 171); box-sizing: border-box;" data-width="100%"><section style="width: 45px; padding: 0px 5px; margin-top: -14px; box-sizing: border-box;"><img style="width: 100%;margin-left: -5px;background:#9cdaf5;" src="http://mpt.135editor.com/mmbiz_png/YUyZ7AOL3omsRn2rYnB0VXSuqXvKgXfHo4PKEicZLeASKSwGabOvAicQCWicp3EGjgr90tia56A3Uo9yrQUfFZpqeQ/0?wx_fmt=png" data-width="100%"></section><section style="padding: 0px; font-size: 15px; color: rgb(63, 62, 63); text-align: justify; font-family: 微软雅黑; line-height: 25px; box-sizing: border-box;" class="135brush"><p>不要拿小人的错误来惩罚自己，不要在这些微不足道的事情上折磨浪费自己的宝贵时间。</p></section><section style="display: flex;justify-content: flex-end;"><section style="width: 45px; padding: 0px 5px; margin-bottom: -11px; box-sizing: border-box;"><img style="width: 100%;background:#9cdaf5;margin-left:5px;" src="http://mpt.135editor.com/mmbiz_png/YUyZ7AOL3omsRn2rYnB0VXSuqXvKgXfHo4PKEicZLeASKSwGabOvAicQCWicp3EGjgr90tia56A3Uo9yrQUfFZpqeQ/0?wx_fmt=png" data-width="100%"></section></section></section></section></section><p><br></p></section>'
        }, {
            title: '引用',
            content: '<section data-role="outer" label="Powered by 135editor.com" style="font-size:16px;"><section class="_135editor" data-tools="135编辑器" data-id="89224" style="border: 0px none; box-sizing: border-box;"><section class="layout" style="margin:10px auto;"><section style="width:100%;margin-bottom: -30px;text-align:center;" data-width="100%"><section style="width: 64px; height: 64px; background: rgb(254, 254, 254); border-radius: 50%; margin-right: auto; margin-left: auto; display: inline-block; box-sizing: border-box;"><section data-role="width" style="display:inline-block;width:32px"><img class="assistant" style="margin: 18px 0px 0px;width: 32px !important;" src="http://rdn.135editor.com/cache/remote/aHR0cHM6Ly9tbWJpei5xbG9nby5jbi9tbWJpel9wbmcvZmdua3hmR25ua1FIcmJpYVIwNWliV2pkVGliNXJWemJaUkU3ZjhWY2dja0lWNHRpYVZNdnF1TVlpYVFrSmoyVmZkR3VPMzRaVEdxSXFxanpNa0RmRXNieDlUQS8wP3d4X2ZtdD1wbmc=" width="2rem" height="" border="0" mapurl="" title="" alt=""></section></section></section><section class="135brush" style="font-size: 14px; color: rgb(176, 176, 177); padding: 30px; background-color: rgb(242, 244, 245); border-radius: 10px; margin-top: -16px; box-sizing: border-box;"><p>不要拿小人的错误来惩罚自己，不要在这些微不足道的事情上折磨浪费自己的宝贵时间。</p></section></section></section><p><br></p></section>'
        }, {
            title: '个性标题2',
            content: '<section data-role="outer" label="" style="font-size:16px;"><section   style="border: 0px none; box-sizing: border-box;"><section style="border: 0px; padding: 0px; margin: 0px auto; text-align: center; white-space: normal; box-sizing: border-box;"><section style="display:inline-block;margin:0 auto;text-align:left;height:60px;background-image:url(http://mpt.135editor.com/mmbiz_png/ianq03UUWGmJiaSxH8vWWn83ddYOk9ZQiaGFu9ia6SJYgJSN9DHAaUNF74DhGQpkbVKCFH2t5iaTVgovXoyCu1icLEaA/0?wx_fmt=png);background-size:auto 60px;background-repeat:no-repeat"><section style="display: inline-block; line-height: 85px; color: rgb(255, 255, 255); margin: 0px 0px 0px 40px; padding: 0px 10px; vertical-align: top; font-size: 16px; box-sizing: border-box;"><p class="135brush" data-brushtype="text" style="border:0;padding:0;margin:0">劳动节快乐</p></section></section></section></section><p><br></p><p>n</p></section>'
        }, {
            title: '个性标题1',
            content: '<section data-role="outer" label="Powered by 135editor.com" style="font-size:16px;"><section class="_135editor" data-tools="135编辑器" data-id="89490" style="border: 0px none; box-sizing: border-box;"><section style="width:100%; text-align:center;" data-width="100%"><section style="width:80px; height:68px; background-image:url(http://mpt.135editor.com/mmbiz_png/fgnkxfGnnkQibGBKK8kbFcxAMe29wAkhsnxJIIb7tBibic2rftf7Qk2zpujJ2tYtdUSCxXFIMLFFhUujm2793Khng/0?wx_fmt=png); background-repeat:no-repeat; background-size:100% auto;display:inline-block; overflow:hidden;"><section class="autonum" style="width:30px; height:30px; font-size:20px; color:#f9ba28; margin-left:32px; text-align:center; line-height:30px;" data-original-title="" title="">2</section></section></section></section><p><br></p></section>'
        }, {
            title: '定时发文',
            content: '<p style="text-align:right">本文章由<b>币乎增强插件</b>定时发布</p><p></p>'
        }, {
            title: '版权申明',
            content: '<p style="background:#f5f5dc"><b>版权声明</b><br>本文首发于币乎[作者名];<br>请注意：转载需授权，并保留以上版权声明。<br></p><p></p>'
        }],
        //content_css: [
        //    '//fonts.googleapis.com/css?family=Lato:300,300i,400,400i',
        //    '//www.tinymce.com/css/codepen.min.css'
        //],

        init_instance_callback: function(editor) {

            editor.shortcuts.add("ctrl+e", "居中", function() {
                editor.execCommand("JustifyCenter", false);
            });
            editor.shortcuts.add("ctrl+l", "居左", function() {
                editor.execCommand("JustifyLeft", false);
            });
            editor.shortcuts.add("ctrl+r", "居右", function() {
                editor.execCommand("JustifyRight", false);
            });
            /**
            editor.on('PreProcess', function(e) {
                console.log(e.node);
                tinymce.activeEditor.dom.setStyles(tinymce.activeEditor.dom.select('p'), {'background-color': 'red', 'color': 'green!important'});
 
            });
            */

            // Applying the specified format
            //editor.formatter.apply('myTable');


            /** not fire
              editor.on('SetContent', function(e) {
                  //console.log(e.content);
                  console.log('lalalalal setContent');
                  syncToBihu();
              });
              */
        },
        setup: function(editor) {
            function uploadImg(e) {

                //var mceContent = editor.getContent();
                var mceContent = getMCEContent();
                //$('.w-e-text').empty();
                //var oldImgs = $(mceContent).find('img');
                //var newImgs;
                syncToBihu();

                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                $(".w-e-icon-image").click();

                $(".w-e-icon-upload2").click();

                $(".editorElem").height(0);
                $(".editorElem").show();

                $("input[type=file]").change(checkAddImg);

                var tryCounts = 0;

                function checkAddImg() {
                    tryCounts += 1;
                    if (tryCounts == 1) {
                        return;
                    }
                    console.log('uploading img...+' + tryCounts);
                    if (currentEditor == 'bihu') {
                        return;
                    }
                    var newImgs = $('.w-e-text img');
                    var oldImgs = $(mceContent).find('img')
                    var newImgsSet = new Set();
                    var oldImgsSet = new Set();
                    for (var i = 0; i < newImgs.length; i++) {
                        newImgsSet.add(newImgs[i].src);
                    }
                    for (var i = 0; i < oldImgs.length; i++) {
                        oldImgsSet.add(oldImgs[i].src);
                    }
                    var targetImgs = new Set([...newImgsSet].filter(x => !oldImgsSet.has(x)));
                    //if ($('.w-e-text').html()) {
                    //if (newImgs.length > oldImgs.length) {
                    if (targetImgs.size) {
                        targetImgs.forEach(function(e) {
                            editor.insertContent('<img src=' + e + '>');
                        });
                        //for(var i =0;i<oldImgs)
                        //editor.insertContent($('.w-e-text').html());
                        tryCounts = 0;

                        $(".editorElem").hide();

                        syncToBihu();

                        //var mceContent = editor.getContent();
                        //var imgs = $(mceContent).find('img')
                        //$('.w-e-text').empty();
                        //for(var _i = 0; _i<imgs.length; _i++){
                        //    $('.w-e-text').append(imgs[_i]);
                        // }
                        //$('.w-e-text').empty().append($(mceContent));


                        return;
                    }
                    if (tryCounts == 10) {

                        $(".editorElem").hide();

                        editor.notificationManager.open({
                            text: '上传错误，请重试，或者切换回原始编辑器上传',
                            type: 'error',
                            closeButton: true
                        });
                        tryCounts = 0;
                        return;
                    } else {
                        setTimeout(checkAddImg, 1000);
                    }
                }
                checkAddImg();

            }

            editor.addButton('addImage', {
                icon: 'image',
                tooltip: "上传图片",
                onclick: uploadImg,
            });
        }

    });

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
    if ($("#useServerTime").get(0).checked) {
        //now = now + timeDiff;
        now.setMilliseconds(now.getMilliseconds() + timeDiff);
    }
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
    if (currentEditor != 'bihu') {
        changeEditor();
        $('.w-e-text').focus();
        $('.w-e-text').click();
    }

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
    //$.ajax({async: false, cache: false}).getResponseHeader( 'Date' );
    if ($("#useServerTime").get(0).checked) {

        $.ajax({
            async: false,
            cache: false,
            complete: function(req, textStatus) {
                var dateString = req.getResponseHeader('Date');
                if (dateString.indexOf('GMT') === -1) {
                    dateString += ' GMT';
                }
                var date = new Date(dateString);
                var localTime = new Date();
                timeDiff = date - localTime;
                startLoop();
            }
        })
    } else {
        timeDiff = 0;
        startLoop();
    }


    //startLoop();
}

function addActions() {
    actionsArea = document.createElement('div');
    actionsArea.setAttribute('class', 'areaWrapper');
    actionsArea.innerHTML = "<div style=' border: 1px solid #007bff; border-radius: 3px;padding: 5px;'  > \
    <div class='timeBar'>\
    <span class='alertNote'>本地时间:</span>\
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
    <span>&nbsp;&nbsp;时间校准？</span>\
    <input type='checkbox' id='useServerTime'   />\
    <span style='flex:1'></span>\
    </div> \
    <div class='noteBar'>\
    <div><span class='note alertNote'>【注意0】时间校准只是让发布时间在秒数上与服务器更接近，与时区转换无关，国外同学仍需要按换算时间定时【测试后再用】</span></div>\
    <div><span class='note alertNote'>【注意1】一篇文章待发表，请使用定时发布，保持本页打开状态。</span></div>\
    <div><span class='note alertNote'>【注意2】多篇文章待发表，可加入后台定时计划，本页面可关闭，保持浏览器打开即可。</span></div>\
    </div>\
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

    $('#useServerTime').change(function() {
        if (inLoop) {
            cancel();
        } else {
            /**
            $.ajax({
                async: false,
                cache: false,
                complete: function(req, textStatus) {
                    var dateString = req.getResponseHeader('Date');
                    if (dateString.indexOf('GMT') === -1) {
                        dateString += ' GMT';
                    }
                    var date = new Date(dateString);
                    var localTime = new Date();
                    timeDiff = date - localTime;
                    startLoop();
                }
            })
            */

        }
    })
    //添加定时task
    if (!taskId) {
        var taskBtn = $("<button class='taskBtn'>加入定时计划</button>");
        taskBtn.insertBefore($("#startTimer"));
        taskBtn.click(addTask);
    }

}

function fakePreview(e) {
    if (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
    }
    if (currentEditor == 'tinymce') {
        syncToBihu();
    }
    $(".LoaderButton.edit-preview").click();
}

function fakePublish(e) {
    if (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
    }
    if (currentEditor == 'tinymce') {
        //var mceContent = tinymce.activeEditor.getContent();
        var mceContent = getMCEContent();
        $('.w-e-text').empty().append($(mceContent));
    }
    $(".w-e-text-container").click();
    $(".LoaderButton.edit-ok").click();
}

function addTask() {
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
    //var time = new Date(year, parseInt(month) - 1, day, hour, minute, second);
    //time = time.getFullYear()+'-'+
    //        ('0' + (time.getMonth()+1)).substr(((time.getMonth()+1) + '').length - 1) +'-'+
    //        ('0' + time.getDate()).substr((time.getDate() + '').length - 1) + 
    //        'T'+ ('0' + time.getHours()).substr((time.getHours() + '').length - 1)+ ':'+ ('0' + time.getMinutes()).substr((time.getMinutes() + '').length - 1)+':'+('0' + time.getSeconds()).substr((time.getSeconds() + '').length - 1);
    var time = year + '-' + ('0' + month).substr(month.length - 1) + '-' + ('0' + day).substr(day.length - 1) +
        "T" + ('0' + hour).substr(hour.length - 1) + ':' + ('0' + minute).substr(minute.length - 1) + ':' + ('0' + second).substr(second.length - 1)
    var title = $(".edit-title")[0].value;
    var content; // = $(".w-e-text").html();
    var content_text; // = $(".w-e-text").text();
    if (currentEditor == 'bihu') {
        content = $(".w-e-text").html();
        content_text = $(".w-e-text").text();
    } else {
        //var theTMP = $(tinymce.activeEditor.getContent());
        //content = theTMP.html();
        //content_text = theTMP.text();
        content = getMCEContent();
        content_text = content;
    }
    if (!title) {
        alert('请先输入标题！');
        return;
    }
    if (!content_text) {
        alert('文字内容为空');
        return;
    }

    var serverTime = $("#useServerTime").get(0).checked;
    var status = 'inQueue';
    var board = $(".public-btn.edit-btn").text();
    var boardId = boardMap[board] || 1;
    var imgUrlBase64_id0;
    if ($(".bounceOutUp img")[0]) {
        imgUrlBase64_id0 = $(".bounceOutUp img")[0].src.replace(/http.*img\//, '').replace(/[?].*/, '');
    }
    var task = {
        title,
        content,
        time,
        board,
        boardId,
        imgUrlBase64_id0,
        serverTime,
        status
    }
    //save task
    chrome.runtime.sendMessage({
        method: "addTask",
        task: task
    }, function(response) {
        //console.log(response);
        if (response.success) {
            notify_taskAdded();
            curTask = response.task;
            taskId = response.task.id;
            $("#resStr").text('已加入定时计划,点击插件图标查看!(注：可以关闭本页面，但保持浏览器打开状态)');
            $("#log").show();
            //setTimeout(function() {
            //    $("#log").hide();
            //}, 5000);
        }
    });
}


function notify_taskAdded() {
    var opt = {
        type: "basic",
        title: "币乎增强插件通知",
        message: "您的定时计划已经添加，请保持浏览器开启状态，耐心等待",
        iconUrl: "icon/icon128.png"
    }
    chrome.runtime.sendMessage({
        method: "notification",
        opt: opt,
        id: '' + parseInt(Math.random() * 1000)
    }, function(response) {});
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

//保存草稿功能
function addDraftDom() {
    /**
    var target = $('<div class="draftBar"><button><i class="iconfont">&#xe62a;</i>\
        <span id="changeEditorBtn">切换至TinyMCE编辑器</span></button><div style="flex:1"></div> \
        <a class="draftLog" id="draftLog" style="display:none" target="_blank"></a>\
        <button  id="addDraftBtn"><i class="iconfont">&#xe619;</i>添加草稿</button></div>\
        ');
        */

    var target = $('<div class="draftBar"><div style="flex:1"></div> \
            <a class="draftLog" id="draftLog" style="display:none" target="_blank"></a>\
            <button  id="addDraftBtn"><i class="iconfont">&#xe619;</i>添加草稿</button></div>\
            ');
    //$(".w-e-toolbar").append(target);
    target.insertBefore(".editorElem");
    //target.css('display', 'flex');
    target[0].style.setProperty('display', 'flex', 'important');
    $("#addDraftBtn").click(addDraft);
    //close tinyMCE editor
    //$("#changeEditorBtn").click(changeEditor);
    setInterval(addDraft, 60000, null, true);
    //var testBtn = $("<button>xxx</button>");
    //testBtn.insertBefore(".draftBar");
    //testBtn.click(test);
}

function test() {
    console.log(tinymce);

    setTimeout(function() {
        $(".w-e-icon-image").click();
        setTimeout(function() {
            uploadDom = $(".w-e-up-btn");
            console.log(uploadDom);
            //uploadDom.setAttribute('id','');
            //$("body").append(uploadDom.clone()[0]);
        }, 1000);
    }, 2000);

}

function changeEditor() {

    if (currentEditor == 'bihu') {
        if ($("#tinyMCEForm").length == 0) {
            loadTinyMCE();
        }
        $("#changeEditorBtn").text("切换至币乎编辑器");
        currentEditor = 'tinyMCE';
        //$(".editorElem").hide();
        $(".editorElem").fadeOut();
        //$("#tinyMCEForm").show();
        $("#tinyMCEForm").fadeIn();
        tinymce.activeEditor.setContent($('.w-e-text').html());
    } else {
        $("#changeEditorBtn").text("切换至TinyMCE编辑器");
        currentEditor = 'bihu';
        $(".editorElem").fadeIn();
        $(".editorElem").height("500px");
        $("#tinyMCEForm").fadeOut();
        //var mceContent = tinymce.activeEditor.getContent();
        var mceContent = getMCEContent();
        $('.w-e-text').empty().append($(mceContent));
        $('.w-e-text').focus();
    }
}

function addDraft(e, auto) {
    if (!auto) {
        auto = false;
    }
    if(auto && !config.autoDraft){
        return;
    }
    if (auto && inLoop) {
        return;
    }
    if (!location.href.startsWith('https://bihu.com/edit')) {
        return;
    }
    var title = $(".edit-title")[0].value;
    var content; // = $(".w-e-text").html();
    //var content_text; // = $(".w-e-text").text();
    if (currentEditor == 'bihu') {
        content = $(".w-e-text").html();
        //content_text = $(".w-e-text").text();
    } else {
        //content = tinymce.activeEditor.getContent();
        content = getMCEContent();
    }
    if (!title) {
        if (!auto) {
            alert('请先输入标题！');
            return;
        }
    }
    /**if (!content_text) {
        if (!auto) {
            alert('内容为空');
            return;
        }
    }*/
    var now = new Date();
    var timeStr = parseInt(now.getMonth() + 1) + '-' + now.getDate() + ',' + now.getHours() + ':' + ('0' + now.getMinutes()).substr((now.getMinutes() + '').length - 1);
    var theTime = Date.now();
    var words = $(".w-e-text").text().length;
    var pics = $(".w-e-text img").length;
    //save draft
    var draft = {
        title,
        content,
        theTime,
        words,
        pics,
        timeStr,
        auto
    };
    if (currentEditor != 'bihu') {
        syncToBihu();
    }
    //console.log(draft);
    chrome.runtime.sendMessage({
        method: "saveDraft",
        draft: draft
    }, function(response) {
        //console.log(response);
        if (response.success) {
            if (auto) {
                $("#draftLog").text('自动保存：' + response.draft.timeStr);
            } else {
                $("#draftLog").text('草稿保存时间:' + response.draft.timeStr);
            }
            $("#draftLog").show();
            $("#draftLog").attr("href", "https://bihu.com/edit?draftId=" + response.draft.id);
        }
    });
}

function loadDraft() {
    /**
    var url = window.location.href;
    var reg = new RegExp("(^|&)" + 'draftId' + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (!r) {
        return;
    }
    var draftId = unescape(r[2]);
    //console.log(draftId);
    if (draftId) {
        chrome.runtime.sendMessage({
            method: 'getDraft',
            id: draftId
        }, function(response) {
            //console.log(response);
            if (response.success) {
                var draft = response.result;
                if (draft.title) {
                    $(".edit-title")[0].value = draft.title;
                }
                if (draft.content) {
                    $(".w-e-text").html(draft.content);
                }
                $("#draftLog").text('当前草稿时间：' + draft.timeStr);
                $("#draftLog").show();
            }
        })
    }
    */
    if (!curDraft) {
        return;
    }
    var draft = curDraft;
    if (draft.title) {
        $(".edit-title").val(draft.title);
        console.log($(".edit-title").val());
    }
    if (draft.content) {
        $(".w-e-text").html(draft.content);
    }
    $("#draftLog").text('当前草稿时间：' + draft.timeStr);
    $("#draftLog").show();
}