-- ============================================================
-- Aether — 智能知识库系统: 数据库初始化脚本
-- PostgreSQL 16 + pgvector 扩展
-- ============================================================

-- 1. 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 文档表
CREATE TABLE IF NOT EXISTS documents (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    file_name   TEXT NOT NULL,
    content     TEXT NOT NULL,                     -- 原始文档全文
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 文档切片表
CREATE TABLE IF NOT EXISTS chunks (
    id              SERIAL PRIMARY KEY,
    document_id     INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index     INTEGER NOT NULL,               -- 切片序号
    content         TEXT NOT NULL,                  -- 切片原文
    embedding       vector(512),                    -- 降维后的向量 (1536→512)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 为 BM25 全文检索创建 tsvector 列 (GENERATED ALWAYS)
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS tsvector_content tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', coalesce(content, ''))) STORED;

-- 4. BM25 全文索引 (GIN)
CREATE INDEX IF NOT EXISTS idx_chunks_tsvector
    ON chunks USING GIN (tsvector_content);

-- 5. HNSW 向量索引 (cosine distance)
--    m = 16, ef_construction = 64
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
    ON chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 6. 辅助索引
CREATE INDEX IF NOT EXISTS idx_chunks_document_id
    ON chunks (document_id);
