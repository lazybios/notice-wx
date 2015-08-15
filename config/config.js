/* global process */

var env = process.env.NODE_ENV || 'production';

var config = {
  development: {
    port: 18080,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    }
  },

  production: {
    port: 18080,
    qyh: {
        corpId: process.env.QYH_CORPID,
        secret: process.env.QYH_SECRET
    },
    notice: {
        token: process.env.NOTICE_TOKEN,
        aesKey: process.env.NOTICE_AESKEY,
        agentId: process.env.NOTICE_AGENTID,
        toUserTag: process.env.NOTICE_TOUSER_TAG
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    }
  }
};

module.exports = config[env];
