const express = require('express');
const router = express.Router();
const publicController = require('../controller/public.controller');

router
  .get('/mascotas', publicController.getMascotas)
  .get('/mascotas/:id', publicController.getMascotaById)
  .get('/productos', publicController.getProductos)
  .get('/productos/:id', publicController.getProductoById);

module.exports = router;
