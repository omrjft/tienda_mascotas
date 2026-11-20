const express = require('express');
const router = express.Router();
const detalle_ventas_productosController = require('../controller/detalle_ventas_productos.controller');

router
    .get('/', detalle_ventas_productosController.get)
    .get('/:id', detalle_ventas_productosController.getById)
    .post('/', detalle_ventas_productosController.create)
    .put('/:id', detalle_ventas_productosController.update)
    .delete('/:id', detalle_ventas_productosController.delete);

module.exports = router;