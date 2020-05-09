const express = require('express');
const functions = require('firebase-functions');
const rooms = require('./rooms');

const server = express();

server.get('/', (req, res) => {
  res.send('Hello world!');
});

server.use('/rooms', rooms);

exports.server = functions.https.onRequest(server);
