const express = require("express");
const authMiddleware = require("../middlewares/auth");
const FoodItem = require('../models/fooditem');
const mongodb = require("mongodb");

const router = express.Router();

router.use(authMiddleware);

// listar todos os alimentos cadastrados no sistema
router.get("/fooditem", async (req, res) => {

  try {

    const foodItems = await FoodItem.find();

    return res.send({ foodItems });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro inesperado na listagem de alimentos.' });

  }

});

// recuperar um alimento especifico
router.get("/fooditem/:foodNameOrId", async (req, res) => {

  try {

    var food;

    if(mongodb.ObjectID.isValid(req.params.foodNameOrId)) {

      food = await FoodItem.findById(req.params.foodNameOrId);

    } else {

      food = await FoodItem.findOne({ name: req.params.foodNameOrId });
    }

    if(!food) return res.status(400).send({ erro: 'Alimento não encontrado' });
    else return res.send({ food });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro inesperado na busca do alimento.' });

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
      return res.status(500).send({ erro: 'Não foi possível cadastrar alimentos. Erro inesperado.' });

    }
  
  } else {

    return res.status(401).send({ error: 'Você não possui autorização para cadastrar alimentos.' });
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
      return res.status(500).send({ erro: 'Não foi possível deletar alimentos. Erro inesperado.' });

    }
  
  } else {

    return res.status(401).send({ error: 'Você não possui autorização para deletar alimentos.' });
  }

});

module.exports = app => app.use("/model", router);
