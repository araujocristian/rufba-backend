const mongoose = require("../../database");
const bcrypt = require("bcryptjs");

// Menu e o cardapio, tem uma lista de MenuItems, uma Unidade
// A data em que foi servido e o preco pelo que foi vendido
// A ideia é que sejam armazenados os ultimos cardapios
// de algum periodo de tempo para fins de consulta por parte
// dos usuarios
// lembrar que o preco do RU pode mudar um dia, por isso tem valor ai

const MenuSchema = new mongoose.Schema({

  menuItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  }],
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    ref: 'Unit',
  },
  servedAt: {
    type: Date,
    default: Date.now,
  },
  priceSoldFor: {
    type: Number,
    require: true,
  }
  
});

const Menu = mongoose.model("Menu", MenuSchema);

module.exports = Menu;
