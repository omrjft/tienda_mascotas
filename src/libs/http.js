/**
 * Helpers para respuestas HTTP estandarizadas según AGENTS.md:
 * Éxito: { data: ... }
 * Error: { error: { code, message, details } }
 */

function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ data });
}

function sendError(res, status, code, message, details = null) {
  const error = { code, message };
  if (details !== null && details !== undefined) {
    error.details = details;
  }
  return res.status(status).json({ error });
}

module.exports = {
  sendSuccess,
  sendError
};
