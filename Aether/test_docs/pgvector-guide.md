# pgvector 向量检索指南

## 什么是 pgvector

pgvector 是 PostgreSQL 的扩展，为 PostgreSQL 提供了向量相似度搜索能力。它支持精确最近邻搜索和近似最近邻搜索（通过 HNSW 索引），使得 PostgreSQL 可以同时作为业务数据库和向量数据库使用。

## 安装与配置

### 安装 pgvector

在 PostgreSQL 16 上安装 pgvector 扩展：

```sql
CREATE EXTENSION vector;
```

### 创建向量表

```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(512)
);
```

## 支持的向量操作

pgvector 支持三种向量距离度量：

1. **余弦距离**（Cosine Distance）：`<=>` 操作符，适用于语义搜索
2. **欧氏距离**（L2 Distance）：`<->` 操作符
3. **内积**（Inner Product）：`<#>` 操作符

## HNSW 索引

HNSW（Hierarchical Navigable Small World）是目前最先进的 ANN 索引算法之一。pgvector 从 0.6.0 版本开始支持 HNSW 索引。

### 创建 HNSW 索引

```sql
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

关键参数：
- `m`：每个节点的最大连接数（默认 16），值越大召回率越高
- `ef_construction`：索引构建时的动态列表大小（默认 64），值越大索引质量越高

### 查询参数

```sql
SET hnsw.ef_search = 40;  -- 查询时搜索的动态列表大小
```

`ef_search` 越大，召回率越高但查询速度越慢。

## 混合检索方案

在实际应用中，单纯的向量检索往往不够。推荐使用混合检索（Hybrid Search），结合传统的关键词检索（BM25）和向量语义检索：

```sql
-- BM25 全文检索
SELECT * FROM items 
WHERE to_tsvector('simple', content) @@ plainto_tsquery('simple', 'search query');

-- 向量检索
SELECT * FROM items 
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector 
LIMIT 10;

-- 融合排序
-- final_score = α * BM25_norm + (1-α) * (1 - cosine_distance)
```

## 性能优化建议

1. 对向量列创建 HNSW 索引前，确保已有足够的测试数据
2. HNSW 索引是增量维护的，插入新数据后性能稳定
3. 对于小数据集（< 10K），精确搜索可能比 HNSW 更快
4. 定期执行 `ANALYZE` 以更新统计信息
5. 为减少存储开销，可考虑将 1536 维向量降维至 512 维

## 总结

pgvector 为 PostgreSQL 提供了生产级的向量检索能力，使得在一个数据库中同时管理业务数据和向量数据成为可能，极大地简化了架构复杂性。
