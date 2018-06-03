

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('index get a message');
    console.log(message);
    console.log(message.method);
    console.log(message.method == 'prepareLocalStorage');
    if (message.method == 'prepareLocalStorage') {
        console.log('enter if 1');
        saveToLS(message.task, function() {
            console.log('in callback');
            sendResponse({
                'success': true
            });
        });
    }
    return true;
})



function saveToLS(task, callback) {
    console.log('save task');
    console.log(task);
    var logInfo = localStorage.getItem('ANDUI_BIHU_LOGININFO');
    var userId = JSON.parse(logInfo).userId;
    var imgUrls = [];
    if (task.imgUrlBase64_id0) {
        imgUrls = imgUrls.concat(imgUrls, 'img/' + task.imgUrlBase64_id0);
    }
    var savedArt = {
        boardId: task.boardId,
        boardName: task.board,
        editorContent: task.content,
        imgUrlBase64: imgUrls,
        title: task.title
    }
    console.log(savedArt);
    localStorage.setItem('ANDUI_EDIT_' + userId, JSON.stringify(savedArt));
    callback('');
}