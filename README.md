# tienda_mascotas

## Desarrollo local

1. Instala Node.js y PostgreSQL.
2. Copia `.env.example` a `.env` y configura `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.
3. Instala dependencias con `npm install`.
4. Inicia la aplicación con `npm start`.

Al arrancar, el servidor espera la conexión, crea las tablas que falten y aplica las migraciones pendientes de `src/migrations`. Las migraciones aplicadas quedan registradas en `SequelizeMeta`. El seed también inicializa la base antes de insertar sus datos: `node .\src\scripts\seed.js`.

No uses `sequelize.sync({ alter: true })` en producción; los cambios de esquema deben agregarse como nuevas migraciones numeradas.
