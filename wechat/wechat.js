'use strict'

var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var util = require('./util')
var fs = require('fs')
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    upload: prefix + 'media/upload?'
};

//票据
function Wechat(opts) {
    var that = this
    this.appID = opts.appID
    this.appsecret = opts.appsecret
    this.getAccessToken = opts.getAccessToken
    this.saveAccessToken = opts.saveAccessToken

    this.fetAccessToken()
}
Wechat.prototype.fetAccessToken = function(data) {
    var that = this
    if (this.access_token && this.expires_in) {
        if (this.isValidAccessToken(this)) {
            return Promise.resolve(this)
        }
    }
    this.getAccessToken()
        .then(function(data) {
            try {
                data = JSON.parse(data)
            } catch (e) {
                return that.updateAccessToken(data)
            }

            if (that.isValidAccessToken(data)) {
                return Promise.resolve(data)
            } else {
                return that.updateAccessToken()
            }
        }).then(function(data) {
            that.access_token = data.access_token
            that.expires_in = data.expires_in

            that.saveAccessToken(data)

            return Promise.resolve(data)
        })
}
Wechat.prototype.isValidAccessToken = function(data) {
    if (!data || !data.access_token || !data.expires_in) {
        return false
    }
    var access_token = data.access_token
    var expires_in = data.expires_in
    var now = (new Date().getTime())

    if (now < expires_in) {
        return true
    } else {
        return false
    }
}
Wechat.prototype.updateAccessToken = function(data) {
    var appID = this.appID;
    var appsecret = this.appsecret;
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appsecret;

    return new Promise(function(resolve, reject) {
        request({ url: url, json: true }).then(function(response) {
            var data = response['body']
            var now = (new Date().getTime())
            var expires_in = now + (data.expires_in - 20) * 1000

            data.expires_in = expires_in

            resolve(data)
        })
    })

}

//上传临时文件
Wechat.prototype.uploadMaterial = function(type, filePath) {
    var that = this
    var form = {
        media: fs.createReadStream(filePath)
    }

    var appID = this.appID;
    var appsecret = this.appsecret;


    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = api.upload + 'access_token=' + data.access_token + '&type=' + type;
                request({ method: 'POST', url: url, formData: form, json: true }).then(function(response) {
                    var _data = response['body']
                    if (_data) {
                        console.log(_data)
                        console.log('上传成功')
                        resolve(_data)
                    } else {
                        throw new Error('上传失败')
                    }
                }).catch(function(error) {
                    console.log('上传有错误发生')
                    reject(error)
                })
            });
    })

}
Wechat.prototype.reply = function() {
    var content = this.body
    var message = this.weixin

    var xml = util.tpl(content, message)
        // console.log(xml)
    this.status = 200
    this.type = 'application/xml'
    this.body = xml

}

module.exports = Wechat