const express = require('express');
const router = express.Router();
const mascotasController = require('../controller/mascotas.controller');

router
    .get('/', mascotasController.get)
    .get('/:id', mascotasController.getById)
    .post('/', mascotasController.create)
    .put('/:id', mascotasController.update)
    .delete('/:id', mascotasController.delete);

module.exports = router;