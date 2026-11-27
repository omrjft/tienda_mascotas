const { SESSION_COOKIE_NAME, getSession, parseCookies } = require('../libs/auth');
const { sendError } = require('../libs/http');

/**
 * Adjunta req.user y req.sessionId si existe una cookie de sesión válida.
 */
function attachSession(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies[SESSION_COOKIE_NAME];
  const session = getSession(sid);
  if (session) {
    req.sessionId = sid;
    req.user = session.user;
  } else {
    req.sessionId = null;
    req.user = null;
  }
  next();
}

/**
 * Requiere usuario autenticado. Responde 401 si no hay sesión activa.
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Se requiere iniciar sesión para realizar esta operación.');
  }
  next();
}

/**
 * Requiere que el usuario autenticado tenga uno de los roles permitidos.
 * Roles en DB: 'gerente', 'empleado', 'cliente'
 */
function requireRole(...allowedRoles) {
  const normalized = allowedRoles.map(r => r.toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Se requiere iniciar sesión para realizar esta operación.');
    }
    const userRole = String(req.user.rol || '').toLowerCase();
    if (!normalized.includes(userRole)) {
      return sendError(res, 403, 'FORBIDDEN', 'No cuentas con permisos suficientes para realizar esta acción.');
    }
    next();
  };
}

/**
 * Protección CSRF y validación de origen para mutaciones con cookie.
 */
function csrfProtection(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  const host = req.headers.host;
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (host && originHost !== host) {
        return sendError(res, 403, 'CSRF_ORIGIN_MISMATCH', 'Origen de solicitud no permitido.');
      }
    } catch {
      return sendError(res, 403, 'CSRF_INVALID_ORIGIN', 'Cabecera Origin inválida.');
    }
  } else if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (host && refererHost !== host) {
        return sendError(res, 403, 'CSRF_REFERER_MISMATCH', 'Referer de solicitud no permitido.');
      }
    } catch {
      return sendError(res, 403, 'CSRF_INVALID_REFERER', 'Cabecera Referer inválida.');
    }
  }

  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return sendError(res, 403, 'CSRF_HEADER_REQUIRED', 'Cabecera de seguridad X-Requested-With requerida.');
  }

  next();
}

module.exports = {
  attachSession,
  requireAuth,
  requireRole,
  csrfProtection
};
