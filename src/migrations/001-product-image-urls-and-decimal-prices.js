async function up({ sequelize, transaction }) {
  await sequelize.query('ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "imagen" VARCHAR(2048)', { transaction });
  await sequelize.query('ALTER TABLE "mascotas" ADD COLUMN IF NOT EXISTS "imagen" VARCHAR(2048)', { transaction });
  await sequelize.query(
    'ALTER TABLE "productos" ALTER COLUMN "precio" TYPE DECIMAL(10, 2) USING ROUND("precio"::numeric, 2)',
    { transaction }
  );
  await sequelize.query(
    'ALTER TABLE "mascotas" ALTER COLUMN "precio" TYPE DECIMAL(10, 2) USING ROUND("precio"::numeric, 2)',
    { transaction }
  );
}

module.exports = { up };
