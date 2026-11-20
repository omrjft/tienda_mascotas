const { models } = require('../libs/sequelize');

class clientesService {
    constructor(){}

    async create(data) {
        const res = await models.Clientes.create(data);
        return res;
    }
    async find() {
        const res = await models.Clientes.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.Clientes.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.Clientes.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Cliente no encontrado');
        }
        await res.destroy();
        return res;
    }
}

module.exports = clientesService;