const { models } = require('../libs/sequelize');

class categoriasProductosService {
    constructor(){}

    async create(data) {
        const res = await models.CategoriasProductos.create(data);
        return res;
    }
    async find() {
        const res = await models.CategoriasProductos.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.CategoriasProductos.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.CategoriasProductos.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Categoría de producto no encontrada');
        }
        await res.destroy();
        return res;
    }
}

module.exports = categoriasProductosService;