const express = require('express');
const { attachSession, csrfProtection, requireRole } = require('../middlewares/auth.middleware');

const authRouter = require('./auth.router');
const publicRouter = require('./public.router');
const especiesRouter = require('./especies.router');
const razasRouter = require('./razas.router');
const proveedoresRouter = require('./proveedores.router');
const categorias_productosRouter = require('./categorias_productos.router');
const mascotasRouter = require('./mascotas.router');
const productosRouter = require('./productos.router');
const clientesRouter = require('./clientes.router');
const empleadosRouter = require('./empleados.router');
const ventasRouter = require('./ventas.router');
const detalle_ventas_productosRouter = require('./detalle_ventas_productos.router');
const detalle_ventas_mascotasRouter = require('./detalle_ventas_mascotas.router');
const usuariosRouter = require('./usuarios.router');

function routesApi(app) {
  const router = express.Router();

  app.use('/api', attachSession, csrfProtection, router);

  router.use('/auth', authRouter);
  router.use('/public', publicRouter);
  router.use('/especies', especiesRouter);
  router.use('/razas', razasRouter);
  router.use('/proveedores', requireRole('gerente'), proveedoresRouter);
  router.use('/categorias_productos', categorias_productosRouter);
  router.use('/productos', productosRouter);
  router.use('/mascotas', mascotasRouter);
  router.use('/clientes', clientesRouter);
  router.use('/empleados', requireRole('gerente'), empleadosRouter);
  router.use('/ventas', ventasRouter);
  router.use('/detalle_ventas_productos', requireRole('empleado', 'gerente'), detalle_ventas_productosRouter);
  router.use('/detalle_ventas_mascotas', requireRole('empleado', 'gerente'), detalle_ventas_mascotasRouter);
  router.use('/usuarios', requireRole('gerente'), usuariosRouter);
}

module.exports = routesApi;
