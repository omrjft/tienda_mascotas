const sequelize = require('../libs/sequelize');
const { models } = sequelize;

class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ventasService {
  /**
   * Registra una venta completa de forma transaccional.
   * El servidor calcula precios y total a partir de la DB y valida stock/disponibilidad.
   */
  async createSale({ id_cliente, id_empleado, productos = [], mascotas = [] }) {
    if (!Array.isArray(productos)) productos = [];
    if (!Array.isArray(mascotas)) mascotas = [];

    if (productos.length === 0 && mascotas.length === 0) {
      throw new AppError(400, 'EMPTY_CART', 'La venta debe incluir al menos un producto o una mascota.');
    }

    const ventaId = await sequelize.transaction(async (t) => {
      const cliente = await models.Clientes.findByPk(id_cliente, { transaction: t });
      if (!cliente) {
        throw new AppError(404, 'CLIENT_NOT_FOUND', 'El cliente seleccionado no existe.');
      }

      const empleado = await models.Empleados.findByPk(id_empleado, { transaction: t });
      if (!empleado) {
        throw new AppError(403, 'EMPLOYEE_NOT_LINKED', 'La sesión actual no está vinculada a un empleado válido.');
      }

      let total = 0;
      const detallesProductos = [];
      const detallesMascotas = [];

      // Consolidar cantidades por producto
      const consolidatedProducts = new Map();
      for (const item of productos) {
        const prodId = parseInt(item.id_producto ?? item.id, 10);
        const qty = parseInt(item.cantidad, 10);
        if (Number.isNaN(prodId) || Number.isNaN(qty) || qty <= 0) {
          throw new AppError(400, 'INVALID_PRODUCT_ITEM', 'Producto o cantidad inválida en el carrito.');
        }
        consolidatedProducts.set(prodId, (consolidatedProducts.get(prodId) || 0) + qty);
      }

      for (const [prodId, qty] of consolidatedProducts.entries()) {
        const prod = await models.Productos.findByPk(prodId, {
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (!prod) {
          throw new AppError(404, 'PRODUCT_NOT_FOUND', `Producto #${prodId} no encontrado.`);
        }
        if (prod.stock < qty) {
          throw new AppError(
            409,
            'INSUFFICIENT_STOCK',
            `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock}, solicitado: ${qty}.`
          );
        }

        const unitPrice = Number(prod.precio);
        total += unitPrice * qty;

        await prod.update({ stock: prod.stock - qty }, { transaction: t });
        detallesProductos.push({
          id_producto: prod.id,
          cantidad: qty,
          precio: unitPrice
        });
      }

      // Validar mascotas únicas
      const seenMascotas = new Set();
      for (const item of mascotas) {
        const petId = parseInt(item.id_mascota ?? item.id, 10);
        if (Number.isNaN(petId)) {
          throw new AppError(400, 'INVALID_PET_ITEM', 'Identificador de mascota inválido.');
        }
        if (seenMascotas.has(petId)) {
          throw new AppError(400, 'DUPLICATE_PET', `Mascota #${petId} duplicada en la venta.`);
        }
        seenMascotas.add(petId);

        const pet = await models.Mascotas.findByPk(petId, {
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (!pet) {
          throw new AppError(404, 'PET_NOT_FOUND', `Mascota #${petId} no encontrada.`);
        }
        if (pet.estado !== 'Disponible') {
          throw new AppError(
            409,
            'PET_NOT_AVAILABLE',
            `La mascota #${petId} no está disponible (estado actual: ${pet.estado}).`
          );
        }

        const petPrice = Number(pet.precio);
        total += petPrice;

        await pet.update({ estado: 'Vendido' }, { transaction: t });
        detallesMascotas.push({
          id_mascota: pet.id,
          precio: petPrice
        });
      }

      const venta = await models.Ventas.create({
        id_cliente: cliente.id,
        id_empleado: empleado.id,
        fecha_hora: new Date(),
        total: Number(total.toFixed(2))
      }, { transaction: t });

      for (const dp of detallesProductos) {
        await models.DetalleVentasProductos.create({
          id_venta: venta.id,
          id_producto: dp.id_producto,
          cantidad: dp.cantidad,
          precio: dp.precio
        }, { transaction: t });
      }

      for (const dm of detallesMascotas) {
        await models.DetalleVentasMascotas.create({
          id_venta: venta.id,
          id_mascota: dm.id_mascota,
          precio: dm.precio
        }, { transaction: t });
      }

      return venta.id;
    });

    return this.findOne(ventaId);
  }

  async find() {
    return models.Ventas.findAll({
      include: [
        { model: models.Clientes, as: 'cliente', attributes: ['id', 'nombre', 'email'] },
        { model: models.Empleados, as: 'empleado', attributes: ['id', 'nombre', 'puesto'] },
        {
          model: models.DetalleVentasProductos,
          as: 'detalles_productos',
          include: [{ model: models.Productos, as: 'producto', attributes: ['id', 'nombre'] }]
        },
        {
          model: models.DetalleVentasMascotas,
          as: 'detalles_mascotas',
          include: [
            {
              model: models.Mascotas,
              as: 'mascota',
              attributes: ['id', 'id_raza'],
              include: [{ model: models.Razas, as: 'raza', attributes: ['id', 'nombre'] }]
            }
          ]
        }
      ],
      order: [['id', 'DESC']]
    });
  }

  async findOne(id) {
    return models.Ventas.findByPk(id, {
      include: [
        { model: models.Clientes, as: 'cliente', attributes: ['id', 'nombre', 'email'] },
        { model: models.Empleados, as: 'empleado', attributes: ['id', 'nombre', 'puesto'] },
        {
          model: models.DetalleVentasProductos,
          as: 'detalles_productos',
          include: [{ model: models.Productos, as: 'producto', attributes: ['id', 'nombre'] }]
        },
        {
          model: models.DetalleVentasMascotas,
          as: 'detalles_mascotas',
          include: [
            {
              model: models.Mascotas,
              as: 'mascota',
              attributes: ['id', 'id_raza'],
              include: [{ model: models.Razas, as: 'raza', attributes: ['id', 'nombre'] }]
            }
          ]
        }
      ]
    });
  }
}

ventasService.AppError = AppError;
module.exports = ventasService;
