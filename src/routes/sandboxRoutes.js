const express = require('express');
const router = express.Router();
const { uploadSingle, requireFile } = require('../middlewares/sandboxUpload');
const ctrl = require('../controllers/sandbox.controller');

router.get('/moderation/ping', ctrl.ping);
router.post('/moderation/upload', uploadSingle, requireFile, ctrl.uploadAnalysis);

module.exports = router;
