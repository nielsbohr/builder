const https = require('https');
const axios = require('axios');

const { API_URL, TOKEN } = process.env;

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

const getBuilds = (API_URL, TOKEN, limit = 10, offset = 0) => instance({
  method: 'get',
  url: `${API_URL}/build/list?limit=${limit}&offset=${offset}`,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  }
});

const postBuildToAgent = (host, port, buildId, repository, hash, command) => instance({
  method: 'post',
  url: `http://${host}:${port}/build`,
  data: {
    buildId,
    repository,
    hash,
    command,
  },
})

const postRequestStart = (API_URL, TOKEN, id) => instance({
  method: 'post',
  url: `${API_URL}/build/start`,
  data: {
    buildId: id,
    dateTime: new Date().toISOString(),
  },
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
});

const postRequestFinish = (API_URL, TOKEN, id, status, data, duration) => instance({
  method: 'post',
  url: `${API_URL}/build/finish`,
  data: {
    buildId: id,
    success: status,
    duration,
    buildLog: data,
  },
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
});

const notifyServer = ({serverHost, serverPort, host, port}) => instance({
  method: 'get',
  url: `http://${serverHost}:${serverPort}/notify-agent?host=${host}&port=${port}`,
})

module.exports = {
  getBuilds,
  notifyServer,
  postBuildToAgent,
  postRequestStart,
  postRequestFinish,
};