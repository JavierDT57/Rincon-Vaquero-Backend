const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);      // Registro para usuarios
router.post('/create-admin', userController.createAdmin); // Registro para Admin meidante postman
router.post('/login', userController.login);            // Login
router.post('/recover-password', userController.recoverPassword); //Recuperar contrasena


module.exports = router;
