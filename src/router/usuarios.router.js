const express = require('express');
const router = express.Router();
const usuariosController = require('../controller/usuarios.controller');

router
    .get('/', usuariosController.get)
    .get('/:id', usuariosController.getById)
    .post('/', usuariosController.create)
    .put('/:id', usuariosController.update)
    .delete('/:id', usuariosController.delete);

module.exports = router;