const mongodb = require("mongodb");
const Unit = require('../models/unit');
const Menu = require('../models/menu');

module.exports = async (req, res, next) => {

  try {

    const now = new Date(Date.now());

    const allUnits = await Unit.find().populate(['currentMenu']);

    await Promise.all(allUnits.map(async unit => { //aguardar tudo isso aqui ocorrer

      const { currentMenu } = unit;

      //console.log(currentMenu);

      if(currentMenu === undefined || now.getTime() > currentMenu.expiration.getTime()) {

        const menu = await Menu.create({ unit: unit._id, menuItems: [], priceSoldFor: unit.priceCharged });
    
        unit.currentMenu = menu;
    
        await menu.save();
        await unit.save();
      }

    }));

    if(now.getHours() < 10 || now.getHours() >= 22) req.badTime = true;
    else req.badTime = false;

    return next();
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro em request para /model/unit/*' });
  }

};
