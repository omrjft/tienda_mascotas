const express = require('express');
const especiesRouter = require('./especies.router');
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

    app.use('/api', router);

    router.use('/especies', especiesRouter);
    router.use('/proveedores', proveedoresRouter);
    router.use('/categorias_productos', categorias_productosRouter);
    router.use('/productos', productosRouter);
    router.use('/mascotas', mascotasRouter);
    router.use('/clientes', clientesRouter);
    router.use('/empleados', empleadosRouter);
    router.use('/ventas', ventasRouter);
    router.use('/detalle_ventas_productos', detalle_ventas_productosRouter);
    router.use('/detalle_ventas_mascotas', detalle_ventas_mascotasRouter);
    router.use('/usuarios', usuariosRouter);

}

module.exports = routesApi;