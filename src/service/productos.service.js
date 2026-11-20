const { models } = require('../libs/sequelize');

class productosService {
    constructor(){}

    async create(data) {
        const res = await models.Productos.create(data);
        return res;
    }
    async find() {
        const res = await models.Productos.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.Productos.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.Productos.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Producto no encontrado');
        }
        await res.destroy();
        return res;
    }
}

module.exports = productosService;