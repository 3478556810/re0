const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const fileController = require('../controllers/fileController');

// 所有管理接口都需要认证
router.use(auth);

// 保存 JSON 文件
router.post('/save-json', fileController.saveJson);

// 读取 JSON 文件
router.get('/load-json', fileController.loadJson);

// 列出可用文件
router.get('/list-files', fileController.listFiles);

module.exports = router;