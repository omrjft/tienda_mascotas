require('dotenv').config();
const sequelize = require('../libs/sequelize');
const { models } = sequelize;
const { hashPassword } = require('../libs/auth');

async function seed() {
  await sequelize.authenticate();

  const existingEspecies = await models.Especies.count();
  if (existingEspecies > 0) {
    console.log('La base de datos ya contiene datos iniciales. Omitiendo seed.');
    process.exit(0);
  }

  await sequelize.transaction(async (t) => {
    const especies = await models.Especies.bulkCreate([
      { nombre: 'Canino', habitat: 'Doméstico / Hogar' },
      { nombre: 'Felino', habitat: 'Doméstico / Interior' },
      { nombre: 'Ave', habitat: 'Aviario / Jaula amplia' }
    ], { transaction: t, returning: true });

    const razas = await models.Razas.bulkCreate([
      { id_especie: especies[0].id, nombre: 'Golden Retriever' },
      { id_especie: especies[0].id, nombre: 'Bulldog Francés' },
      { id_especie: especies[1].id, nombre: 'Siamés' },
      { id_especie: especies[1].id, nombre: 'Persa' },
      { id_especie: especies[2].id, nombre: 'Canario Cantor' }
    ], { transaction: t, returning: true });

    const categorias = await models.CategoriasProductos.bulkCreate([
      { nombre: 'Alimentos y Nutrición', descripcion: 'Croquetas, alimento húmedo y suplementos' },
      { nombre: 'Accesorios y Paseo', descripcion: 'Correas, collares, camas y transportadoras' },
      { nombre: 'Higiene y Salud', descripcion: 'Champús, cepillos y cuidado dermatológico' },
      { nombre: 'Juguetes', descripcion: 'Rascadores, pelotas y juguetes interactivos' }
    ], { transaction: t, returning: true });

    const proveedores = await models.Proveedores.bulkCreate([
      { nombre: 'Criadero San Bernardo', contacto: 'Dr. Roberto Silva', telefono: '555-1020', email: 'contacto@sanbernardo.com' },
      { nombre: 'Distribuidora PetFood México', contacto: 'Laura Méndez', telefono: '555-3040', email: 'ventas@petfood.mx' },
      { nombre: 'Criadero El Paraíso Felino', contacto: 'Sofía Castro', telefono: '555-7080', email: 'info@paraisofelino.com' }
    ], { transaction: t, returning: true });

    const mascotas = await models.Mascotas.bulkCreate([
      { id_raza: razas[0].id, id_proveedor: proveedores[0].id, fecha_nacimiento: '2025-08-10', precio: 8500, estado: 'Disponible' },
      { id_raza: razas[1].id, id_proveedor: proveedores[0].id, fecha_nacimiento: '2025-09-02', precio: 12000, estado: 'Disponible' },
      { id_raza: razas[2].id, id_proveedor: proveedores[2].id, fecha_nacimiento: '2025-07-22', precio: 4500, estado: 'Disponible' },
      { id_raza: razas[3].id, id_proveedor: proveedores[2].id, fecha_nacimiento: '2025-09-14', precio: 6200, estado: 'Cuarentena' },
      { id_raza: razas[4].id, id_proveedor: proveedores[0].id, fecha_nacimiento: '2025-05-18', precio: 1100, estado: 'Disponible' }
    ], { transaction: t, returning: true });

    const productos = await models.Productos.bulkCreate([
      { id_categoria_producto: categorias[0].id, id_proveedor: proveedores[1].id, nombre: 'Alimento Premium Dog Adult 15kg', precio: 1450, stock: 14 },
      { id_categoria_producto: categorias[1].id, id_proveedor: proveedores[1].id, nombre: 'Correa Retráctil Ergonómica 5m', precio: 380, stock: 3 },
      { id_categoria_producto: categorias[2].id, id_proveedor: proveedores[1].id, nombre: 'Champú Hipoalergénico de Avena 500ml', precio: 220, stock: 8 },
      { id_categoria_producto: categorias[3].id, id_proveedor: proveedores[1].id, nombre: 'Rascador Multinivel Torre Felina', precio: 890, stock: 4 },
      { id_categoria_producto: categorias[1].id, id_proveedor: proveedores[1].id, nombre: 'Cama Ortopédica Memory Foam', precio: 750, stock: 9 }
    ], { transaction: t, returning: true });

    const usuarios = await models.Usuarios.bulkCreate([
      { email: 'valeria@tienda.com', password: hashPassword('123456'), rol: 'gerente', activo: true },
      { email: 'eduardo@tienda.com', password: hashPassword('123456'), rol: 'empleado', activo: true },
      { email: 'carlos.m@gmail.com', password: hashPassword('123456'), rol: 'cliente', activo: true }
    ], { transaction: t, returning: true });

    const clientes = await models.Clientes.bulkCreate([
      { nombre: 'Público General', telefono: 'N/A', email: 'general@tienda.com', usuarioId: null },
      { nombre: 'Carlos Mendoza', telefono: '555-987-1234', email: 'carlos.m@gmail.com', usuarioId: usuarios[2].id },
      { nombre: 'Ana Sofía Garza', telefono: '555-432-8765', email: 'ana.garza@outlook.com', usuarioId: null }
    ], { transaction: t, returning: true });

    const empleados = await models.Empleados.bulkCreate([
      { nombre: 'Valeria Ramos', puesto: 'Gerente', email: 'valeria@tienda.com', fecha_ingreso: '2024-01-15', usuarioId: usuarios[0].id },
      { nombre: 'Eduardo Lozano', puesto: 'Empleado', email: 'eduardo@tienda.com', fecha_ingreso: '2024-06-01', usuarioId: usuarios[1].id }
    ], { transaction: t, returning: true });

    const venta1 = await models.Ventas.create({
      id_cliente: clientes[1].id,
      id_empleado: empleados[1].id,
      fecha_hora: new Date('2026-11-18T14:30:00Z'),
      total: 1830.00
    }, { transaction: t });

    await models.DetalleVentasProductos.bulkCreate([
      { id_venta: venta1.id, id_producto: productos[0].id, cantidad: 1, precio: 1450.00 },
      { id_venta: venta1.id, id_producto: productos[1].id, cantidad: 1, precio: 380.00 }
    ], { transaction: t });
  });

  console.log('Seed completado exitosamente.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
