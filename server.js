const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./src/libs/sequelize');
const routerApi = require('./src/router');


dotenv.config();
const app = express();

// Parsear el body de las peticiones en formato JSON
app.use(express.json());

// Rutas de tu API
routerApi(app);

app.get('/', (req, res) => {
  res.send('esta es la api por defecto');
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