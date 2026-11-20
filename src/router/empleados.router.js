const express = require('express');
const router = express.Router();
const empleadosController = require('../controller/empleados.controller');

router
    .get('/', empleadosController.get)
    .get('/:id', empleadosController.getById)
    .post('/', empleadosController.create)
    .put('/:id', empleadosController.update)
    .delete('/:id', empleadosController.delete);

module.exports = router;