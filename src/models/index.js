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
    
}

module.exports = setupModels;