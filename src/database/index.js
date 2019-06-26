const mongoose = require("mongoose");
const prompt = require('prompt');

const promptAttributes = require("../config/credentials.json");

var connectionString = "mongodb+srv://"+"$user"+":"+"$password"+"@rufba-cluster-epbj9.mongodb.net/test?retryWrites=true&w=majority";

async function getCredentials() {

  await prompt.start();

  await prompt.get(promptAttributes, function (err, result) {

    if (err) {

        console.log(err);
        return 1;

    }else {

        connectMongo(result.username, result.password);
    }

  }); 

  return;
  
};

async function connectMongo(username, password) {

  connectionString = await connectionString.replace("$user", username);
  connectionString = await connectionString.replace("$password", password);

  try {

    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true
    });

    console.log("Authentication successful.");
    
  } catch (err) {
    
    console.log(err);
    return 1;

  }
  
  await mongoose.set("useCreateIndex", true);
  
  mongoose.Promise = global.Promise;

  return;
}

getCredentials();

module.exports = mongoose;
