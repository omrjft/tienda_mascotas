const {Especies, EspeciesSchema} = require('./especies.model');
const {Proveedores, ProveedoresSchema} = require('./proveedores.model');
const{CategoriasProductos, CategoriasProductosSchema} = require('./categorias_productos.model');
const {Productos, ProductosSchema} = require('./productos.model');
const {Mascotas, MascotasSchema} = require('./mascotas.model');
const {Clientes, ClientesSchema} = require('./clientes.model');
const {Empleados, EmpleadosSchema} = require('./empleados.model');
const {Ventas, VentasSchema} = require('./ventas.model');
const {DetalleVentasProductos, DetalleVentasProductosSchema} = require('./detalle_ventas_productos.model');
const {DetalleVentasMascotas, DetalleVentasMascotasSchema} = require('./detalle_ventas_mascotas.model');
const {Razas, RazasSchema} = require('./razas.model');
const {Usuarios, UsuariosSchema} = require('./usuarios.model');

function setupModels(sequelize){

    Usuarios.init(UsuariosSchema, Usuarios.config(sequelize));
    Especies.init(EspeciesSchema, Especies.config(sequelize));
    Proveedores.init(ProveedoresSchema, Proveedores.config(sequelize));
    CategoriasProductos.init(CategoriasProductosSchema, CategoriasProductos.config(sequelize));
    Productos.init(ProductosSchema, Productos.config(sequelize));
    Mascotas.init(MascotasSchema, Mascotas.config(sequelize));
    Clientes.init(ClientesSchema, Clientes.config(sequelize));
    Empleados.init(EmpleadosSchema, Empleados.config(sequelize));
    Ventas.init(VentasSchema, Ventas.config(sequelize));
    DetalleVentasProductos.init(DetalleVentasProductosSchema, DetalleVentasProductos.config(sequelize));
    DetalleVentasMascotas.init(DetalleVentasMascotasSchema, DetalleVentasMascotas.config(sequelize));
    Razas.init(RazasSchema, Razas.config(sequelize));

    // Asociaciones
    Razas.belongsTo(Especies, { foreignKey: 'id_especie', as: 'especie' });
    Especies.hasMany(Razas, { foreignKey: 'id_especie', as: 'razas' });

    Mascotas.belongsTo(Razas, { foreignKey: 'id_raza', as: 'raza' });
    Razas.hasMany(Mascotas, { foreignKey: 'id_raza', as: 'mascotas' });
    Mascotas.belongsTo(Proveedores, { foreignKey: 'id_proveedor', as: 'proveedor' });

    Productos.belongsTo(CategoriasProductos, { foreignKey: 'id_categoria_producto', as: 'categoria' });
    CategoriasProductos.hasMany(Productos, { foreignKey: 'id_categoria_producto', as: 'productos' });
    Productos.belongsTo(Proveedores, { foreignKey: 'id_proveedor', as: 'proveedor' });

    Ventas.belongsTo(Clientes, { foreignKey: 'id_cliente', as: 'cliente' });
    Ventas.belongsTo(Empleados, { foreignKey: 'id_empleado', as: 'empleado' });
    Ventas.hasMany(DetalleVentasProductos, { foreignKey: 'id_venta', as: 'detalles_productos' });
    Ventas.hasMany(DetalleVentasMascotas, { foreignKey: 'id_venta', as: 'detalles_mascotas' });

    DetalleVentasProductos.belongsTo(Ventas, { foreignKey: 'id_venta', as: 'venta' });
    DetalleVentasProductos.belongsTo(Productos, { foreignKey: 'id_producto', as: 'producto' });

    DetalleVentasMascotas.belongsTo(Ventas, { foreignKey: 'id_venta', as: 'venta' });
    DetalleVentasMascotas.belongsTo(Mascotas, { foreignKey: 'id_mascota', as: 'mascota' });
}

module.exports = setupModels;