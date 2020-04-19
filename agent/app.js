const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const config = require('./agent.conf.json');
const { Agent } = require('./Agent');

const app = express();

const agent = new Agent({
  ...config,
  timeout: 10,
});

app.use(morgan('dev'));
app.use(bodyParser.json());
app.get('/ping', (req, res) => res.send('pong'));
app.post('/build', async (req, res) => {
  res.sendStatus(200);

  agent.build(req.body);
});

app.use((err, req, res) => {
  console.error(err);

  res.status(500).end('error');
});

app.listen(agent.config.port, () => {
  agent.start();
});
