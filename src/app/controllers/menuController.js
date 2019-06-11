const express = require("express");
const authMiddleware = require("../middlewares/auth");
const Menu = require('../models/menu');
const Unit = require('../models/unit');
const mongodb = require("mongodb");

const router = express.Router();

router.use(authMiddleware);

function isValidDate(d) {

  return d instanceof Date && !isNaN(d);
}

// listar todos os cardapios salvos no sistema
router.get("/menu", async (req, res) => {

  try {

    const menus = await Menu.find();

    return res.send({ menus });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro na listagem de cardápios.' });

  }

});

// recuperar todos os cardapios de uma unidade
router.get("/menu/unit/:unitNameOrId", async (req, res) => {

  try {

    var unit;

    if(mongodb.ObjectID.isValid(req.params.unitNameOrId)) {
      
      unit = await Unit.findById(req.params.unitNameOrId);
      
    } else {
      
      unit = await Unit.findOne({ name: req.params.unitNameOrId });
    }

    if(!unit) return res.status(400).send({ erro: 'Unidade não encontrada' });
    
    const menus = await Menu.find({ unit: unit._id });
    return res.send({ menus });
    
  } catch (err) {
    
    console.log(err);
    return res.status(500).send({ erro: 'Erro na listagem dos cardápios.' });

  }

});

// recuperar todos os cardapios de uma data
router.get("/menu/date/:UnixTimeStamp", async (req, res) => {

    try {
  
      const selectedDate = await new Date(parseInt(req.params.UnixTimeStamp));
      //console.log(req.params.UnixTimeStamp);
      //console.log(selectedDate);
      if(!isValidDate(selectedDate)) return res.status(400).send({ erro: "Formato de data inválido, usar Unix Time Stamp" });
      
      const allMenus = await Menu.find();

      menus = [];

      await Promise.all(allMenus.map(async menu => { //aguardar tudo isso aqui ocorrer

        const { servedAt } = menu;

        if(servedAt.getDate() == selectedDate.getDate() && 
           servedAt.getMonth() == selectedDate.getMonth() && 
           servedAt.getFullYear() == selectedDate.getFullYear())
              menus.push(menu);

      }));

      return res.send({ menus });
      
    } catch (err) {
      
      console.log(err);
      return res.status(500).send({ erro: 'Erro na listagem dos cardápios.' });
  
    }
  
  });

module.exports = app => app.use("/model", router);
