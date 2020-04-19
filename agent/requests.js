const https = require('https');
const axios = require('axios');

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

const notifyServer = ({
  serverHost, serverPort, host, port,
}) => instance({
  method: 'get',
  url: `http://${serverHost}:${serverPort}/notify-agent?host=${host}&port=${port}`,
});

const notifyBuildResult = ({ serverHost, serverPort }, data) => instance({
  method: 'post',
  url: `http://${serverHost}:${serverPort}/notify-build-result`,
  data,
});

module.exports = {
  notifyServer,
  notifyBuildResult,
};
