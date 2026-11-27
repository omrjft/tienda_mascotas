const express = require('express');
const router = express.Router();
const especiesController = require('../controller/especies.controller');
const { requireRole } = require('../middlewares/auth.middleware');

router
  .get('/', requireRole('empleado', 'gerente'), especiesController.get)
  .get('/:id', requireRole('empleado', 'gerente'), especiesController.getById)
  .post('/', requireRole('gerente'), especiesController.create)
  .put('/:id', requireRole('gerente'), especiesController.update)
  .delete('/:id', requireRole('gerente'), especiesController.delete);

module.exports = router;
