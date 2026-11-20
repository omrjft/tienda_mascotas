const express = require('express');
const router = express.Router();
const razasController = require('../controller/razas.controller');

router
    .get('/', razasController.get)
    .get('/:id', razasController.getById)
    .post('/', razasController.create)
    .put('/:id', razasController.update)
    .delete('/:id', razasController.delete);

module.exports = router;