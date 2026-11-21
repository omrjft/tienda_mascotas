const { models } = require('../libs/sequelize');

class usuariosService {
    constructor(){}

    async create(data) {
        const res = await models.Usuarios.create(data);
        return res;
    }
    async find() {
        const res = await models.Usuarios.findAll();
        return res;
    }
    async findOne(id) {
        const res = await models.Usuarios.findByPk(id);
        return res;
    }
    async update(id, data) {
        const res = await models.Usuarios.update(data, {
            where: { id: id }
        });
        return res;
    }
    async delete(id){
        const res = await this.findOne(id);
        if(!res){
            throw new Error('Usuario no encontrado');
        }
        await res.destroy();
        return res;
    }
}

module.exports = usuariosService;