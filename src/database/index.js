 const mongoose = require("mongoose");

 mongoose.connect("mongodb://localhost/rufbadb", { useNewUrlParser: true });
 mongoose.set('useCreateIndex', true);

 mongoose.Promise = global.Promise;

 module.exports = mongoose;