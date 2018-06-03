
$.getJSON("manifest.json", "", function(data) {
    　  //each循环 使用$.each方法遍历返回的数据date
    $("#version").text('V'+data.version);
});

function save_options() {
  var shareAbstract = document.getElementById('shareAbstract').checked;
  var inpageSearch = document.getElementById('inpageSearch').checked;
  var addFav = document.getElementById('addFav').checked;
  var autoPublish = document.getElementById('autoPublish').checked;
  var editorEnhance = document.getElementById('editorEnhance').checked; 
  var reloadIndex = document.getElementById('reloadIndex').checked;
  var bigV = document.getElementById('bigV').checked;
  var manualDraft = document.getElementById('manualDraft').checked;
  var autoDraft = document.getElementById('autoDraft').checked;
  //var quickZan = document.getElementById('quickZan').checked;
  //var autoZanAfterGetLatestArc = document.getElementById('autoZanAfterGetLatestArc').checked;
  var capBar = document.getElementById('capBar').checked;
  var bigVTimeDiff = document.getElementById('bigVTimeDiff').checked;
  var bigVTimeDiffMinutes = parseInt(document.getElementById('bigVTimeDiffMinutes').value);
  if(!bigVTimeDiffMinutes){
    bigVTimeDiffMinutes = 0;
  }
  var config = {
    inpageSearch,addFav,autoPublish,editorEnhance,reloadIndex,bigV,
    manualDraft,autoDraft,shareAbstract,//,quickZan,autoZanAfterGetLatestArc,
    capBar,bigVTimeDiff,bigVTimeDiffMinutes
  }
  chrome.storage.sync.set({
    config: config
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = '设置已保存.';
    setTimeout(function() {
      status.textContent = '';
    }, 2000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get('config', function(res) {
    console.log(res);
    res = res.config;
    console.log(res);
    if(!res){
      return;
    }
    document.getElementById('shareAbstract').checked = res.shareAbstract;
    document.getElementById('reloadIndex').checked = res.reloadIndex;
    document.getElementById('inpageSearch').checked = res.inpageSearch;
    document.getElementById('addFav').checked = res.addFav;
    document.getElementById('autoPublish').checked = res.autoPublish;
    document.getElementById('editorEnhance').checked = res.editorEnhance;
    document.getElementById('bigV').checked = res.bigV;
    document.getElementById('manualDraft').checked = res.manualDraft;
    document.getElementById('autoDraft').checked = res.autoDraft;
    document.getElementById('quickZan').checked = res.quickZan;
    document.getElementById('autoZanAfterGetLatestArc').checked = res.autoZanAfterGetLatestArc;
    document.getElementById('capBar').checked = res.capBar;
    document.getElementById('bigVTimeDiff').checked = res.bigVTimeDiff;
    document.getElementById('bigVTimeDiffMinutes').value = res.bigVTimeDiffMinutes;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
