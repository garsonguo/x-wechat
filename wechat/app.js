'use strict'

var Koa = require('koa');
var sha1 = require('sha1')

var config = {
    wechat: {
        appID: 'wx1966f010d41c8301',
        appsecret: 'ff43ca8431e693c6ddd43b53b8d609ba',
        token: 'xiaobog'
    }
}

var app = new Koa();
app.use(function*(next) {
    console.log(this.query);
    var token = config.wechat.token;
    var signature = this.query.signature
    var nonce = this.query.nonce
    var timestamp = this.query.timestamp
    var echostr = this.query.echostr

    var str = [token, nonce, timestamp].sort().join('')
    var sha = sha1(str)
    console.log(sha)
    console.log(signature)
    if (sha == signature) {
        this.body = echostr + ''
    } else {
        this.body = 'wrong'
    }
})

app.listen(3000)
console.log('listening 3000')