const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');

router.post('/register', userController.register);
router.post('/create-admin', userController.createAdmin);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/recover-password', userController.recoverPassword);

// Ruta protegida
router.get('/me', auth, userController.me);

module.exports = router;
