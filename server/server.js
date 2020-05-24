  const compression = require('compression');
  const cors = require('cors');
  const express = require('express');
  const logger = require('./common/logger');
  const process = require('process');
  const {adminRouter} = require('./routes/admin');
  const {roomsRouter} = require('./routes/rooms');
  const {subscribeRouter} = require('./routes/subscribe');

const ARTIFICIAL_LATENCY = true;

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
    },
  credentials: true,
};

server.use(cors(corsOptions));
server.use(compression());
server.use(async (req, res, next) => {
  logger.reqInfo(req);

  if (ARTIFICIAL_LATENCY && process.env.NODE_ENV !== 'production') {
    await new Promise(resolve => setTimeout(resolve, 200 + (Math.random() * 100)));
  }

  next();
});

server.get('/', (req, res) => {
  res.send('Hello world! This is the codenames server.');
});

server.get('/_ah/warmup', (req, res) => {
  // Warmup for Google App Engine.
  res.status(200).send();
});

server.use('/admin', adminRouter);
server.use('/rooms', roomsRouter);
server.use('/subscribe', subscribeRouter);

const listener = server.listen(process.env.PORT || 8080, () => {
  logger.info('Comenames server is listening...');
});

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection reason:', reason);
  logger.error('Unhandled Rejection p:', p);
});


