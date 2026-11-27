const ventasService = require('../service/ventas.service');
const { sendSuccess, sendError } = require('../libs/http');
const service = new ventasService();

function mapVenta(v) {
  const plain = v.get ? v.get({ plain: true }) : v;
  const items = [];
  if (Array.isArray(plain.detalles_productos)) {
    for (const dp of plain.detalles_productos) {
      items.push({
        tipo: 'producto',
        id_producto: dp.id_producto,
        nombre: dp.producto ? dp.producto.nombre : `Producto #${dp.id_producto}`,
        cantidad: Number(dp.cantidad),
        precio: Number(dp.precio)
      });
    }
  }
  if (Array.isArray(plain.detalles_mascotas)) {
    for (const dm of plain.detalles_mascotas) {
      const razaNombre = dm.mascota && dm.mascota.raza ? dm.mascota.raza.nombre : `Mascota #${dm.id_mascota}`;
      items.push({
        tipo: 'mascota',
        id_mascota: dm.id_mascota,
        nombre: `Mascota: ${razaNombre}`,
        cantidad: 1,
        precio: Number(dm.precio)
      });
    }
  }
  return {
    id: plain.id,
    folio: `V-${String(plain.id).padStart(4, '0')}`,
    id_cliente: plain.id_cliente,
    cliente_nombre: plain.cliente ? plain.cliente.nombre : `Cliente #${plain.id_cliente}`,
    id_empleado: plain.id_empleado,
    empleado_nombre: plain.empleado ? plain.empleado.nombre : `Empleado #${plain.id_empleado}`,
    fecha_hora: plain.fecha_hora,
    total: Number(plain.total),
    items
  };
}

const create = async (req, res) => {
  try {
    const id_cliente = parseInt(req.body.id_cliente, 10);
    if (Number.isNaN(id_cliente)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Debe seleccionar un cliente válido.');
    }

    const id_empleado = req.user?.id_empleado;
    if (!id_empleado) {
      return sendError(res, 403, 'EMPLOYEE_NOT_LINKED', 'El usuario autenticado no tiene un perfil de empleado asociado.');
    }

    const productos = Array.isArray(req.body.productos) ? req.body.productos : [];
    const mascotas = Array.isArray(req.body.mascotas) ? req.body.mascotas : [];

    const venta = await service.createSale({
      id_cliente,
      id_empleado,
      productos,
      mascotas
    });

    return sendSuccess(res, mapVenta(venta), 201);
  } catch (error) {
    if (error.status) {
      return sendError(res, error.status, error.code, error.message, error.details);
    }
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const get = async (req, res) => {
  try {
    const ventas = await service.find();
    return sendSuccess(res, ventas.map(mapVenta));
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const getById = async (req, res) => {
  try {
    const venta = await service.findOne(req.params.id);
    if (!venta) {
      return sendError(res, 404, 'NOT_FOUND', 'Venta no encontrada.');
    }
    return sendSuccess(res, mapVenta(venta));
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const update = async (req, res) => {
  return sendError(res, 403, 'CLOSED_SALE_IMMUTABLE', 'Las ventas cerradas no pueden modificarse directamente.');
};

const _delete = async (req, res) => {
  return sendError(res, 403, 'CLOSED_SALE_IMMUTABLE', 'No está permitido eliminar ventas cerradas.');
};

module.exports = {
  create,
  get,
  getById,
  update,
  delete: _delete
};
