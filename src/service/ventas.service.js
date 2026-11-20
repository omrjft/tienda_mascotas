const { models } = require('../libs/sequelize');

class ventasService {
    constructor(){}

    async create(data) {
        const res = await models.Ventas.create(data);
        return res;
    }
    async find() {
        const res = await models.Ventas.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.Ventas.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.Ventas.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Venta no encontrada');
        }
        await res.destroy();
        return res;
    }
}

module.exports = ventasService;