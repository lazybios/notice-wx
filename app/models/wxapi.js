/**
 * 使用access-token-mongo组件和wechat-enterprise-api生成wxapi组件，用于调用微信API
 * Created by 文琪 on 2015/4/22.
 */


var API = require('wechat-enterprise-api');


/*
options参数
    - db 必须。mongoDB数据库连接字符串
    - access_token_col access-token-mongo组件使用的集合的名称，默认为access_tokens
    - corpId 必须。微信企业号的ID
    - secret 必须。微信企业号管理组的secret
    - agentId 必须。调用api的应用的Id
    - expire token的过期时间，默认为7000(毫秒)
*/
module.exports = function (options) {
    var AccessToken = require('access-token-mongo')(options.db, options.access_token_col);


    var wxapi = new API(options.corpId, options.secret, options.agentId,
        function(callback){
            AccessToken.getToken({
                appId: options.corpId,
                appSecret: options.secret
            }, function(err, token){
                callback(null, token);
            })
        },
        function(token, callback){
            AccessToken.saveToken({
                appId: options.corpId,
                appSecret: options.secret,
                expire: options.expire || 7000
            }, token, function(){
                callback(null, token);
            });
        }
    );

    return wxapi;
};