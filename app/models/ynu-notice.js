/**
 * Created by 文琪 on 2015/3/3.
 * 用于读取云大主页上的通知，并在数据库中保存发送标识。
 */


var MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID;
var array = require('array');
var uuid = require('node-uuid');
var date = require('date-extended');

var sa = require('superagent');
var cheer = require('cheerio');


module.exports = function(connString){
    return {

        /**
         * 从数据库中读取尚未发送的通知
         * @param options
         * @param callback
         */
        getNotSendNotices: function (options, callback) {
            MongoClient.connect(connString, function (err, db) {
                var notice = db.collection('ynu_notices');
                at.find({
                    'sended': false
                }).toArray(function (err, notices) {
                    db.close();
                    callback(err, notices);
                });
            });
        },

        /**
         * 从网页抓取通知，并标记为未发送
         * @param callback
         */
        catchNotices: function (callback) {
            sa.get('http://www.ynu.edu.cn/xwzx/xygg/index.html').end(function(res2){
                if(res2.ok){
                    var $ = cheer.load(res2.text);
                    var articles = [];
                    $('dl.right ul li').each(function(i, li){
                        if(i > 5) return;
                        var a = $(li).find('a');
                        articles.push({
                            title: a.text().trim(),
                            picurl: '',
                            'sended': false,
                            url: a.attr('href')
                        });
                    });

                    MongoClient.connect(connString, function (err, db) {
                        var notices = db.collection('ynu_notices');
                        var count = 0;
                        array(articles).each(function(article){
                            notices.update({
                                url: article
                            }, article, {upsert: true}, function (err, doc) {
                                if(++count === articles.length){
                                    db.close();
                                    callback(err, articles);
                                }
                            });
                        });
                    });
                }
            });
        }
    };
}