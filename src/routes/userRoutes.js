const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');
const usersAdminCtrl = require('../controllers/usersAdminController');


router.post('/register', userController.register);
router.post('/create-admin', userController.createAdmin);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/recover-password', userController.recoverPassword);
// Endpoints de administración de usuarios (protegidos con admin)
router.get('/',    auth, requireAdmin, usersAdminCtrl.listUsers);
router.get('/:id', auth, requireAdmin, usersAdminCtrl.getUser);
router.put('/:id', auth, requireAdmin, usersAdminCtrl.updateUser);
router.delete('/:id', auth, requireAdmin, usersAdminCtrl.deleteUser);


// Ruta protegida
router.get('/me', auth, userController.me);

module.exports = router;
