const mongoose = require("../../database");
const bcrypt = require("bcryptjs");

// a intencao eh haver uma lista de alimentos possiveis sempre na db
// os cardapios serao criados referenciando estes FoodItems
// nao havera copias deles

const FoodItemSchema = new mongoose.Schema({

  name: {
    type: String,
    require: true,
    unique: true,
  },
  vegetarian: {
    type: Boolean,
    require: true
  },
  vegan: {
    type: Boolean,
    require: true,
  },
  description: {      // opcional
    type: String,
  },
  icon: {             // opcional, nome de um arquivo de imagem a ser usado no front
    type: String,
  }

});

const FoodItem = mongoose.model("FoodItem", FoodItemSchema);

module.exports = FoodItem;
