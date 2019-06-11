const express = require("express");
const authMiddleware = require("../middlewares/auth");
const FoodItem = require('../models/fooditem');
const Unit = require('../models/unit');
const Menu = require('../models/menu');
const MenuItem = require('../models/menuitem');

const router = express.Router();

router.use(authMiddleware);

// teste para checar se tem privilegio admin
router.get("/", async (req, res) => {

  if(req.isAdmin) {

    res.send({ res: 'Você está autenticado como administrador.', user: req.userId, isAdmin: req.isAdmin });
  
  } else {

    res.send({ res: 'Você está autenticado como usuário comum.', user: req.userId, isAdmin: req.isAdmin });
  }

});

// listar todos os alimentos cadastrados no sistema
router.get("/fooditem", async (req, res) => {

  try {

    const foodItems = await FoodItem.find();

    return res.send({ foodItems });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro na listagem de alimentos.' });

  }

});

// recuperar um alimento especifico
router.get("/fooditem/:foodName", async (req, res) => {

  try {

    const food = await FoodItem.findOne({ name: req.params.foodName });

    if(!food) res.status(400).send({ erro: 'Alimento não encontrado' });
    else return res.send({ food });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro na busca do alimento.' });

  }

});

// criar um ou mais alimentos
router.post("/fooditem", async (req, res) => {

  if(req.isAdmin) {

    try {

      const { foodItems } = req.body;
      created = [];

      await Promise.all(foodItems.map(async foodItem => { //aguardar tudo isso aqui ocorrer

        //console.log(foodItem);

        const { name } = foodItem;

        //console.log(name);

        if(await FoodItem.findOne({ name })) {

          console.log('Alimento já existe.')

        } else {

          const food = await new FoodItem({ ...foodItem });

          //console.log(food);

          await food.save();
          created.push(food);

        }

      }));

      return res.send({ created });
      
    } catch (err) {
      
      console.log(err);
      res.status(500).send({ erro: 'Não foi possível cadastrar alimentos. Erro inesperado.' });

    }
  
  } else {

    res.status(401).send({ error: 'Você não possui autorização para cadastrar alimentos.' });
  }

});

// deletar um ou mais alimentos
router.delete("/fooditem", async (req, res) => {

  if(req.isAdmin) {

    try {

      const { foodNames } = req.body;
      deleted = [];

      await Promise.all(foodNames.map(async foodName => { //aguardar tudo isso aqui ocorrer

        const { name } = foodName;

        if(await FoodItem.findOne({ name })) {

          await FoodItem.findOneAndRemove({ name });
          deleted.push(name);

        } else {

          console.log('Alimento não existe');

        }

      }));

      return res.send({ deleted });
      
    } catch (err) {
      
      console.log(err);
      res.status(500).send({ erro: 'Não foi possível deletar alimentos. Erro inesperado.' });

    }
  
  } else {

    res.status(401).send({ error: 'Você não possui autorização para cadastrar alimentos.' });
  }

});

// listar todos as unidades cadastradas no sistema
router.get("/unit", async (req, res) => {

  try {

    const units = await Unit.find();

    return res.send({ units });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro na listagem de unidades.' });

  }

});

// recuperar uma unidade especifica
router.get("/unit/:unitName", async (req, res) => {

  try {

    const unit = await Unit.findOne({ name: req.params.unitName }).populate({

      path: 'currentMenu',

      populate: {

        path: 'menuItems',

        populate: { path: 'foodItem' }
      }

    });

    if(!unit) res.status(400).send({ erro: 'Unidade não encontrada' });
    else return res.send({ unit });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro na busca da Unidade.' });

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

      const menu = await Menu.create({ unit: unit._id, menuItems: [], priceSoldFor: unit.priceCharged });

      unit.currentMenu = menu;
      await unit.save();

      return res.send({ unit });
      
    } catch (err) {
      
      console.log(err);
      res.status(500).send({ erro: 'Não foi possível cadastrar unidade. Erro inesperado.' });

    }
  
  } else {

    res.status(401).send({ error: 'Você não possui autorização para cadastrar unidades.' });
  }

});

// atualizar dados da unidade
router.put("/unit/:unitName/data", async (req, res) => {

  if(req.isAdmin) {

    try {

      const { name, location, priceCharged, queueStatus } = req.body;

      console.log(priceCharged);

      const unit = await Unit.findOneAndUpdate({ name: req.params.unitName }, {
        name,
        location,
        priceCharged,
        queueStatus
      }, { new: true });

      if(!unit) res.status(400).send({ erro: 'Unidade não encontrada' });
      else return res.send({ unit });
      
    } catch (err) {
      
      console.log(err);
      res.status(500).send({ erro: 'Não foi possível atualizar dados. Erro inesperado.' });

    }
  
  } else {

    res.status(401).send({ error: 'Você não possui autorização para cadastrar unidades.' });
  }

});

// atualizar cardápio
router.put("/unit/:unitName/menu", async (req, res) => {

  if(req.isAdmin) {

    try {

      const unit = await Unit.findOne({ name: req.params.unitName }).populate(['currentMenu']);
      if(!unit) res.status(400).send({ erro: 'Unidade não encontrada' });

      unit.currentMenu.menuItems = [];
      await MenuItem.deleteMany({ menu: unit.currentMenu._id }); //remover todos os itens do menu
      unit.currentMenu = undefined;
      await Menu.deleteOne({ unit: unit._id }); //remover menus associados a essa unidade

      const menu = await Menu.create({ unit: unit._id, menuItems: [], priceSoldFor: unit.priceCharged });
      unit.currentMenu = menu;
      
      const { menuItems } = req.body;

      await Promise.all(menuItems.map(async menuItem => { //aguardar tudo isso aqui ocorrer

        const { name, availability } = menuItem;
        const food = await FoodItem.findOne({ name });

        if(!food) {

          console.log('Alimento não encontrado.');

        } else {

          const item = await MenuItem.create({ menu: menu._id, foodItem: food._id, availability });
          menu.menuItems.push(item);

        }

      }));

      await menu.save();
      await unit.save();

      res.send({ unit });
      
    } catch (err) {
      
      console.log(err);
      res.status(500).send({ erro: 'Não foi possível atualizar cardápio. Erro inesperado.' });

    }
  
  } else {

    res.status(401).send({ error: 'Você não possui autorização para cadastrar unidades.' });
  }

});

// deletar uma unidade especifica
router.delete("/unit/:unitName", async (req, res) => {

  if(req.isAdmin) {

    try {

      const unit = await Unit.findOne({ name: req.params.unitName });

      if(!unit) {

        res.status(400).send({ erro: 'Unidade não existe.' });

      } else {

        unit.currentMenu.menuItems = [];
        await MenuItem.deleteMany({ menu: unit.currentMenu._id }); //remover todos os itens do menu
        unit.currentMenu = undefined;
        await Menu.deleteOne({ unit: unit._id }); //remover menus associados a essa unidade
        await Unit.deleteOne({ name: unit.name });

        res.send();
      }
      
    } catch (err) {
      
      console.log(err);
      res.status(500).send({ erro: 'Não foi possível deletar alimentos. Erro inesperado.' });

    }
  
  } else {

    res.status(401).send({ error: 'Você não possui autorização para cadastrar alimentos.' });
  }

});

module.exports = app => app.use("/model", router);
