import express from 'express'
import ClassesController from './controllers/ClassesController';
import ConnectionsControllers from './controllers/ConnectionsControllers';


const routes = express.Router();

const classesController = new ClassesController();
const connectionsControllers = new ConnectionsControllers();


routes.get('/', (request, response) =>{
    return response.json({
        message: 'Hiii lorenaaa!!'
    });
});

routes.get('/classes', classesController.index);
routes.post('/classes', classesController.create);

routes.get('/connectios', connectionsControllers.index);
routes.post('/connectios', connectionsControllers.create);

export default routes;