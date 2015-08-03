/* global process */

var env = process.env.NODE_ENV || 'production';

var config = {
  development: {
    port: 18080,
    mongoClientConfig: {
        server: {
            poolSize: 5,
            socketOptions: { autoReconnect: true }
        }
    },
    db: 'mongodb://127.0.0.1/ynu'
  },

  production: {
    mongoClientConfig: {
        server: {
            poolSize: 10,
            socketOptions: { autoReconnect: true }
        }
    },
    port: 18080,
    db: process.env.MONGO_URI,
    wss_db: process.env.WSS_DB_URI,
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
