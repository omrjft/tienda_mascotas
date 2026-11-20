const { models } = require('../libs/sequelize');

class detalleVentasProductosService {
    constructor(){}

    async create(data) {
        const res = await models.DetalleVentasProductos.create(data);
        return res;
    }
    async find() {
        const res = await models.DetalleVentasProductos.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.DetalleVentasProductos.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.DetalleVentasProductos.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Detalle de venta no encontrado');
        }
        await res.destroy();
        return res;
    }
}

module.exports = detalleVentasProductosService;