'user strict'
var config = require('../config')
var Wechat = require('../wechat/wechat')
var menu = require('./menu')
var wechatApi = new Wechat(config.wechat)
wechatApi.deleteMenu().then(function() {
    console.log(111)
    return wechatApi.createMenu(menu)
}).then(function(msg) {
    console.log(msg)
})
exports.reply = function*(next) {
    var message = this.weixin
    console.log(message)
    if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
            if (message.EventKey) {
                console.log('扫描二维码进来：' + message.EventKey + ' ' + message.ticket)
            }
            this.body = '你订阅了这个微信号'

        } else if (message.Event === 'unsubscribe') {
            console.log('取消关注')
        } else if (message.Event === 'LOCATION') {
            this.body = '地理位置：' + message.Latitude + '/' + message.Longitude + '/' + message.Precision
        } else if (message.Event === 'CLICK') {
            this.body = '点击了菜单' + message.EventKey
        } else if (message.Event === 'SCAN') {
            this.body = '扫描二维码：' + message.EventKey + ' ' + message.Ticket
        } else if (message.Event === 'VIEW') {
            this.body = '你点击了菜单的链接：' + message.EventKey
        } else if (message.Event === 'scancode_push') {
            this.body = '扫码事件:' + message.EventKey
        } else if (message.Event === 'scancode_waitmsg') {
            this.body = '扫码推送中:' + message.EventKey
        } else if (message.Event === 'pic_sysphoto') {
            this.body = '弹出系统拍照:' + message.EventKey
        } else if (message.Event === 'pic_photo_or_album') {
            this.body = '弹出拍照或相机:' + message.EventKey
        }
    } else if (message.MsgType === 'text') {
        var content = message.Content
        var reply = 'nihao' + content
        if (content === '1') {
            reply = '11111'
        } else if (content === '2') {
            reply = '22222'
        } else if (content === '4') {
            var data = yield wechatApi.uploadMaterial('image', __dirname + '../1.png')
            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        } else if (content === '5') {
            var data = yield wechatApi.uploadMaterial('image', __dirname + '../1.png', { type: 'image' })
            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        }
        this.body = reply
    }

    yield next
}