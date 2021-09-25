const express = require('express');
const morgan = require('morgan');

const api = require('./api');

const app = express();
const port = process.env.PORT || 8000;

const { connectToDb } = require('./lib/mongo');
const { connectToRabbitMQ } = require('./lib/rabbitmq');

const { getPhotoDownloadStreamByFilename } = require('./api/photos');
//const { connect } = require('mongodb');

app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

app.use('/', api);

app.get('/media/images/:filename', (req, res, next) => {
  console.log("== input is: ", req.params.filename);
  getPhotoDownloadStreamByFilename(req.params.filename)
    .on('file', (file) => {
      res.status(200).type(file.metadata.contentType);
    })
    .on('error', (err) => {
      if (err.code === 'ENOENT') {
        next();
      } else {
        next(err);
      }
    })
    .pipe(res);
});

app.use('*', (err, req, res, next) => {
  console.error(err);
  res.status(500).send({
    error: "An error occurred. Try it again."
  })
});

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

// Before connect to our server, we have to connect to our queue
connectToDb(async() => {
  await connectToRabbitMQ('photos');
  app.listen(port, function () {
    console.log("== Server is running on port", port);
  });
});

var { graphql, buildSchema } = require('graphql');
 
var schema = buildSchema(`
  type Query {
    hello: String
  }
`);
 
var root = { hello: () => 'Hello world!' };
 
graphql(schema, '{ hello }', root).then((response) => {
  console.log(response);
});