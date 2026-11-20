const express = require('express');
const router = express.Router();
const productosController = require('../controller/productos.controller');

router
    .get('/', productosController.get)
    .get('/:id', productosController.getById)
    .post('/', productosController.create)
    .put('/:id', productosController.update)
    .delete('/:id', productosController.delete);

module.exports = router;