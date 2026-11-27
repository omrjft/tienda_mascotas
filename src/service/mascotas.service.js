const { models } = require('../libs/sequelize');

class mascotasService {
  async create(data) {
    const created = await models.Mascotas.create({
      id_raza: data.id_raza,
      id_proveedor: data.id_proveedor,
      fecha_nacimiento: data.fecha_nacimiento,
      precio: data.precio,
      estado: data.estado || 'Disponible'
    });
    return this.findOne(created.id);
  }

  async find() {
    return models.Mascotas.findAll({
      include: [
        {
          model: models.Razas,
          as: 'raza',
          attributes: ['id', 'nombre', 'id_especie'],
          include: [
            {
              model: models.Especies,
              as: 'especie',
              attributes: ['id', 'nombre']
            }
          ]
        },
        {
          model: models.Proveedores,
          as: 'proveedor',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['id', 'ASC']]
    });
  }

  async findOne(id) {
    return models.Mascotas.findByPk(id, {
      include: [
        {
          model: models.Razas,
          as: 'raza',
          attributes: ['id', 'nombre', 'id_especie'],
          include: [
            {
              model: models.Especies,
              as: 'especie',
              attributes: ['id', 'nombre']
            }
          ]
        },
        {
          model: models.Proveedores,
          as: 'proveedor',
          attributes: ['id', 'nombre']
        }
      ]
    });
  }

  async update(id, data) {
    const item = await models.Mascotas.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return this.findOne(id);
  }

  async delete(id) {
    const item = await models.Mascotas.findByPk(id);
    if (!item) return null;
    await item.destroy();
    return item;
  }
}

module.exports = mascotasService;
