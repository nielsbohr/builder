const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { Server } = require('./Server');

const config = require('./server.conf.json');

const app = express();

const server = new Server({
  ...config,
  timeout: 20,
});

app.use(morgan('dev'));
app.use(bodyParser.json());
app.get('/notify-agent', (req, res) => {
  const { host, port } = req.query;

  if (host && port) {
    server.registryAgent(host, port);

    res.sendStatus(200);
  } else res.sendStatus(500);
});

app.post('/notify-build-result', (req, res) => {
  server.writeResult(req.body);
  res.sendStatus(200);
});

app.use((req, res, next) => {
  next(`${req.originalUrl} error path`);
});

app.use((err, req, res) => {
  res.send(err);
});

app.listen(server.config.port, () => {
  server.start();
});
