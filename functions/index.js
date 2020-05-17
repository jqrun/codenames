const cors = require('cors');
const express = require('express');
const functions = require('firebase-functions');
const roomsRouter = require('./routes/rooms');
const {longPollRouter} = require('./routes/long_poll');

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
  res.send('Hello world! This is the codenames server.');
});

server.use('/rooms', roomsRouter);
server.use('/long-poll', longPollRouter);

exports.server = functions.https.onRequest(server);

/** FIRESTORE TRIGGERS **/
// exports.notifyUsersUpdate = functions.firestore
//     .document('rooms/{roomId}/users/{userId}')
//     .onWrite((change, context) => {
//       const {roomId} = context.params;
//       // database.publish({roomId, collection: 'users'});
//       console.log('USERS UPDATED');
//     });

