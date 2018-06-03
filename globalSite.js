$(function() {
    chrome.runtime.sendMessage({
        'method': 'getConfig'
    }, function(response) {
        if (response.success) {
            config = response.config;
            if (config.capBar) {

                addMarketBar();
                refreshBar();
            }
        }
    });
});

function addMarketBar() {
    var bar = "<div id='capBar'>\
    最新币价&nbsp;&nbsp;\<span id='barContent'></span>\
    </div>";

    $("body").prepend(bar);
    $("#capBar").css({
        'width': '100%',
        'background': '#fff',
        'box-shadow': '0 1px 2px 0 rgba(126,126,126,0.2)',
        'border-bottom': '1px solid #ddd',
        'text-align': 'center',
        'font-size': '12px',
    })

}

function refreshBar() {
    console.log('refreshBar');
    var coins = ['KEY'];
    var ids = ['2713']
    var content = '';
    $("#barContent").html('加载中...');
    for (var i in coins) {
        var url = 'https://api.coinmarketcap.com/v2/ticker/' + ids[i] + '/?convert=CNY';
        $.get(url, '', function(res) {
            content = `<span><span style='font-weight:bold'>${coins[i]}&nbsp;&nbsp;</span>${res.data.quotes.CNY.price.toFixed(5)}&nbsp;CNY\
            (${res.data.quotes.USD.price.toFixed(5)}&nbsp;USD) &nbsp;&nbsp;&nbsp;`
            var color = 'green';
            if (res.data.quotes.CNY.percent_change_24h < 0) {
                color = 'red';
            }
            content += `<span style='color:${color}'>${res.data.quotes.CNY.percent_change_24h}%(24h)</span>`;
            if (res.data.quotes.CNY.percent_change_1h < 0) {
                color = 'red';
            }
            content += `&nbsp;&nbsp;&nbsp;<span style='color:${color}'>${res.data.quotes.CNY.percent_change_1h}%(1h)</span>`;
            var theTime = new Date(parseInt(res.metadata.timestamp + '000'));
            var timeStr = theTime.getHours() + ':' + theTime.getMinutes() + ':' + theTime.getSeconds();
            content += `&nbsp;&nbsp;&nbsp;上次更新：${timeStr}`;
            content += `&nbsp;&nbsp;&nbsp;<a target='_blank' href='https://coinmarketcap.com/currencies/key/'>来源</a>`;
            content += '</span>';
            $("#barContent").html(content);
        })
    }

    setTimeout(refreshBar, 60000);

}