const express = require('express');
const rooms = require('./rooms');

const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.use('/rooms', rooms);


app.listen(port, () => console.log(`Listening at port ${port}.`));