'use strict'

var Koa = require('koa')
var wechat = require('./wechat/g')
var config = require('./config')
var weixin = require('./wx/reply')
var crypto = require('crypto')
var app = new Koa();
var Wechat = require('./wechat/wechat')
var ejs = require('ejs')
var heredoc = require('heredoc')
var tpl = heredoc(function() {
    /*
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>看电影</title>
    </head>

    <body>
    <h1>点击标题，开始录音</h1>
    <p id="title"></p>
    <div id="poster"></div>
    <script src="http://www.zeptojs.cn/skin/zepto-docs.min.js"></script>
    <script src="http://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
    <script>
    wx.config({
        debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        appId: 'wx1966f010d41c8301', // 必填，公众号的唯一标识
        timestamp: '<%= timestamp %>', // 必填，生成签名的时间戳
        nonceStr: '<%= noncestr %>', // 必填，生成签名的随机串
        signature: '<%= signature %>',// 必填，签名
        jsApiList: ['startRecord','stopRecord','onVoiceRecordEnd','translateVoice'] // 必填，需要使用的JS接口列表
    });
    </script>
    </body>

    </html>
        */
})

var createNonce = function() {
    return Math.random().toString(36).substr(2, 15)
}
var createTimestamp = function() {
    return parseInt(new Date().getTime() / 1000, 10) + ''
}
var _sign = function(noncestr, ticket, timestamp, url) {
    var params = [
        'noncestr=' + noncestr,
        'jsapi_ticket=' + ticket,
        'timestamp=' + timestamp,
        'url=' + url
    ]
    var str = params.sort().join('&')
    var shasum = crypto.createHash('sha1')

    shasum.update(str)

    return shasum.digest('hex')
}

function sign(ticket, url) {
    var noncestr = createNonce()
    var timestamp = createTimestamp()
    var signature = _sign(noncestr, ticket, timestamp, url)

    return {
        noncestr: noncestr,
        timestamp: timestamp,
        signature: signature
    }
}
app.use(function*(next) {
    if (this.url.indexOf('/movie') > -1) {
        var wechatApi = new Wechat(config.wechat)

        var data = yield wechatApi.fetAccessToken()
        var access_token = data.access_token

        var ticketData = yield wechatApi.fetchTicket(access_token)
        var ticket = ticketData.ticket
        var url = "http://xiaobog.vicp.io:37001" + this.url
        var params = sign(ticket, url)

        this.body = ejs.render(tpl, params)

        return next
    }

    yield next
})
app.use(wechat(config.wechat, weixin.reply))

app.listen(3000)