const usuariosService = require('../service/usuarios.service');
const { hashPassword } = require('../libs/auth');
const { sendSuccess, sendError } = require('../libs/http');
const service = new usuariosService();

function sanitizeUsuario(u) {
  const plain = u.get ? u.get({ plain: true }) : u;
  return {
    id: plain.id,
    email: plain.email,
    rol: plain.rol,
    activo: plain.activo,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt
  };
}

const create = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const rol = typeof req.body.rol === 'string' ? req.body.rol.toLowerCase() : 'cliente';
    const activo = req.body.activo !== undefined ? Boolean(req.body.activo) : true;

    if (!email || !password || !['gerente', 'empleado', 'cliente'].includes(rol)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Datos de usuario inválidos.');
    }

    const created = await service.create({
      email,
      password: hashPassword(password),
      rol,
      activo
    });
    return sendSuccess(res, sanitizeUsuario(created), 201);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'EMAIL_EXISTS', 'El correo electrónico ya está registrado.');
    }
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const get = async (req, res) => {
  try {
    const list = await service.find();
    return sendSuccess(res, list.map(sanitizeUsuario));
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const getById = async (req, res) => {
  try {
    const item = await service.findOne(req.params.id);
    if (!item) return sendError(res, 404, 'NOT_FOUND', 'Usuario no encontrado.');
    return sendSuccess(res, sanitizeUsuario(item));
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const update = async (req, res) => {
  try {
    const patch = {};
    if (req.body.email !== undefined) patch.email = String(req.body.email).trim().toLowerCase();
    if (req.body.password !== undefined && req.body.password !== '') patch.password = hashPassword(req.body.password);
    if (req.body.rol !== undefined) patch.rol = String(req.body.rol).toLowerCase();
    if (req.body.activo !== undefined) patch.activo = Boolean(req.body.activo);

    await service.update(req.params.id, patch);
    const updated = await service.findOne(req.params.id);
    if (!updated) return sendError(res, 404, 'NOT_FOUND', 'Usuario no encontrado.');
    return sendSuccess(res, sanitizeUsuario(updated));
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
