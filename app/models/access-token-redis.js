var moment = require('moment');
var EventProxy = require('eventproxy');

var redis = require('redis'),
	client = redis.createClient(6379, 'redis', {});
client.on("error", function (err) {
    console.log("Error " + err);
});


/**
 * @returns {{getToken: Function, saveToken: Function}}
 */
module.exports = function(){
    return {
        
        // 获取指定的AccessToken
        /**
         * @param options
         * 指定参数。
         * appId
         * appSecret
         * expire 过期时间，默认为7000秒
         * @param callback
         */
        getToken: function (options, callback) {
            client.get(options.appId +'.expire', function(err, date){
                if(err || !date) callback('err');            
                else if(moment().isBefore(date)) {                                // 还在有效期内
                    client.get(options.appId + '.token', function(err, token){
                        if(err || !token) callback('error');
                        else callback(err, token);
                    });
                } else callback('err');
            })
            
        },
        saveToken: function (options, token, callback) {
            options.expire = options.expire || 7000;
            
            client.set(options.appId + '.token', token);
            client.set(options.appId + '.expire', moment().add(options.expire, 's'));
            callback(null, token);
        }
    };
}