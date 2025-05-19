import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

// 配置 Neon
neonConfig.wsProxy = (host) => `${host}:5432/v1`; // 配置 WebSocket 代理
neonConfig.useSecureWebSocket = true; // 使用安全的 WebSocket 连接
neonConfig.pipelineTLS = true; // 启用 TLS 管道
neonConfig.pipelineConnect = true; // 启用连接管道

// 创建数据库连接函数
export function createConnection(env) {
    const sql = neon(env.DATABASE_URL);
    return drizzle(sql, { schema });
}

// 获取数据库实例
export function getDB(env) {
    return createConnection(env);
}
