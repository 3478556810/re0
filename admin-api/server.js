const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// 路由
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Admin API running at http://localhost:${PORT}`);
});