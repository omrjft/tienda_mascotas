const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./src/libs/sequelize');
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

try{
  sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}