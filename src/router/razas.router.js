const express = require('express');
const router = express.Router();
const razasController = require('../controller/razas.controller');
const { requireRole } = require('../middlewares/auth.middleware');

router
  .get('/', requireRole('empleado', 'gerente'), razasController.get)
  .get('/:id', requireRole('empleado', 'gerente'), razasController.getById)
  .post('/', requireRole('gerente'), razasController.create)
  .put('/:id', requireRole('gerente'), razasController.update)
  .delete('/:id', requireRole('gerente'), razasController.delete);

module.exports = router;
