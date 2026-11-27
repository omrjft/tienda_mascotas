const { Op } = require('sequelize');
const sequelize = require('../libs/sequelize');
const { models } = sequelize;
const {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie
} = require('../libs/auth');
const { sendSuccess, sendError } = require('../libs/http');

// Rate limiter simple en memoria para /api/auth/login
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 15;

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  record.count += 1;
  return true;
}

function mapDisplayRole(rol) {
  const r = String(rol || '').toLowerCase();
  if (r === 'gerente') return 'Gerente';
  if (r === 'empleado') return 'Empleado';
  return 'Cliente';
}

async function resolveProfileForUser(usuario) {
  const rol = String(usuario.rol || 'cliente').toLowerCase();
  const puesto = mapDisplayRole(rol);

  if (rol === 'cliente') {
    const cliente = await models.Clientes.findOne({
      where: {
        [Op.or]: [{ usuarioId: usuario.id }, { email: usuario.email }]
      }
    });
    return {
      id: usuario.id,
      email: usuario.email,
      rol,
      puesto: 'Cliente',
      nombre: cliente ? cliente.nombre : usuario.email.split('@')[0],
      id_cliente: cliente ? cliente.id : null,
      id_empleado: null
    };
  }

  // Para gerente / empleado, resolver registro en Empleados por usuarioId o email
  let empleado = await models.Empleados.findOne({
    where: {
      [Op.or]: [{ usuarioId: usuario.id }, { email: usuario.email }]
    }
  });
  if (!empleado) {
    empleado = await models.Empleados.findOne({
      where: { puesto }
    });
  }

  return {
    id: usuario.id,
    email: usuario.email,
    rol,
    puesto,
    nombre: empleado ? empleado.nombre : usuario.email.split('@')[0],
    id_empleado: empleado ? empleado.id : null,
    id_cliente: null
  };
}

const login = async (req, res) => {
  try {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    if (!checkLoginRateLimit(clientIp)) {
      return sendError(res, 429, 'RATE_LIMITED', 'Demasiados intentos de inicio de sesión. Intenta más tarde.');
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Correo electrónico y contraseña requeridos.');
    }

    const usuario = await models.Usuarios.findOne({ where: { email } });
    if (!usuario || !usuario.activo || !verifyPassword(password, usuario.password)) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
    }

    const publicUser = await resolveProfileForUser(usuario);
    const sid = createSession(publicUser);
    setSessionCookie(res, sid);

    return sendSuccess(res, { user: publicUser });
  } catch (error) {
    console.error('Error en login:', error);
    return sendError(res, 500, 'INTERNAL_ERROR', 'No se pudo procesar el inicio de sesión.');
  }
};

const me = async (req, res) => {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'No hay sesión activa.');
  }
  return sendSuccess(res, { user: req.user });
};

const logout = async (req, res) => {
  if (req.sessionId) {
    destroySession(req.sessionId);
  }
  clearSessionCookie(res);
  return sendSuccess(res, { loggedOut: true });
};

const register = async (req, res) => {
  try {
    const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
    const telefono = typeof req.body?.telefono === 'string' && req.body.telefono.trim() ? req.body.telefono.trim() : 'N/A';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!nombre || !email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Nombre, correo electrónico y contraseña requeridos.');
    }
    if (password.length < 6) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'La contraseña debe tener al menos 6 caracteres.');
    }

    const existingUser = await models.Usuarios.findOne({ where: { email } });
    const existingClient = await models.Clientes.findOne({ where: { email } });
    if (existingUser || existingClient) {
      return sendError(res, 409, 'EMAIL_EXISTS', 'El correo electrónico ya está registrado.');
    }

    const result = await sequelize.transaction(async (t) => {
      const usuario = await models.Usuarios.create({
        email,
        password: hashPassword(password),
        rol: 'cliente',
        activo: true
      }, { transaction: t });

      const cliente = await models.Clientes.create({
        nombre: nombre.slice(0, 50),
        telefono: telefono.slice(0, 20),
        email,
        usuarioId: usuario.id
      }, { transaction: t });

      return { usuario, cliente };
    });

    const publicUser = {
      id: result.usuario.id,
      email: result.usuario.email,
      rol: 'cliente',
      puesto: 'Cliente',
      nombre: result.cliente.nombre,
      id_cliente: result.cliente.id,
      id_empleado: null
    };

    const sid = createSession(publicUser);
    setSessionCookie(res, sid);

    return sendSuccess(res, { user: publicUser }, 201);
  } catch (error) {
    console.error('Error en register:', error);
    return sendError(res, 500, 'INTERNAL_ERROR', 'No se pudo completar el registro.');
  }
};

module.exports = {
  login,
  me,
  logout,
  register
};
