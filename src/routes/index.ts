import express from 'express';
import AppController from '../controllers/AppController';

const router = express.Router();

router.get('/', AppController.getHello);

export default router;
