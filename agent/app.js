const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const {
    notifyServer
} = require('../requests');

const config = require('../agent.conf.json');

const app = express();

const { port } = config;

app.use(morgan('dev'));
app.use(bodyParser.json());
app.post('/build', (req, res) => {
    const { id, repository, hash, command } = req.body;
    res.sendStatus(200);

    console.log(id, repository, hash, command);
    // work with build
})

app.use((err, req, res) => {
  console.error(err);

  res.status(500).end('error');
});

app.listen(port, () => {
    console.log(`server builder listening on port ${port}`);

    (function notify(timeout) {
        setTimeout(async () => {
            try {
                await notifyServer(config);
                console.log('successfully connected to the server !')
            } catch(e) {
                console.error('connection to server error')
                notify(10 * 1000) //timeout 10 seconds
            }
        }, timeout)
    })(0);
});

// module.exports = app;