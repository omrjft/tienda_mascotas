const { models } = require('../libs/sequelize');

class detalleVentasMascotasService {
    constructor(){}

    async create(data) {
        const res = await models.DetalleVentasMascotas.create(data);
        return res;
    }
    async find() {
        const res = await models.DetalleVentasMascotas.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.DetalleVentasMascotas.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.DetalleVentasMascotas.update(data, {
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

module.exports = detalleVentasMascotasService;