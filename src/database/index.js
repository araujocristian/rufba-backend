const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/rufbadb", {
  useNewUrlParser: true,
  useFindAndModify: false
});

mongoose.set("useCreateIndex", true);

mongoose.Promise = global.Promise;

module.exports = mongoose;
