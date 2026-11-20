const express = require('express');
const router = express.Router();
const especiesController = require('../controller/especies.controller');

router
    .get('/', especiesController.get)
    .get('/:id', especiesController.getById)
    .post('/', especiesController.create)
    .put('/:id', especiesController.update)
    .delete('/:id', especiesController.delete);

module.exports = router;