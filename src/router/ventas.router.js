const express = require('express');
const router = express.Router();
const ventasController = require('../controller/ventas.controller');

router
    .get('/', ventasController.get)
    .get('/:id', ventasController.getById)
    .post('/', ventasController.create)
    .put('/:id', ventasController.update)
    .delete('/:id', ventasController.delete);

module.exports = router;