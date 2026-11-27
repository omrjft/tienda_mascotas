const clientesService = require('../service/clientes.service');
const { sendSuccess, sendError } = require('../libs/http');
const service = new clientesService();

const create = async (req, res) => {
  try {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const telefono = typeof req.body.telefono === 'string' && req.body.telefono.trim() ? req.body.telefono.trim() : 'N/A';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!nombre || !email) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Nombre y correo electrónico requeridos.');
    }

    const created = await service.create({ nombre, telefono, email });
    return sendSuccess(res, created, 201);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'EMAIL_EXISTS', 'Ya existe un cliente con ese correo electrónico.');
    }
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const get = async (req, res) => {
  try {
    const list = await service.find();
    return sendSuccess(res, list);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const getById = async (req, res) => {
  try {
    const item = await service.findOne(req.params.id);
    if (!item) return sendError(res, 404, 'NOT_FOUND', 'Cliente no encontrado.');
    return sendSuccess(res, item);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const update = async (req, res) => {
  try {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const telefono = typeof req.body.telefono === 'string' ? req.body.telefono.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!nombre || !telefono || !email) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Faltan campos requeridos.');
    }
    await service.update(req.params.id, { nombre, telefono, email });
    const updated = await service.findOne(req.params.id);
    if (!updated) return sendError(res, 404, 'NOT_FOUND', 'Cliente no encontrado.');
    return sendSuccess(res, updated);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const _delete = async (req, res) => {
  try {
    const deleted = await service.delete(req.params.id);
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
