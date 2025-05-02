import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const express = require('express');

const router = express.Router();

router.get('/status', AppController.checkStatus);
router.get('/stats', AppController.getStats);
router.get('/', (_, res) => { res.send('Home Page'); });
router.post('/users', UsersController.postNew);
router.get('/users/me', UsersController.getMe);

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.post('/files', FilesController.postUpload)

export default router;
