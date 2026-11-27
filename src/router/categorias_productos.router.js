const express = require('express');
const router = express.Router();
const categorias_productosController = require('../controller/categorias_productos.controller');
const { requireRole } = require('../middlewares/auth.middleware');

router
  .get('/', requireRole('empleado', 'gerente'), categorias_productosController.get)
  .get('/:id', requireRole('empleado', 'gerente'), categorias_productosController.getById)
  .post('/', requireRole('gerente'), categorias_productosController.create)
  .put('/:id', requireRole('gerente'), categorias_productosController.update)
  .delete('/:id', requireRole('gerente'), categorias_productosController.delete);

module.exports = router;
