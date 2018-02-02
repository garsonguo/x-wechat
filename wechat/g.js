'use strict'

var sha1 = require('sha1')
var getRawBody = require('raw-body')
var Wechat = require('./wechat');
var util = require('./util')

module.exports = function(opts, handler) {
    var wechat = new Wechat(opts)
    return function*(next) {
        var that = this
        var token = opts.token;
        var signature = this.query.signature
        var nonce = this.query.nonce
        var timestamp = this.query.timestamp
        var echostr = this.query.echostr

        var str = [token, nonce, timestamp].sort().join('')
        var sha = sha1(str)

        if (this.method === 'GET') {
            if (sha == signature) {
                this.body = echostr + ''
            } else {
                this.body = 'wrong'
            }
        } else if (this.method === 'POST') {
            if (sha !== signature) {
                this.body = 'wrong'
                return false
            }
            var data = yield getRawBody(this.req, {
                length: this.length,
                limit: '1mb',
                encoding: this.charset
            })

            var content = yield util.parseXMLAsync(data)

            //console.log(content);
            /*
            { xml:
                { ToUserName: [ 'gh_9ee12e977304' ],
                    FromUserName: [ 'o5Sa20iYAs5S-MXKuQT3rDpkmWcQ' ],
                    CreateTime: [ '1517477073' ],
                    MsgType: [ 'event' ],
                    Event: [ 'subscribe' ],
                    EventKey: [ '' ] 
                }
            }
            */

            //去掉数字符号
            var message = util.formatMessage(content.xml)

            //console.log(message);
            /*
            { 
                ToUserName: 'gh_9ee12e977304',
                FromUserName: 'o5Sa20iYAs5S-MXKuQT3rDpkmWcQ',
                CreateTime: '1517477073',
                MsgType: 'event',
                Event: 'subscribe',
                EventKey: '' 
            }
            */
            // if (message.MsgType === 'event') {
            //     if (message.Event === 'subscribe') {
            //         var now = new Date().getTime();

            //         that.status = 200;
            //         that.type = 'application/xml';
            //         //注意格式   格式不对会报错
            //         //var replay = `<xml><ToUserName><![CDATA[${message.FromUserName}]]></ToUserName><FromUserName><![CDATA[${message.ToUserName}]]></FromUserName><CreateTime>${now}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[你好]]></Content></xml>`
            //         var replay = `<xml>
            //         <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
            //         <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
            //         <CreateTime>${now}</CreateTime>
            //         <MsgType><![CDATA[text]]></MsgType>

            //             <Content><![CDATA[你好]]></Content>

            //         </xml>`
            //         console.log(replay)
            //         that.body = replay
            //         return
            //     }
            // }
            this.weixin = message

            yield handler.call(this, next)

            wechat.reply.call(this)
        }
    }
}