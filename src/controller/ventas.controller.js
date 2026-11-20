const ventasService = require('../service/ventas.service');
const service = new ventasService();

const create = async (req, res) => {
    try {
        //converitr el body a json
        console.log("esto es lo que te llega de la peticion: ", req.body);
        //verificar si el body tiene los campos requeridos
        if (!req.body.id_cliente || !req.body.id_empleado || !req.body.fecha_hora || !req.body.total) {
            return res.status(400).send({ success: false, message: 'Faltan campos requeridos' });
        }
        //verificar que los datos sean correctos
        if (typeof req.body.id_cliente !== 'number' || typeof req.body.id_empleado !== 'number' || typeof req.body.fecha_hora !== 'string' || typeof req.body.total !== 'number') {
            return res.status(400).send({ success: false, message: 'Los campos deben ser del tipo correcto' });
        }
        //vamos a crear la venta
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
        if (!req.body.id_cliente || !req.body.id_empleado || !req.body.fecha_hora || !req.body.total) {
            return res.status(400).send({ success: false, message: 'Faltan campos requeridos' });
        }
        //verificar que los datos sean correctos
        if (typeof req.body.id_cliente !== 'number' || typeof req.body.id_empleado !== 'number' || typeof req.body.fecha_hora !== 'string' || typeof req.body.total !== 'number') {
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
