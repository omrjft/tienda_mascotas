const express = require('express');
const router = express.Router();
const categorias_productosController = require('../controller/categorias_productos.controller');

router
    .get('/', categorias_productosController.get)
    .get('/:id', categorias_productosController.getById)
    .post('/', categorias_productosController.create)
    .put('/:id', categorias_productosController.update)
    .delete('/:id', categorias_productosController.delete);

module.exports = router;