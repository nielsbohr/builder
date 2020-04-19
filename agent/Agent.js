const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { notifyServer, notifyBuildResult } = require('./requests');

const GIT_URL = 'https://github.com';
const LOCAL_REPOSITORY = './tmp/';

class Agent {
  constructor({
    port, host, serverHost, serverPort, timeout,
  }) {
    this.config = {
      host,
      port,
      serverHost,
      serverPort,
      timeout: timeout || 10, // seconds
    };
    this.settings = {};
    this.agents = [];
    this.cacheBuild = {};
  }

  start() {
    console.log(`Agent listening on port ${this.config.port}`);
    this.notify();
  }

  async notify() {
    try {
      await notifyServer(this.config);
      console.log('successfully connected to the server !');
    } catch (e) {
      console.error('connection to server error');
      this.retry(this.notify);
    }
  }

  async build({
    id, repository, hash, command,
  }) {
    let result;
    let duration = Date.now();
    let success = false;
    try {
      fs.mkdirSync(LOCAL_REPOSITORY, { recursive: true });
      await exec(`git clone ${GIT_URL}/${repository}.git`, {
        cwd: LOCAL_REPOSITORY,
      });
      await exec(`git checkout ${hash}`, {
        cwd: `${LOCAL_REPOSITORY}/${repository.split('/')[1]}`,
      });
      result = await exec(command, {
        cwd: LOCAL_REPOSITORY,
      });

      result = result.stdout;
      success = true;
    } catch (e) {
      result = e.stderr;
    } finally {
      result = JSON.stringify(result);
      duration = Date.now() - duration;
      try { await exec(`rm -rf ${LOCAL_REPOSITORY}/*`); } catch (e) {
        console.error(e);
      }
    }

    this.sendBuild({
      id,
      status: success,
      data: result,
      duration,
    });
  }

  async sendBuild(data = this.cacheBuild) {
    try {
      await notifyBuildResult(this.config, data);
      this.cacheBuild = '';
    } catch (e) {
      this.cacheBuild = data;
      this.retry(this.sendBuild);
    }
  }

  retry(method, timeout = this.config.timeout) {
    setTimeout(method.bind(this), timeout * 1000);
  }
}

module.exports = { Agent };
