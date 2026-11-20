const { models } = require('../libs/sequelize');

class proveedoresService {
    constructor(){}

    async create(data) {
        const res = await models.Proveedores.create(data);
        return res;
    }
    async find() {
        const res = await models.Proveedores.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.Proveedores.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.Proveedores.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Proveedor no encontrado');
        }
        await res.destroy();
        return res;
    }
}

module.exports = proveedoresService;