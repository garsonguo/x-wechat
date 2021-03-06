'use strict'

var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var _ = require('lodash')
var util = require('./util')
var fs = require('fs')
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    temporary: {
        upload: prefix + 'media/upload?',
        fetch: prefix + 'media/get?'
    },
    permanent: {
        upload: prefix + 'material/add_material?',
        uploadNews: prefix + '/material/add_news?',
        uploadNewsPic: prefix + '/media/uploadimg?',
        fetch: prefix + 'material/get_material?',
        del: prefix + 'material/del_material?',
        update: prefix + 'material/update_news?',
        count: prefix + 'material/get_materialcount?',
        batch: prefix + 'material/batchget_material?'
    },
    menu: {
        create: prefix + 'menu/create?',
        get: prefix + 'menu/get?',
        delete: prefix + 'menu/delete?',
        current: prefix + 'get_current_selfmenu_info?',
    },
    qrcode: {
        create: prefix + 'qrcode/create?',
        show: prefix + 'showqrcode?'
    },
    shortUrl: {
        create: prefix + 'shorturl?'
    },
    ticket: {
        get: prefix + 'ticket/getticket?'
    }
};

//票据
function Wechat(opts) {
    var that = this
    this.appID = opts.appID
    this.appsecret = opts.appsecret
    this.getAccessToken = opts.getAccessToken
    this.saveAccessToken = opts.saveAccessToken
    this.getTicket = opts.getTicket
    this.saveTicket = opts.saveTicket
    this.fetAccessToken()
}
Wechat.prototype.fetAccessToken = function() {
    var that = this
    return this.getAccessToken()
        .then(function(data) {
            try {
                data = JSON.parse(data)
            } catch (e) {
                return that.updateAccessToken()
            }

            if (that.isValidAccessToken(data)) {
                return Promise.resolve(data)
            } else {
                return that.updateAccessToken()
            }
        })
        .then(function(data) {
            that.saveAccessToken(data)
            return Promise.resolve(data)
        })

}
Wechat.prototype.fetchTicket = function(access_token) {
    var that = this
    return this.getTicket()
        .then(function(data) {
            try {
                data = JSON.parse(data)
            } catch (e) {
                return that.updateTicket(access_token)
            }

            if (that.isValidTicket(data)) {
                return Promise.resolve(data)
            } else {
                return that.updateTicket(access_token)
            }
        })
        .then(function(data) {
            that.saveTicket(data)
            return Promise.resolve(data)
        })

}
Wechat.prototype.updateTicket = function(access_token) {
    var appID = this.appID;
    var appsecret = this.appsecret;
    var url = api.ticket.get + '&access_token=' + access_token + '&type=jsapi';

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
Wechat.prototype.isValidTicket = function(data) {
    if (!data || !data.ticket || !data.expires_in) {
        return false
    }
    var ticket = data.ticket
    var expires_in = data.expires_in
    var now = (new Date().getTime())

    if (ticket && now < expires_in) {
        return true
    } else {
        return false
    }
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

//上传文件
Wechat.prototype.uploadMaterial = function(type, filePath, permanent) {
    var that = this
    var form = {}
    var uploadUrl = api.temporary.upload

    if (permanent) {
        uploadUrl = api.permanent.upload
        _.extend(form, permanent)
    }
    if (type === 'pic') {
        uploadUrl = api.permanent.uploadNewsPic
    }

    if (type === 'news') {
        uploadUrl = api.permanent.uploadNews
        form = material
    } else {
        form.media = fs.createReadStream(filePath)
    }
    // var form = {
    //     media: fs.createReadStream(filePath)
    // }

    var appID = this.appID;
    var appsecret = this.appsecret;


    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = uploadUrl + 'access_token=' + data.access_token;
                if (!permanent) {
                    url += '&type=' + type
                } else {
                    form.access_token = data.access_token
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true
                }

                if (type === 'news') {
                    options.body = form
                } else {
                    options.formData = form
                }

                request({ method: 'POST', url: url, formData: form, json: true }).then(function(response) {
                    var _data = response['body']
                    if (_data) {
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

//获取素材
Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
    var that = this
    var form = {}
    var fetchUrl = api.temporary.fetch

    if (permanent) {
        fetchUrl = api.permanent.fetch
    }

    var appID = this.appID;
    var appsecret = this.appsecret;


    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = fetchUrl + 'access_token=' + data.access_token + '&media_id=' + mediaId;
                if (!permanent && type == 'video') {
                    url = url.replace('https://', 'http://')
                    url += '&type=' + type
                }
                resolve(url)
            });
    })

};
//删除素材
Wechat.prototype.deleteMaterial = function(mediaId) {
    var that = this
    var form = {
        media_id: mediaId
    }

    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId;
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                    var _data = response['body']
                    if (_data) {
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

//跟新素材
Wechat.prototype.updateMaterial = function(mediaId, news) {
    var that = this
    var form = {
        media_id: mediaId
    }
    _.extend()


    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId;
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                    var _data = response['body']
                    if (_data) {
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

//素材宗数
Wechat.prototype.countMaterial = function() {
    var that = this

    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = api.permanent.count + 'access_token=' + data.access_token;
                request({ method: 'GET', url: url, json: true }).then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('素材宗数获取失败')
                    }
                }).catch(function(error) {
                    reject(error)
                })
            });
    })

}

