const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { sequelize, initializeDatabase } = require('./src/libs/database');
const routerApi = require('./src/router');


dotenv.config();
const app = express();

// Parsear el body de las peticiones en formato JSON
app.use(express.json());

// Servir archivos estáticos del frontend (public)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de tu API
routerApi(app);

// SPA fallback para servir el frontend
app.get('/{*path}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await initializeDatabase();
    await new Promise((resolve, reject) => {
      const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        resolve(server);
      });
      server.once('error', reject);
    });
  } catch (error) {
    console.error('Unable to start application:', error);
    await sequelize.close();
    process.exitCode = 1;
  }
}

startServer();