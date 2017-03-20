const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
require('mockgoose')(mongoose).then(function () {
  console.log('Using mockgoose for tests.');
  mongoose.connect('mongodb://localhost/test');
});