//素材列
Wechat.prototype.batchMaterial = function(options) {
    var that = this

    options.type = options.type || 'image'
    options.offset = options.offset || 0
    options.count = options.count || 1

    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = api.permanent.batch + 'access_token=' + data.access_token;
                request({ method: 'POST', url: url, body: options, json: true }).then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('素材宗数获取失败')
                    }
                }).catch(function(error) {
                    reject(error)
                })
            });
    })

};
//创建菜单
Wechat.prototype.createMenu = function(menu) {
    var that = this
    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = api.menu.create + 'access_token=' + data.access_token
                    // console.log(url)
                request({ method: 'POST', url: url, body: menu, json: true }).then(function(response) {
                    var _data = response['body']
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('创建菜单失败')
                    }
                }).catch(function(error) {
                    reject(error)
                })
            });
    })

};
//获取菜单
Wechat.prototype.getMenu = function() {
    var that = this
    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = api.menu.get + 'access_token=' + data.access_token;
                request({ url: url, json: true }).then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('获取菜单失败')
                    }
                }).catch(function(error) {
                    reject(error)
                })
            });
    })

};
//删除菜单
Wechat.prototype.deleteMenu = function() {
    var that = this
    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var access_token = data.access_token
                var url = api.menu.delete + 'access_token=' + access_token
                request({ url: url, json: true }).then(function(response) {
                    var _data = response['body']
                    console.log(_data)
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('删除菜单菜单失败')
                    }
                }).catch(function(error) {
                    reject(error)
                })
            });
    })

};
//获取自定义菜单配置
Wechat.prototype.getCurrentMenu = function(menu) {
    var that = this
    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = api.menu.current + 'access_token=' + data.access_token;
                request({ url: url, json: true }).then(function(response) {
                    var _data = response[1]
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('获取自定义菜单配置失败')
                    }
                }).catch(function(error) {
                    reject(error)
                })
            });
    })

};
//创建二维码
Wechat.prototype.createQrcode = function(qr) {
    var that = this
    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = api.qrcode.create + 'access_token=' + data.access_token;
                request({ method: 'POST', url: url, body: qr, json: true }).then(function(response) {
                    var _data = response['body']
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('创建二维码失败')
                    }
                }).catch(function(error) {
                    reject(error)
                })
            });
    })

};
//获取二维码
Wechat.prototype.showQrcode = function(ticket) {
    return api.qrcode.show + 'ticket=' + encodeURL(ticket);
};
//长连接转短连接
Wechat.prototype.createShortUrl = function(action, url) {
    action = action || 'long2short'
    var that = this
    return new Promise(function(resolve, reject) {
        that.fetAccessToken()
            .then(function(data) {
                var url = api.qrcode.create + 'access_token=' + data.access_token;
                var form = {
                    action: action,
                    long_url: url
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                    var _data = response['body']
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('创建二维码失败')
                    }
                }).catch(function(error) {
                    reject(error)
                })
            });
    })

};
Wechat.prototype.reply = function() {
    var content = this.body
    var message = this.weixin

    var xml = util.tpl(content, message)
    this.status = 200
    this.type = 'application/xml'
    this.body = xml

}

module.exports = Wechat