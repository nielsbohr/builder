const {
  getBuilds,
  getSettings,
  postBuildToAgent,
  postRequestStart,
  postRequestFinish,
  pingAgent,
} = require('./requests');

class Server {
  constructor({
    timeout, apiBaseUrl, apiToken, port,
  }) {
    this.config = {
      apiBaseUrl,
      apiToken,
      port,
      timeout: timeout || 20, // seconds
    };
    this.settings = {};
    this.agents = [];
  }

  start() {
    console.log(`server builder listening on port ${this.config.port}`);
    this.getSettings();
    setInterval(this.pingAgents.bind(this), this.config.timeout * 1000);
  }

  pingAgents() {
    for (let i = 0; i < this.agents.length; i += 1) {
      pingAgent(this.agents[i].host, this.agents[i].port)
        .catch(() => this.agents.splice(i, 1));
    }
  }

  getSettings() {
    getSettings(this.config.apiBaseUrl, this.config.apiToken)
      .then(({ data }) => {
        this.settings.id = data.data.id;
        this.settings.repository = data.data.repoName;
        this.settings.command = data.data.buildCommand;
        this.queuing();
      })
      .catch((e) => {
        console.error('get settings error');
        this.retry(this.getSettings);
      });
  }

  registryAgent(host, port) {
    if (this.agents.filter((el) => el.host === host && el.port === port).length === 0) {
      this.agents.push({
        host,
        port,
        status: 'open',
      });
    } else {
      const agent = this.agents.find((el) => el.host === host && el.port === port);
      agent.status = 'open';
      delete agent.buildId;
    }

    console.log(this.agents);
  }

  writeResult({
    id, status, data, duration,
  }) {
    const agent = this.agents.find((el) => el.buildId === id);
    if (agent) {
      agent.status = 'open';
      agent.buildId = null;
      postRequestFinish(this.config.apiBaseUrl, this.config.apiToken,
        id, status, data, duration)
        .catch((e) => console.error(e));
    }
  }

  async utilizeAgents(builds, agents) {
    for (let i = builds.length - 1; i >= 0 && agents.length > 0; i -= 1) {
      if (builds[i].configurationId === this.settings.id) {
        try {
          const agent = agents.pop();
          await postRequestStart(this.config.apiBaseUrl, this.config.apiToken, builds[i].id);
          await postBuildToAgent(agent.host, agent.port, {
            id: builds[i].id,
            repository: this.settings.repository,
            hash: builds[i].commitHash,
            command: this.settings.command,
          });
          agent.status = 'busy';
          agent.buildId = builds[i].id;
        } catch (e) { console.error(e); }
      } else {
        this.getSettings();
      }
    }
  }

  async queuing() {
    try {
      const { data } = await getBuilds(this.config.apiBaseUrl, this.config.apiToken, 10, 0);

      if (data) {
        const builds = data.data.filter((el) => el.status === 'Waiting');
        const agents = this.agents.filter((el) => el.status === 'open');
        if (builds.length > 0 && agents.length > 0) {
          this.utilizeAgents(builds, agents);
        }
      }
    } catch (e) {
      console.error('list error');
    } finally {
      this.retry(this.queuing);
    }
  }

  retry(method, timeout = this.config.timeout) {
    setTimeout(method.bind(this), timeout * 1000);
  }
}

module.exports = { Server };
