const express = require('express');
const router = express.Router();
const clientesController = require('../controller/clientes.controller');
const { requireRole } = require('../middlewares/auth.middleware');

router
  .get('/', requireRole('empleado', 'gerente'), clientesController.get)
  .get('/:id', requireRole('empleado', 'gerente'), clientesController.getById)
  .post('/', requireRole('empleado', 'gerente'), clientesController.create)
  .put('/:id', requireRole('gerente'), clientesController.update)
  .delete('/:id', requireRole('gerente'), clientesController.delete);

module.exports = router;
