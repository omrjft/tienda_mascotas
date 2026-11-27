/**
 * Cliente HTTP centralizado para la API REST (/api).
 * Cumple con AGENTS.md:
 * - credentials: 'same-origin'
 * - contrato { data } / { error: { code, message, details } }
 * - manejo explícito de errores de red, 401, 403 y validación
 */

class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const { method = 'GET', body = null } = options;
  const headers = {
    'X-Requested-With': 'XMLHttpRequest'
  };

  if (body !== null && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers,
      body: body !== null && body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (networkErr) {
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor. Verifica tu conexión.');
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (response.status !== 204 && contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errObj = payload && payload.error ? payload.error : {};
    const message = errObj.message || (payload && payload.message) || `Error HTTP ${response.status}`;
    const code = errObj.code || `HTTP_${response.status}`;
    const details = errObj.details || null;
    throw new ApiError(response.status, code, message, details);
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }
  return payload;
}

const Api = {
  ApiError,

  auth: {
    me: () => request('/auth/me'),
    login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
    register: (data) => request('/auth/register', { method: 'POST', body: data }),
    logout: () => request('/auth/logout', { method: 'POST' })
  },

  public: {
    getMascotas: () => request('/public/mascotas'),
    getMascota: (id) => request(`/public/mascotas/${id}`),
    getProductos: () => request('/public/productos'),
    getProducto: (id) => request(`/public/productos/${id}`)
  },

  mascotas: {
    list: () => request('/mascotas'),
    get: (id) => request(`/mascotas/${id}`),
    create: (data) => request('/mascotas', { method: 'POST', body: data }),
    update: (id, data) => request(`/mascotas/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/mascotas/${id}`, { method: 'DELETE' })
  },

  productos: {
    list: () => request('/productos'),
    get: (id) => request(`/productos/${id}`),
    create: (data) => request('/productos', { method: 'POST', body: data }),
    update: (id, data) => request(`/productos/${id}`, { method: 'PUT', body: data }),
    remove: (id) => request(`/productos/${id}`, { method: 'DELETE' })
  },

  especies: {
    list: () => request('/especies'),
    create: (data) => request('/especies', { method: 'POST', body: data })
  },

  razas: {
    list: () => request('/razas'),
    create: (data) => request('/razas', { method: 'POST', body: data })
  },

  categorias: {
    list: () => request('/categorias_productos'),
    create: (data) => request('/categorias_productos', { method: 'POST', body: data })
  },

  proveedores: {
    list: () => request('/proveedores'),
    create: (data) => request('/proveedores', { method: 'POST', body: data })
  },

  clientes: {
    list: () => request('/clientes'),
    create: (data) => request('/clientes', { method: 'POST', body: data })
  },

  empleados: {
    list: () => request('/empleados'),
    create: (data) => request('/empleados', { method: 'POST', body: data }),
    update: (id, data) => request(`/empleados/${id}`, { method: 'PUT', body: data })
  },

  ventas: {
    list: () => request('/ventas'),
    get: (id) => request(`/ventas/${id}`),
    create: (data) => request('/ventas', { method: 'POST', body: data })
  }
};

window.Api = Api;
window.ApiError = ApiError;
