/* global process */

var env = process.env.NODE_ENV || 'production';

var config = {
  development: {
    port: 18080,
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
    }
  }
};

module.exports = config[env];
