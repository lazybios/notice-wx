/*
微信企业号标签管理
*/

var express = require('express'),
    router = express.Router();
var wxent = require('wechat-enterprise');
var mysql = require('mysql');
var Notice = require('ynu-notice');
var config = require('../../config/config');
var redis = require('redis'),
	client = redis.createClient(6379, 'redis', {});
client.on("error", function (err) {
    console.log("Error " + err);
});

var EventProxy = require('eventproxy');
    

var wxcfg = {
    token: config.notice.token,
    encodingAESKey: config.notice.aesKey,
    corpId: config.qyh.corpId,
    secret: config.qyh.secret,
    agentId: config.notice.agentId
};

var wxapi = require('wxent-api-redis')(wxcfg.corpId, wxcfg.secret, wxcfg.agentId, config.redis.host, config.redis.port);

    


/*
 微信事件消息处理程序。
    - 返回 function(msg, req, res, next)
        - 接收到正确消息时，返回消息处理结果；
        - 接收到不能处理的消息时，返回“正在建设中”提示
        - 出错时返回错误提示
    - 参数 eventHandlers
    {
        key: function (msg, req, res, next) {
            // 消息处理代码
        }
    }

*/
var handleEvent = function (eventHandlers) {
    return function (msg, req, res, next) {
        try {
            if (eventHandlers[msg.EventKey]) {
                eventHandlers[msg.EventKey](msg, req, res, next);
            } else {
                res.reply('正在建设中：' + msg.EventKey);
            }
        } catch(err){
            res.reply('出现错误，请截图并与管理员联系。\n错误信息：' + err.toString());
        }
    }
};

var handleText = function (textHandlers, sessionName) {
    return function (msg, req, res, next) {
        try {
            if (req.wxsession[sessionName]) {
                textHandlers[req.wxsession[sessionName]](msg, req, res, next);
            } else {
                res.reply('正在建设中~');
            }
        } catch(err){
            res.reply('出现错误，请截图并与管理员联系。\n错误信息：' + err.toString());
        }
    };
};

// 检查是否通知，如有，则向用户发送。
var notice = function(){
    
    var ep = new EventProxy();
        
    // 统一的出错处理
    ep.fail(function(err){
        console.log('something is wrong:' + err);
    });     
    
    // 1. 获取主页上的通知列表
    var notice = new Notice();
    notice.get(5, ep.done('all_articles'));
    
    // 2. 筛选还没被推送过的。
    ep.all('all_articles', function(articles){
        var articlesForSend = [];
        var check_count = 0;
        articles.forEach(function(article) {
            client.get(article.url + ':sended', function(err, sended){
                if(err) ep.throw(err);
                else if(!sended) {
                    articlesForSend.push(article);
                    client.set(article.url + ':sended', true);
                }
                if(++check_count === article.length) ep.emit('articleForSend', articlesForSend);
            });
        });
    });
    
    // 3. 获取通用图片
    var yphoto = require('photo-ynu');
    yphoto.random(function(photoes){
        ep.emit('photoes', photoes);
    }, function(err){
        ep.throw('Ynu Photo Error: '+ err)
    });
    
    // 4. 获取通知中的图片
    // 5. 推送通知
    ep.all('articleForSend', 'photoes', function(articles, photoes){
        if(photoes.length){
            for(var i = 0; i < articles.length; i++){
                articles[i].picurl = photoes[i % photoes.length];
            }
        }
        
        if(articles.length) {
            wxapi.send(config.Notice.toUserTag, {
                msgtype: 'news',
                news: {
                    articles: articles
                },
                safe: '0'
            }, ep.fail('done'));
        }
    });
}

var EventHandlers = {
    /* 获取我创建的任务 */
	'created_by_me': function (msg, req, res, next) {
	}
};

var TextProcessHandlers = {
};


var checkNewNotice = function(){
    notice();
    setTimeout(checkNewNotice, 100000);
};

module.exports = function (app, cfg) {
    // app.use(express.query());
    app.use('/notice', router);

    router.use('/', wxent(wxcfg, wxent.event(handleEvent(EventHandlers))));
    
    checkNewNotice();
};