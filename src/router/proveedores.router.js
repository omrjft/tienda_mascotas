const express = require('express');
const router = express.Router();
const proveedoresController = require('../controller/proveedores.controller');

router
    .get('/', proveedoresController.get)
    .get('/:id', proveedoresController.getById)
    .post('/', proveedoresController.create)
    .put('/:id', proveedoresController.update)
    .delete('/:id', proveedoresController.delete);

module.exports = router;