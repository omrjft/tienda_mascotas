const mascotasService = require('../service/mascotas.service');
const { sendSuccess, sendError } = require('../libs/http');
const service = new mascotasService();

const ESTADOS_VALIDOS = ['Disponible', 'Cuarentena', 'Vendido'];

function sanitizeMascotaForRole(m, rol) {
  const plain = m.get ? m.get({ plain: true }) : m;
  const result = {
    id: plain.id,
    id_raza: plain.id_raza,
    raza_nombre: plain.raza ? plain.raza.nombre : 'Sin raza',
    especie: plain.raza && plain.raza.especie ? plain.raza.especie.nombre : 'Mascota',
    fecha_nacimiento: plain.fecha_nacimiento,
    precio: Number(plain.precio),
    estado: plain.estado
  };
  if (String(rol).toLowerCase() === 'gerente') {
    result.id_proveedor = plain.id_proveedor;
    result.proveedor_nombre = plain.proveedor ? plain.proveedor.nombre : null;
  }
  return result;
}

const create = async (req, res) => {
  try {
    const id_raza = parseInt(req.body.id_raza, 10);
    const id_proveedor = parseInt(req.body.id_proveedor, 10);
    const precio = Number(req.body.precio);
    const fecha_nacimiento = req.body.fecha_nacimiento;
    const estado = req.body.estado || 'Disponible';

    if (Number.isNaN(id_raza) || Number.isNaN(id_proveedor) || Number.isNaN(precio) || precio <= 0 || !fecha_nacimiento) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Faltan campos requeridos o tienen formato inválido (id_raza, id_proveedor, fecha_nacimiento, precio).');
    }
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Estado de mascota inválido.');
    }

    const created = await service.create({ id_raza, id_proveedor, fecha_nacimiento, precio, estado });
    return sendSuccess(res, sanitizeMascotaForRole(created, req.user?.rol), 201);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const get = async (req, res) => {
  try {
    const list = await service.find();
    return sendSuccess(res, list.map(m => sanitizeMascotaForRole(m, req.user?.rol)));
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const getById = async (req, res) => {
  try {
    const item = await service.findOne(req.params.id);
    if (!item) {
      return sendError(res, 404, 'NOT_FOUND', 'Mascota no encontrada.');
    }
    return sendSuccess(res, sanitizeMascotaForRole(item, req.user?.rol));
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const update = async (req, res) => {
  try {
    const patch = {};
    if (req.body.id_raza !== undefined) {
      const val = parseInt(req.body.id_raza, 10);
      if (Number.isNaN(val)) return sendError(res, 400, 'VALIDATION_ERROR', 'id_raza inválido.');
      patch.id_raza = val;
    }
    if (req.body.id_proveedor !== undefined) {
      const val = parseInt(req.body.id_proveedor, 10);
      if (Number.isNaN(val)) return sendError(res, 400, 'VALIDATION_ERROR', 'id_proveedor inválido.');
      patch.id_proveedor = val;
    }
    if (req.body.fecha_nacimiento !== undefined) {
      patch.fecha_nacimiento = req.body.fecha_nacimiento;
    }
    if (req.body.precio !== undefined) {
      const val = Number(req.body.precio);
      if (Number.isNaN(val) || val <= 0) return sendError(res, 400, 'VALIDATION_ERROR', 'Precio inválido.');
      patch.precio = val;
    }
    if (req.body.estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(req.body.estado)) return sendError(res, 400, 'VALIDATION_ERROR', 'Estado inválido.');
      patch.estado = req.body.estado;
    }

    if (Object.keys(patch).length === 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'No se enviaron campos para actualizar.');
    }

    const updated = await service.update(req.params.id, patch);
    if (!updated) {
      return sendError(res, 404, 'NOT_FOUND', 'Mascota no encontrada.');
    }
    return sendSuccess(res, sanitizeMascotaForRole(updated, req.user?.rol));
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const _delete = async (req, res) => {
  try {
    const deleted = await service.delete(req.params.id);
    if (!deleted) {
      return sendError(res, 404, 'NOT_FOUND', 'Mascota no encontrada.');
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
