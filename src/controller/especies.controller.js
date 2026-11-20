const especiesService = require('../service/especies.service');
const service = new especiesService();

const create = async (req, res) => {
    try {
        //converitr el body a json
        console.log("esto es lo que te llega de la peticion: ", req.body);
        //verificar si el body tiene los campos requeridos
        if (!req.body.nombre || !req.body.habitat) {
            return res.status(400).send({ success: false, message: 'Faltan campos requeridos' });
        }
        //verificar que los datos sean correctos
        if (typeof req.body.nombre !== 'string' || typeof req.body.habitat !== 'string') {
            return res.status(400).send({ success: false, message: 'Los campos deben ser del tipo correcto' });
        }
        //vamos a crear la especie
        const response = await service.create(req.body);
        res.json({ success: true, data: response });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
}
const get = async (req, res) => {
    try{
        const response = await service.find();
        res.json(response);
    }
    catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
}
const getById = async (req, res) => {
    try{
        const response = await service.findOne(req.params.id);
        res.json(response);
    }
    catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
}
const update = async (req, res) => {
    try{
        //verificar si el body tiene los campos requeridos
        if (!req.body.nombre || !req.body.habitat) {
            return res.status(400).send({ success: false, message: 'Faltan campos requeridos' });
        }
        //verificar que los datos sean correctos
        if (typeof req.body.nombre !== 'string' || typeof req.body.habitat !== 'string') {
            return res.status(400).send({ success: false, message: 'Los campos deben ser del tipo correcto' });
        }
        const response = await service.update(req.params.id, req.body);
        res.json(response);
    }
    catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
}
const _delete = async (req, res) => {
    try{
        const response = await service.delete(req.params.id);
        res.json(response);
    }
    catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
}

module.exports = {
    create,
    get,
    getById,
    update,
    delete: _delete
}
