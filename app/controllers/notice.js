/*
微信企业号标签管理
*/

var express = require('express'),
    router = express.Router();
var wxent = require('wechat-enterprise');
var mysql = require('mysql');
var config = require('../../config/config');
var redis = require('redis'),
	client = redis.createClient(6379, 'redis', {});
client.on("error", function (err) {
    console.log("Error " + err);
});

var sa = require('superagent');
var cheer = require('cheerio');
var absolution = require('absolution');

var MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID;

var EventProxy = require('eventproxy');
    

var wxcfg = {
    token: config.notice.token,
    encodingAESKey: config.notice.aesKey,
    corpId: config.qyh.corpId,
    secret: config.qyh.secret,
    agentId: config.notice.agentId
};



    


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
    sa.get('http://www.ynu.edu.cn/xwzx/xygg/index.html').end(function(err, res2){
        if(res2.ok){
            var $ = cheer.load(absolution(res2.text, 'http://www.ynu.edu.cn/xwzx/xygg/'));
            var articles = [];
            $('dl.right ul li').each(function(i, li){
                if(i > 5) return;
                var a = $(li).find('a');
                articles.push({
                    title: a.text().trim(),
                    url: a.attr('href')
                });
            });
            ep.emit('all_articles', articles);
        }
    }).on('error', ep.done('error'));
    
    // 2. 筛选还没被推送过的。
    ep.all('all_articles', function(articles){
        var articlesForSend = [];
        var check_count = 0;
        articles.forEach(function(article) {
            client.get(article.url + ':sended', function(err, sended){
                if(err) ep.throw(err);
                else if(!sended) {
                    articlesForSend.push(article);
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
    ep.all('wxapi', 'articleForSend', 'photoes', function(wxapi, articles, photoes){
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
            }, function (err) {
                if (err) {
                    console.log('error:' + err);
                }
            });
        }
    });
    
    // 6. 连接Mongo数据库，并准备wxapi
    
    var wxapi = require('../models/wxapi')(wxcfg);
    ep.emit('wxapi', wxapi);
    console.log('wxapi is ready');
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