const express = require('express');
const router = express.Router();
const clientesController = require('../controller/clientes.controller');

router
    .get('/', clientesController.get)
    .get('/:id', clientesController.getById)
    .post('/', clientesController.create)
    .put('/:id', clientesController.update)
    .delete('/:id', clientesController.delete);

module.exports = router;