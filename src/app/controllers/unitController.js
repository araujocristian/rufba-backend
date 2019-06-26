const express = require("express");
const authMiddleware = require("../middlewares/auth");
const FoodItem = require('../models/fooditem');
const Unit = require('../models/unit');
const Menu = require('../models/menu');
const MenuItem = require('../models/menuitem');
const mongodb = require("mongodb");
const menuMiddleware = require('../middlewares/menuHandler');
const User = require("../models/user");

const router = express.Router();

router.use(authMiddleware);
router.use(menuMiddleware);

const adminRelevance = 10;
const maxTrustedItems = 8;
const minTrustThreshold = 5;

function compareMenuItems(first, second) {return second.trustValue - first.trustValue}

// listar todos as unidades cadastradas no sistema
router.get("/unit", async (req, res) => {

  try {

    const units = await Unit.find();

    return res.send({ units });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro inesperado na listagem de unidades.' });

  }

});

// recuperar uma unidade especifica
router.get("/unit/:unitNameOrId", async (req, res) => {

  try {

    var unit;

    if(mongodb.ObjectID.isValid(req.params.unitNameOrId)) {

      unit = await Unit.findById(req.params.unitNameOrId);

    } else {

      unit = await Unit.findOne({ name: req.params.unitNameOrId });
    }

    if(!unit) return res.status(400).send({ erro: 'Unidade não encontrada' });
    else return res.send({ unit });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro inesperado na busca da Unidade.' });

  }

});

// recuperar apenas alimentos relevantes do cardápio
router.get("/unit/:unitNameOrId/menu", async (req, res) => {

  try {

    var unit;

    if(mongodb.ObjectID.isValid(req.params.unitNameOrId)) {

      unit = await Unit.findById(req.params.unitNameOrId).populate({

        path: 'currentMenu',
  
        populate: {
  
          path: 'menuItems',
  
          populate: { path: 'foodItem' }
        }
  
      });

    } else {

      unit = await Unit.findOne({ name: req.params.unitNameOrId }).populate({

        path: 'currentMenu',
  
        populate: {
  
          path: 'menuItems',
  
          populate: { path: 'foodItem' }
        }
  
      });
    }

    if(!unit) return res.status(400).send({ erro: 'Unidade não encontrada' });

    const { menuItems } = unit.currentMenu;
    menuItems.sort(compareMenuItems);

    var trustedItems = [];

    for (let index = 0; index < maxTrustedItems && index < menuItems.length; index++) {

      if(menuItems[index].trustValue >= minTrustThreshold) {

        if(menuItems[index].availability <= -5) menuItems[index].availability = false;
        else menuItems[index].availability = true;

        trustedItems.push(menuItems[index]);
      }
    }

    return res.send({trustedItems});
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro inesperado na busca da Unidade.' });

  }

});

// criar uma unidade
router.post("/unit", async (req, res) => {

  if(req.isAdmin) {

    try {

      const { name, location, priceCharged } = req.body;
      if(await Unit.findOne({ name }))
        return res.status(400).send({ erro: 'Unidade já existe no sistema.' });
      
      const unit = await Unit.create({ name, location, priceCharged, queueStatus: 0 });

      //const menu = await Menu.create({ unit: unit._id, menuItems: [], priceSoldFor: unit.priceCharged });

      //unit.currentMenu = menu;

      //await menu.save();
      await unit.save();

      return res.send({ unit });
      
    } catch (err) {
      
      console.log(err);
      return res.status(500).send({ erro: 'Não foi possível cadastrar unidade. Erro inesperado.' });

    }
  
  } else {

    return res.status(401).send({ error: 'Você não possui autorização para cadastrar unidades.' });
  }

});

// atualizar dados da unidade
router.put("/unit/:unitNameOrId/data", async (req, res) => {

  if(req.isAdmin) {

    try {

      const { name, location, priceCharged, queueStatus } = req.body;

      var unit;

      if(mongodb.ObjectID.isValid(req.params.unitNameOrId)) {

        unit = await Unit.findByIdAndUpdate(req.params.unitNameOrId, {
          name,
          location,
          priceCharged,
          queueStatus
        }, { new: true });

      } else {

        unit = await Unit.findOneAndUpdate({ name: req.params.unitNameOrId }, {
          name,
          location,
          priceCharged,
          queueStatus
        }, { new: true });
      }

      if(!unit) return res.status(400).send({ erro: 'Unidade não encontrada' });
      else return res.send({ unit });
      
    } catch (err) {
      
      console.log(err);
      return res.status(500).send({ erro: 'Não foi possível atualizar dados. Erro inesperado.' });

    }
  
  } else {

    return res.status(401).send({ error: 'Você não possui autorização para atualizar unidades.' });
  }

});

