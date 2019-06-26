const mongodb = require("mongodb");
const Unit = require('../models/unit');
const Menu = require('../models/menu');
const User = require('../models/user');

function compareMenuItems(first, second) {return second.trustValue - first.trustValue}

module.exports = async (req, res, next) => {

  try {

    const now = new Date(Date.now());

    const allUnits = await Unit.find().populate(['currentMenu']);

    await Promise.all(allUnits.map(async unit => { //aguardar tudo isso aqui ocorrer

      const { currentMenu } = unit;

      //console.log(currentMenu);

      if(currentMenu === undefined || now.getTime() > currentMenu.expiration.getTime()) {

        //////////////////////////
        if(currentMenu !== undefined) {

          const userList = await User.find().populate(['lastSubmission']);

          unit.currentMenu.menuItems.sort(compareMenuItems);

          userList.forEach(async user => {

            var goodContribution = false;
            var isPresent = false;

            if(user.lastSubmission.unit.name == unit.name &&
               user.lastSubmission.expiration.getTime() == unit.currentMenu.expiration.getTime()) {

              goodContribution = true;

              for (let i = 0; i < user.lastSubmission.menuItems.length; i++) {

                const userItem = user.lastSubmission.menuItems[i];
                
                isPresent = false;

                for (let j = 0; j < unit.currentMenu.menuItems.length && j < 8; j++) {
                  const menuItem = unit.currentMenu.menuItems[j];
                  
                  if(userItem.foodItem.name == menuItem.foodItem.name) isPresent = true;

                  if(isPresent) break;
                }
                
                if(!isPresent) {
                  goodContribution = false;
                  break;
                }
              }
            }
            
            if(goodContribution) {

              user.reliability += 1/20;
              await user.save();
            }

          });
        }
        //////////////////////////

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
