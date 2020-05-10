const cors = require('cors');
const express = require('express');
const functions = require('firebase-functions');
const rooms = require('./routes/rooms');

const server = express();

const corsWhitelist = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'http://localhost:5001',
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
  res.send('Hello world!');
});

server.use('/rooms', rooms);

exports.server = functions.https.onRequest(server);
