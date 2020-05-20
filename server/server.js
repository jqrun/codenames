const cors = require('cors');
const express = require('express');
const {longPollRouter} = require('./routes/long_poll');
const {roomsRouter} = require('./routes/rooms');

const server = express();
const port = 8080;

const corsWhitelist = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://codenames-273814.web.app',
];
const corsOptions = {
  origin: (origin, callback) => {
      if (!origin || corsWhitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} Not allowed by CORS`));
      }
    }
};

server.use(cors(corsOptions));

server.get('/', (req, res) => {
  res.send('Hello world! This is the codenames server.');
});

server.use('/rooms', roomsRouter);
server.use('/long-poll', longPollRouter);

const listener = server.listen(port, () => {
  console.log('Comenames server is listening...');
});

