const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const {
    getBuilds,
    postBuildToAgent,
    postRequestStart,
    postRequestFinish,
} = require('../requests');

const config = require('../server.conf.json');

const { apiBaseUrl, apiToken, port } = config;

const app = express();

const agents = [];
const timeout = 20 // seconds

app.use(morgan('dev'));
app.use(bodyParser.json());
app.get('/notify-agent', (req, res) => {
    const { host, port } = req.query;

    if (host && port) {
        if (agents.filter(el => el.host === host && el.port === port).length === 0) {
            agents.push({
                host,
                port,
                status: 'open',
            });
        }

        res.sendStatus(200);
        console.log(agents);
    } else res.sendStatus(500);
})

app.post('/notify-build-result', (req, res) => {
    const { id, buildId, status, data, duration } = req.body
    postRequestFinish(buildId, status, data, duration)
        .then(() => {
            agents[id].status = 'open';
            res.sendStatus(200)
        })
        .catch(() => res.sendStatus(500));
})

app.use((req, res, next) => {
    next(`${req.originalUrl} error path`);
})

app.use((err, req, res) => {
  res.send(err);
});

app.listen(port, () => {
    console.log(`server builder listening on port ${port}`);

    setTimeout(builder, 0);
});

function builder() {
    getBuilds(apiBaseUrl, apiToken, 10, 0)
      .then((builds) => {
        // console.log(agents);
        // console.log(builds.data.data);
        const waitingBuilds = builds.data.data.filter(el => el.status === 'Waiting')
            .sort((a, b) => a.buildNumber - b.buildNumber); 
        const openAgents = agents.filter(el => el.status === 'open');
        if (waitingBuilds.length > 0 && openAgents.length > 0) {
            waitingBuilds.forEach(async el => {
                const agent = openAgents.pop();
                try{
                await postRequestStart(apiBaseUrl, apiToken, el.id);
                }catch(e) {console.error(e)}
                await postBuildToAgent(agent.host, agent.port, 
                    el.buildId
                )
                agent.status = 'busy';
            });
        }
      })
      .catch(() => console.error('list error'))
      .finally(() => setTimeout(builder, timeout * 1000));
  }

/* module.exports = app; */