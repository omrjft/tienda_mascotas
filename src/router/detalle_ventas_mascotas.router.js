const express = require('express');
const router = express.Router();
const detalle_ventas_mascotasController = require('../controller/detalle_ventas_mascotas.controller');

router
    .get('/', detalle_ventas_mascotasController.get)
    .get('/:id', detalle_ventas_mascotasController.getById)
    .post('/', detalle_ventas_mascotasController.create)
    .put('/:id', detalle_ventas_mascotasController.update)
    .delete('/:id', detalle_ventas_mascotasController.delete);

module.exports = router;