const { models } = require('../libs/sequelize');

class productosService {
  async create(data) {
    const created = await models.Productos.create({
      id_categoria_producto: data.id_categoria_producto,
      id_proveedor: data.id_proveedor,
      nombre: data.nombre,
      precio: data.precio,
      stock: data.stock ?? 0,
      imagen: data.imagen ?? null
    });
    return this.findOne(created.id);
  }

  async find() {
    return models.Productos.findAll({
      include: [
        {
          model: models.CategoriasProductos,
          as: 'categoria',
          attributes: ['id', 'nombre']
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
    return models.Productos.findByPk(id, {
      include: [
        {
          model: models.CategoriasProductos,
          as: 'categoria',
          attributes: ['id', 'nombre']
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
    const item = await models.Productos.findByPk(id);
    if (!item) return null;
    await item.update(data);
    return this.findOne(id);
  }

  async delete(id) {
    const item = await models.Productos.findByPk(id);
    if (!item) return null;
    await item.destroy();
    return item;
  }
}

module.exports = productosService;
