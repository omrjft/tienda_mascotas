const express = require('express');
const router = express.Router();
const mascotasController = require('../controller/mascotas.controller');
const { requireRole } = require('../middlewares/auth.middleware');

router
  .get('/', requireRole('empleado', 'gerente'), mascotasController.get)
  .get('/:id', requireRole('empleado', 'gerente'), mascotasController.getById)
  .post('/', requireRole('gerente'), mascotasController.create)
  .put('/:id', requireRole('gerente'), mascotasController.update)
  .patch('/:id', requireRole('gerente'), mascotasController.update)
  .delete('/:id', requireRole('gerente'), mascotasController.delete);

module.exports = router;
