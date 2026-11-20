const { models } = require('../libs/sequelize');

class razasService {
    constructor(){}

    async create(data) {
        const res = await models.Razas.create(data);
        return res;
    }
    async find() {
        const res = await models.Razas.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.Razas.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.Razas.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Raza no encontrada');
        }
        await res.destroy();
        return res;
    }
}

module.exports = razasService;