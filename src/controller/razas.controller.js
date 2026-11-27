const razasService = require('../service/razas.service');
const { sendSuccess, sendError } = require('../libs/http');
const service = new razasService();

const create = async (req, res) => {
  try {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const id_especie = parseInt(req.body.id_especie, 10);

    if (!nombre || Number.isNaN(id_especie)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Nombre e id_especie son requeridos.');
    }

    const created = await service.create({ nombre, id_especie });
    return sendSuccess(res, created, 201);
  } catch (error) {
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
    if (!item) return sendError(res, 404, 'NOT_FOUND', 'Raza no encontrada.');
    return sendSuccess(res, item);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const update = async (req, res) => {
  try {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const id_especie = parseInt(req.body.id_especie, 10);
    if (!nombre || Number.isNaN(id_especie)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Nombre e id_especie requeridos.');
    }
    const updated = await service.update(req.params.id, { nombre, id_especie });
    if (!updated) return sendError(res, 404, 'NOT_FOUND', 'Raza no encontrada.');
    return sendSuccess(res, updated);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const _delete = async (req, res) => {
  try {
    const deleted = await service.delete(req.params.id);
    if (!deleted) return sendError(res, 404, 'NOT_FOUND', 'Raza no encontrada.');
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
