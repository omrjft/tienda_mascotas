const sequelize = require('../libs/sequelize');
const { models } = sequelize;
const empleadosService = require('../service/empleados.service');
const { hashPassword } = require('../libs/auth');
const { sendSuccess, sendError } = require('../libs/http');
const service = new empleadosService();

const create = async (req, res) => {
  try {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const puesto = typeof req.body.puesto === 'string' ? req.body.puesto.trim() : '';
    const fecha_ingreso = req.body.fecha_ingreso;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!nombre || !puesto || !fecha_ingreso || !email) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Nombre, puesto, correo electrónico y fecha de ingreso requeridos.');
    }
    if (!['Gerente', 'Empleado'].includes(puesto)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Puesto inválido. Debe ser Gerente o Empleado.');
    }

    const result = await sequelize.transaction(async (t) => {
      let usuarioId = null;
      if (password) {
        const exists = await models.Usuarios.findOne({ where: { email }, transaction: t });
        if (exists) {
          const err = new Error('El correo electrónico ya está registrado en usuarios.');
          err.status = 409;
          err.code = 'EMAIL_EXISTS';
          throw err;
        }
        const usuario = await models.Usuarios.create({
          email,
          password: hashPassword(password),
          rol: puesto === 'Gerente' ? 'gerente' : 'empleado',
          activo: true
        }, { transaction: t });
        usuarioId = usuario.id;
      }

      const empleado = await models.Empleados.create({
        nombre,
        puesto,
        email,
        fecha_ingreso,
        usuarioId
      }, { transaction: t });

      return empleado;
    });

    return sendSuccess(res, result, 201);
  } catch (error) {
    if (error.status) {
      return sendError(res, error.status, error.code, error.message);
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
    if (!item) return sendError(res, 404, 'NOT_FOUND', 'Empleado no encontrado.');
    return sendSuccess(res, item);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', error.message);
  }
};

const update = async (req, res) => {
  try {
    const patch = {};
    if (req.body.nombre !== undefined) patch.nombre = String(req.body.nombre).trim();
    if (req.body.puesto !== undefined) {
      if (!['Gerente', 'Empleado'].includes(req.body.puesto)) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Puesto inválido.');
      }
      patch.puesto = req.body.puesto;
    }
    if (req.body.fecha_ingreso !== undefined) patch.fecha_ingreso = req.body.fecha_ingreso;

    if (Object.keys(patch).length === 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'No se enviaron campos para actualizar.');
    }

    const employee = await service.findOne(req.params.id);
    if (!employee) {
      return sendError(res, 404, 'NOT_FOUND', 'Empleado no encontrado.');
    }
    if (employee.puesto === 'Gerente' && patch.puesto === 'Empleado') {
      return sendError(res, 403, 'MANAGER_DEMOTION_FORBIDDEN', 'No se puede cambiar el puesto de un gerente a empleado.');
    }

    await service.update(req.params.id, patch);
    const updated = await service.findOne(req.params.id);
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
