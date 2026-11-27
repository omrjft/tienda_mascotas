const express = require('express');
const router = express.Router();
const ventasController = require('../controller/ventas.controller');
const { requireRole } = require('../middlewares/auth.middleware');

router
  .get('/', requireRole('empleado', 'gerente'), ventasController.get)
  .get('/:id', requireRole('empleado', 'gerente'), ventasController.getById)
  .post('/', requireRole('empleado', 'gerente'), ventasController.create)
  .put('/:id', requireRole('gerente'), ventasController.update)
  .delete('/:id', requireRole('gerente'), ventasController.delete);

module.exports = router;
