const especiesService = require('../service/especies.service');
const { sendSuccess, sendError } = require('../libs/http');
const service = new especiesService();

const create = async (req, res) => {
  try {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const habitat = typeof req.body.habitat === 'string' && req.body.habitat.trim() ? req.body.habitat.trim() : 'Doméstico';

    if (!nombre) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'El nombre de la especie es requerido.');
    }

    const created = await service.create({ nombre, habitat });
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
    if (!item) return sendError(res, 404, 'NOT_FOUND', 'Especie no encontrada.');
    return sendSuccess(res, item);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const update = async (req, res) => {
  try {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const habitat = typeof req.body.habitat === 'string' ? req.body.habitat.trim() : '';
    if (!nombre || !habitat) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Nombre y hábitat requeridos.');
    }
    await service.update(req.params.id, { nombre, habitat });
    const updated = await service.findOne(req.params.id);
    if (!updated) return sendError(res, 404, 'NOT_FOUND', 'Especie no encontrada.');
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
