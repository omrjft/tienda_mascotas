const { models } = require('../libs/sequelize');

class empleadosService {
    constructor(){}

    async create(data) {
        const res = await models.Empleados.create(data);
        return res;
    }
    async find() {
        const res = await models.Empleados.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.Empleados.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.Empleados.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Empleado no encontrado');
        }
        await res.destroy();
        return res;
    }
}

module.exports = empleadosService;