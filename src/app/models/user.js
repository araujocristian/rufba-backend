const mongoose = require("../../database");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true
  },
  registrationNumber: {
    type: Number,
    require: true
  },
  isAdmin: {
    type: Boolean,
    require: true,
  },
  email: {
    type: String,
    unique: true,
    require: true,
    lowercase: true
  },
  password: {
    type: String,
    require: true,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  mealsSent: {
    type: Number,
    default: 0
  },
  reliability: {    //como aumentar esse valor?
    type: Number,
    default: 1.0,
  },
  lastSubmitDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.pre("save", async function(next) {
  
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;

  next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
