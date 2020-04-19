const https = require('https');
const axios = require('axios');

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

const getSettings = (API_URL, TOKEN) => instance({
  method: 'get',
  url: `${API_URL}/conf`,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
});

const getBuilds = (API_URL, TOKEN, limit = 10, offset = 0) => instance({
  method: 'get',
  url: `${API_URL}/build/list?limit=${limit}&offset=${offset}`,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
});

const postBuildToAgent = (host, port, data) => instance({
  method: 'post',
  url: `http://${host}:${port}/build`,
  data,
});

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
    success: Boolean(status),
    duration,
    buildLog: data,
  },
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
});

const pingAgent = (host, port) => instance({
  method: 'get',
  url: `http://${host}:${port}/ping`,
});

module.exports = {
  getBuilds,
  getSettings,
  postBuildToAgent,
  postRequestStart,
  postRequestFinish,
  pingAgent,
};
