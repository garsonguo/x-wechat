'use strict'

var path = require('path')
var util = require('./libs/util')
var wechat_file = path.join(__dirname, './config/wechat.txt')
var config = {
    wechat: {
        appID: 'wx1966f010d41c8301',
        appsecret: 'ff43ca8431e693c6ddd43b53b8d609ba',
        token: 'xiaobog',
        getAccessToken: function() {
            return util.readFileAsync(wechat_file)
        },
        saveAccessToken: function(data) {
            data = JSON.stringify(data)
            return util.writeFileAsync(wechat_file, data)
        }
    }
}

module.exports = config