// atualizar cardápio
router.put("/unit/:unitNameOrId/menu", async (req, res) => {

  try {

    if(req.badTime) return res.status(400).send({ erro: 'Não é permitido enviar formulários nesse horário' });

    user = await User.findById(req.userId).populate(['lastSubmission']);

    var reliability;
    if(req.isAdmin) reliability = user.reliability*adminRelevance;
    else reliability = user.reliability;

    var unit;

    if(mongodb.ObjectID.isValid(req.params.unitNameOrId)) {
  
      unit = await Unit.findById(req.params.unitNameOrId).populate({

        path: 'currentMenu',
  
        populate: {
  
          path: 'menuItems',
  
          populate: { path: 'foodItem' }
        }
  
      });
  
    } else {
  
      unit = await Unit.findOne({ name: req.params.unitNameOrId }).populate({

        path: 'currentMenu',
  
        populate: {
  
          path: 'menuItems',
  
          populate: { path: 'foodItem' }
        }
  
      });
    } 

    if(!unit) return res.status(400).send({ erro: 'Unidade não encontrada' });

    if(user.lastSubmission.expiration.getTime() == unit.currentMenu.expiration.getTime()) 
      return res.status(400).send({ erro: 'Usuário já contribuiu neste horário, não é permitido fazer isso mais de uma vez' });
    
    const { menuItems } = req.body;

    const userMenu = await Menu.create({ menuItems: [], unit: unit._id,  priceSoldFor: unit.priceCharged});

    await Promise.all(menuItems.map(async menuItem => { //aguardar tudo isso aqui ocorrer

      const { name, availability } = menuItem;
      const food = await FoodItem.findOne({ name });

      const userItem = await MenuItem.create({ menu: unit.currentMenu._id, foodItem: food._id, trustValue: reliability });
      userMenu.menuItems.push(userItem);

      if(!food) {

        //console.log('Alimento não encontrado.');

      } else {

        var exists = false;
        await unit.currentMenu.menuItems.forEach(element => {

          //console.log({ id1: element.foodItem.name, id2: food.name});

          if(element.foodItem.name == food.name) {

            exists = true;
            element.trustValue += reliability;
            if(!availability) element.availability -= reliability;
            element.save();
          }

        });

        if(!exists) {
          
          const item = await MenuItem.create({ menu: unit.currentMenu._id, foodItem: food._id, trustValue: reliability });
          unit.currentMenu.menuItems.push(item);
        
        }
      }

    }));

    user.lastSubmission = userMenu;

    user.mealsSent += 1;

    await userMenu.save();
    await user.save();
    await unit.currentMenu.save();
    await unit.save();

    //const temp = await User.findById(req.userId).populate(['lastSubmission']);

    //console.log(temp);

    return res.send({ unit });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Não foi possível atualizar cardápio. Erro inesperado.' });

  }

});

// deletar uma unidade especifica
router.delete("/unit/:unitNameOrId", async (req, res) => {

  if(req.isAdmin) {

    try {

      var unit;

      if(mongodb.ObjectID.isValid(req.params.unitNameOrId)) {
      
        unit = await Unit.findById(req.params.unitNameOrId);
      
      } else {
      
        unit = await Unit.findOne({ name: req.params.unitNameOrId });
      }

      if(!unit) {

        return res.status(400).send({ erro: 'Unidade não existe.' });

      } else {

        unit.currentMenu.menuItems = [];
        await MenuItem.deleteMany({ menu: unit.currentMenu._id }); //remover todos os itens do menu
        await Menu.findByIdAndDelete(unit.currentMenu._id); //remover o menu atualmente associados a essa unidade
        await Unit.findByIdAndDelete(unit._id); //remover a unidade solicitada

        return res.send();
      }
      
    } catch (err) {
      
      console.log(err);
      return res.status(500).send({ erro: 'Não foi possível deletar unidade. Erro inesperado.' });

    }
  
  } else {

    return res.status(401).send({ error: 'Você não possui autorização para deletar unidades.' });
  }

});

module.exports = app => app.use("/model", router);
