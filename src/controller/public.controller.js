const { Op } = require('sequelize');
const { models } = require('../libs/sequelize');
const { sendSuccess, sendError } = require('../libs/http');

function mapPublicMascota(m) {
  return {
    id: m.id,
    raza_nombre: m.raza ? m.raza.nombre : 'Sin raza',
    especie: m.raza && m.raza.especie ? m.raza.especie.nombre : 'Mascota',
    fecha_nacimiento: m.fecha_nacimiento,
    precio: Number(m.precio),
    estado: m.estado
  };
}

function mapPublicProducto(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    categoria_nombre: p.categoria ? p.categoria.nombre : 'General',
    precio: Number(p.precio),
    stock: Number(p.stock)
  };
}

const getMascotas = async (req, res) => {
  try {
    const mascotas = await models.Mascotas.findAll({
      where: { estado: 'Disponible' },
      attributes: ['id', 'fecha_nacimiento', 'precio', 'estado'],
      include: [
        {
          model: models.Razas,
          as: 'raza',
          attributes: ['id', 'nombre'],
          include: [
            {
              model: models.Especies,
              as: 'especie',
              attributes: ['id', 'nombre']
            }
          ]
        }
      ],
      order: [['id', 'ASC']]
    });

    return sendSuccess(res, mascotas.map(mapPublicMascota));
  } catch (error) {
    console.error('Error en public getMascotas:', error);
    return sendError(res, 500, 'INTERNAL_ERROR', 'No se pudo cargar el catálogo público de mascotas.');
  }
};

const getMascotaById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'Identificador de mascota inválido.');
    }

    const mascota = await models.Mascotas.findOne({
      where: { id, estado: 'Disponible' },
      attributes: ['id', 'fecha_nacimiento', 'precio', 'estado'],
      include: [
        {
          model: models.Razas,
          as: 'raza',
          attributes: ['id', 'nombre'],
          include: [
            {
              model: models.Especies,
              as: 'especie',
              attributes: ['id', 'nombre']
            }
          ]
        }
      ]
    });

    if (!mascota) {
      return sendError(res, 404, 'NOT_FOUND', 'Mascota no disponible o no encontrada.');
    }

    return sendSuccess(res, mapPublicMascota(mascota));
  } catch (error) {
    console.error('Error en public getMascotaById:', error);
    return sendError(res, 500, 'INTERNAL_ERROR', 'No se pudo obtener el detalle de la mascota.');
  }
};

const getProductos = async (req, res) => {
  try {
    const productos = await models.Productos.findAll({
      where: { stock: { [Op.gt]: 0 } },
      attributes: ['id', 'nombre', 'precio', 'stock'],
      include: [
        {
          model: models.CategoriasProductos,
          as: 'categoria',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['id', 'ASC']]
    });

    return sendSuccess(res, productos.map(mapPublicProducto));
  } catch (error) {
    console.error('Error en public getProductos:', error);
    return sendError(res, 500, 'INTERNAL_ERROR', 'No se pudo cargar el catálogo público de productos.');
  }
};

const getProductoById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'Identificador de producto inválido.');
    }

    const producto = await models.Productos.findOne({
      where: { id, stock: { [Op.gt]: 0 } },
      attributes: ['id', 'nombre', 'precio', 'stock'],
      include: [
        {
          model: models.CategoriasProductos,
          as: 'categoria',
          attributes: ['id', 'nombre']
        }
      ]
    });

    if (!producto) {
      return sendError(res, 404, 'NOT_FOUND', 'Producto no disponible o no encontrado.');
    }

    return sendSuccess(res, mapPublicProducto(producto));
  } catch (error) {
    console.error('Error en public getProductoById:', error);
    return sendError(res, 500, 'INTERNAL_ERROR', 'No se pudo obtener el detalle del producto.');
  }
};

module.exports = {
  getMascotas,
  getMascotaById,
  getProductos,
  getProductoById
};
