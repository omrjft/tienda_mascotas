const { models } = require('../libs/sequelize');

class razasService {
  async create(data) {
    const created = await models.Razas.create(data);
    return this.findOne(created.id);
  }

  async find() {
    return models.Razas.findAll({
      include: [{ model: models.Especies, as: 'especie', attributes: ['id', 'nombre'] }],
      order: [['id', 'ASC']]
    });
  }

  async findOne(id) {
    return models.Razas.findByPk(id, {
      include: [{ model: models.Especies, as: 'especie', attributes: ['id', 'nombre'] }]
    });
  }

  async update(id, data) {
    const item = await models.Razas.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return this.findOne(id);
  }

  async delete(id) {
    const item = await models.Razas.findByPk(id);
    if (!item) return null;
    await item.destroy();
    return item;
  }
}

module.exports = razasService;
