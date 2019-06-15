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
  expiration: {
    type: Date,
    default: Date.now,
  },
  priceSoldFor: {
    type: Number,
    require: true,
  }
  
});

MenuSchema.pre("save", async function(next) {

  this.expiration.setMilliseconds(0);
  this.expiration.setSeconds(0);
  this.expiration.setMinutes(0);

  if(this.servedAt.getHours() < 10 || this.servedAt.getHours() >= 22) this.expiration.setHours(10);
  else if(this.servedAt.getHours() < 16) this.expiration.setHours(16);
  else this.expiration.setHours(22);

  next();
});

const Menu = mongoose.model("Menu", MenuSchema);

module.exports = Menu;
