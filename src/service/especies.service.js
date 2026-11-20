const { models } = require('../libs/sequelize');

class especiesService {
    constructor(){}

    async create(data) {
        const res = await models.Especies.create(data);
        return res;
    }
    async find() {
        const res = await models.Especies.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.Especies.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.Especies.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Especie no encontrada');
        }
        await res.destroy();
        return res;
    }
}

module.exports = especiesService;