const productosService = require('../service/productos.service');
const { sendSuccess, sendError } = require('../libs/http');
const normalizeImageUrl = require('../libs/image-url');
const service = new productosService();

function sanitizeProductoForRole(p, rol) {
  const plain = p.get ? p.get({ plain: true }) : p;
  const result = {
    id: plain.id,
    nombre: plain.nombre,
    id_categoria_producto: plain.id_categoria_producto,
    categoria_nombre: plain.categoria ? plain.categoria.nombre : 'General',
    precio: Number(plain.precio),
    stock: Number(plain.stock),
    imagen: plain.imagen
  };
  if (String(rol).toLowerCase() === 'gerente') {
    result.id_proveedor = plain.id_proveedor;
    result.proveedor_nombre = plain.proveedor ? plain.proveedor.nombre : null;
  }
  return result;
}

const create = async (req, res) => {
  try {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const id_categoria_producto = parseInt(req.body.id_categoria_producto ?? req.body.categoriaId, 10);
    const id_proveedor = parseInt(req.body.id_proveedor ?? req.body.proveedorId, 10);
    const precio = Number(req.body.precio);
    const stock = parseInt(req.body.stock ?? 0, 10);
    const imagen = normalizeImageUrl(req.body.imagen);

    if (!nombre || Number.isNaN(id_categoria_producto) || Number.isNaN(id_proveedor) || !Number.isFinite(precio) || precio <= 0 || Number.isNaN(stock) || stock < 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Faltan campos requeridos o tienen formato inválido.');
    }
    if (!imagen.valid) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'La imagen debe ser una URL HTTPS válida de hasta 2048 caracteres.');
    }

    const created = await service.create({ nombre, id_categoria_producto, id_proveedor, precio, stock, imagen: imagen.value });
    return sendSuccess(res, sanitizeProductoForRole(created, req.user?.rol), 201);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const get = async (req, res) => {
  try {
    const list = await service.find();
    return sendSuccess(res, list.map(p => sanitizeProductoForRole(p, req.user?.rol)));
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const getById = async (req, res) => {
  try {
    const item = await service.findOne(req.params.id);
    if (!item) {
      return sendError(res, 404, 'NOT_FOUND', 'Producto no encontrado.');
    }
    return sendSuccess(res, sanitizeProductoForRole(item, req.user?.rol));
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const update = async (req, res) => {
  try {
    const patch = {};
    if (req.body.nombre !== undefined) {
      const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
      if (!nombre) return sendError(res, 400, 'VALIDATION_ERROR', 'Nombre inválido.');
      patch.nombre = nombre;
    }
    if (req.body.id_categoria_producto !== undefined || req.body.categoriaId !== undefined) {
      const val = parseInt(req.body.id_categoria_producto ?? req.body.categoriaId, 10);
      if (Number.isNaN(val)) return sendError(res, 400, 'VALIDATION_ERROR', 'Categoría inválida.');
      patch.id_categoria_producto = val;
    }
    if (req.body.id_proveedor !== undefined || req.body.proveedorId !== undefined) {
      const val = parseInt(req.body.id_proveedor ?? req.body.proveedorId, 10);
      if (Number.isNaN(val)) return sendError(res, 400, 'VALIDATION_ERROR', 'Proveedor inválido.');
      patch.id_proveedor = val;
    }
    if (req.body.precio !== undefined) {
      const val = Number(req.body.precio);
      if (!Number.isFinite(val) || val <= 0) return sendError(res, 400, 'VALIDATION_ERROR', 'Precio inválido.');
      patch.precio = val;
    }
    if (req.body.stock !== undefined) {
      const val = parseInt(req.body.stock, 10);
      if (Number.isNaN(val) || val < 0) return sendError(res, 400, 'VALIDATION_ERROR', 'Stock inválido.');
      patch.stock = val;
    }
    if (req.body.imagen !== undefined) {
      const imagen = normalizeImageUrl(req.body.imagen);
      if (!imagen.valid) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'La imagen debe ser una URL HTTPS válida de hasta 2048 caracteres.');
      }
      patch.imagen = imagen.value;
    }

    if (Object.keys(patch).length === 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'No se enviaron campos para actualizar.');
    }

    const updated = await service.update(req.params.id, patch);
    if (!updated) {
      return sendError(res, 404, 'NOT_FOUND', 'Producto no encontrado.');
    }
    return sendSuccess(res, sanitizeProductoForRole(updated, req.user?.rol));
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const _delete = async (req, res) => {
  try {
    const deleted = await service.delete(req.params.id);
    if (!deleted) {
      return sendError(res, 404, 'NOT_FOUND', 'Producto no encontrado.');
    }
    return sendSuccess(res, { id: deleted.id, deleted: true });
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

module.exports = {
  create,
  get,
  getById,
  update,
  delete: _delete
};
