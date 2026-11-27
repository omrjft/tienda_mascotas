const express = require('express');
const router = express.Router();
const productosController = require('../controller/productos.controller');
const { requireRole } = require('../middlewares/auth.middleware');

router
  .get('/', requireRole('empleado', 'gerente'), productosController.get)
  .get('/:id', requireRole('empleado', 'gerente'), productosController.getById)
  .post('/', requireRole('gerente'), productosController.create)
  .put('/:id', requireRole('gerente'), productosController.update)
  .patch('/:id', requireRole('gerente'), productosController.update)
  .delete('/:id', requireRole('gerente'), productosController.delete);

module.exports = router;
