const cors = require('cors');
const express = require('express');
const {roomsRouter} = require('./routes/rooms');

const server = express();
const port = 4000;

const corsWhitelist = [
  'http://localhost:3000',
  'http://localhost:3001',
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

server.listen(port);

