const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middlewares/auth');

const usersAdminCtrl = require('../controllers/usersAdminController');

router.post('/register', userController.register);
router.post('/create-admin', userController.createAdmin);
router.post('/login', userController.login);
router.post('/logout', requireAuth, userController.logout); 
router.post('/recover-password', userController.recoverPassword);

router.get('/me', requireAuth, userController.me);
router.get('/solo-admin', requireAuth, requireRole('admin'), userController.adminOnly);


router.get('/',     requireAuth, requireRole('admin'), usersAdminCtrl.listUsers);
router.get('/:id',  requireAuth, requireRole('admin'), usersAdminCtrl.getUser);
router.put('/:id',  requireAuth, requireRole('admin'), usersAdminCtrl.updateUser);
router.delete('/:id', requireAuth, requireRole('admin'), usersAdminCtrl.deleteUser);

module.exports = router;
