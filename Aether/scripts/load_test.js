// Aether 知识库系统压测脚本
// 使用方式: k6 run scripts/load_test.js
//
// 前提: Aether 服务已启动 (docker-compose up)
// 且数据库中已上传测试文档

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const latencyTrend = new Trend('latency_ms');
const p99Trend = new Trend('p99_ms');

// 测试配置
export const options = {
    stages: [
        { duration: '30s', target: 50 },   // 爬升到 50 并发
        { duration: '1m', target: 100 },    // 爬升到 100 并发
        { duration: '2m', target: 200 },    // 爬升到 200 QPS
        { duration: '1m', target: 200 },    // 维持 200 QPS
        { duration: '30s', target: 0 },     // 下降
    ],
    thresholds: {
        http_req_duration: ['p(99)<300'],   // P99 < 300ms
        errors: ['rate<0.01'],              // 错误率 < 1%
    },
};

// 搜索查询队列（模拟真实用户行为）
const searchQueries = [
    'Golang goroutine 并发编程',
    'pgvector HNSW 索引配置',
    'LRU 缓存淘汰策略',
    '向量降维 random projection',
    'PostgreSQL 全文检索 tsvector',
    '余弦相似度余弦距离',
    'Docker Compose 部署',
    '混合检索融合排序 BM25',
    '知识库系统架构设计',
    '语义搜索 embedding 向量',
    'Go 语言垃圾回收机制',
    'HNSW ef_search 参数调优',
    '缓存命中率近似缓存',
    'pgvector 安装与配置',
    'Goroutine channel 通信',
    'PostgreSQL GIN 索引',
    'FNV-1a 哈希碰撞概率',
    '微服务云原生架构',
    '文档切片分块召回',
    '512 维向量存储优化',
];

// 基础 URL，通过环境变量配置
const BASE_URL = __ENV.AETHER_URL || 'http://localhost:8080';

export default function () {
    // 随机选择一个搜索查询
    const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
    const topK = [5, 10, 20][Math.floor(Math.random() * 3)];

    // 发送搜索请求
    const url = `${BASE_URL}/api/search?q=${encodeURIComponent(query)}&top_k=${topK}`;

    const startTime = Date.now();
    const response = http.get(url, {
        headers: { 'Accept': 'application/json' },
        timeout: '5s',
    });
    const latency = Date.now() - startTime;

    // 记录延迟
    latencyTrend.add(latency);

    // 检查响应
    const success = check(response, {
        '状态码 200': (r) => r.status === 200,
        '响应时间 < 3s': () => latency < 3000,
        '返回 JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('json'),
    });

    errorRate.add(!success);

    if (!success) {
        console.error(`请求失败: ${url} 状态码=${response.status} 延迟=${latency}ms`);
    }

    // 模拟用户思考间隔 (0.5s ~ 3s)
    sleep(Math.random() * 2.5 + 0.5);
}

// 测试完成后输出汇总报告
export function handleSummary(data) {
    const metrics = data.metrics;
    const p99 = metrics.http_req_duration ? metrics.http_req_duration.values['p(99)'] : 0;
    const avg = metrics.http_req_duration ? metrics.http_req_duration.values['avg'] : 0;
    const qps = metrics.http_reqs ? metrics.http_reqs.values['rate'] : 0;

    console.log('========================================');
    console.log('Aether 性能压测报告');
    console.log('========================================');
    console.log(`QPS:       ${(qps).toFixed(2)}`);
    console.log(`平均延迟:   ${avg.toFixed(2)} ms`);
    console.log(`P99 延迟:   ${p99.toFixed(2)} ms`);
    console.log(`错误率:     ${(metrics.errors ? metrics.errors.values['rate'] : 0) * 100}%`);
    console.log(`总请求数:   ${metrics.http_reqs ? metrics.http_reqs.values['count'] : 0}`);
    console.log('========================================');

    return {
        'stdout': textSummary(data, { indent: '  ', enableColor: true }),
    };
}
