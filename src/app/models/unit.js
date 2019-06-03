const mongoose = require("../../database");
const bcrypt = require("bcryptjs");

const UnitSchema = new mongoose.Schema({

  name: {
    type: String,
    require: true,
    unique: true,
  },
  location: {
    type: String,
    require: true,
  },
  currentMenu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
  },
  priceCharged: {
    type: Number,
    require: true,
  },
  queueStatus: {
    type: Number,
  },

});

const Unit = mongoose.model("Unit", UnitSchema);

module.exports = Unit;
