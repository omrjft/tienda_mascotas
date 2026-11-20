const { models } = require('../libs/sequelize');

class mascotasService {
    constructor(){}

    async create(data) {
        const res = await models.Mascotas.create(data);
        return res;
    }
    async find() {
        const res = await models.Mascotas.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.Mascotas.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.Mascotas.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Mascota no encontrada');
        }
        await res.destroy();
        return res;
    }
}

module.exports = mascotasService;