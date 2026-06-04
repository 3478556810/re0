const fs = require('fs');
const path = require('path');

// 数据文件根目录（相对于本文件）
const DATA_ROOT = path.join(__dirname, '..', '..', 'game-client', 'public', 'data');

/**
 * 保存 JSON 文件
 */
function saveJson(req, res) {
  const { filename, data } = req.body;
  
  if (!filename || data === undefined) {
    return res.status(400).json({ error: 'Missing filename or data' });
  }

  try {
    // 安全检查：防止路径穿越
    const safeName = path.basename(filename);
    // 如果有多级目录，需要保留子目录结构
    const relativePath = filename.replace(/\\/g, '/');
    const normalizedPath = path.normalize(relativePath);
    
    // 确保路径在 DATA_ROOT 内
    const fullPath = path.join(DATA_ROOT, normalizedPath);
    if (!fullPath.startsWith(DATA_ROOT)) {
      return res.status(403).json({ error: 'Path traversal detected' });
    }

    // 创建目录（如果不存在）
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
    
    res.json({ 
      success: true, 
      path: path.relative(DATA_ROOT, fullPath),
      size: fs.statSync(fullPath).size 
    });
  } catch (err) {
    console.error('保存文件失败:', err);
    res.status(500).json({ error: 'Write failed', details: err.message });
  }
}

/**
 * 读取 JSON 文件
 */
function loadJson(req, res) {
  const { filename } = req.query;
  
  if (!filename) {
    return res.status(400).json({ error: 'Missing filename' });
  }

  try {
    const relativePath = filename.replace(/\\/g, '/');
    const normalizedPath = path.normalize(relativePath);
    const fullPath = path.join(DATA_ROOT, normalizedPath);
    
    if (!fullPath.startsWith(DATA_ROOT)) {
      return res.status(403).json({ error: 'Path traversal detected' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (err) {
    console.error('读取文件失败:', err);
    res.status(500).json({ error: 'Read failed', details: err.message });
  }
}

/**
 * 列出数据目录下的所有 JSON 文件
 */
function listFiles(req, res) {
  try {
    const results = [];
    
    function walkDir(dir, basePath = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath, relativePath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          results.push(relativePath.replace(/\\/g, '/'));
        }
      }
    }

    walkDir(DATA_ROOT);
    res.json({ files: results });
  } catch (err) {
    res.status(500).json({ error: 'List failed', details: err.message });
  }
}

module.exports = {
  saveJson,
  loadJson,
  listFiles
};