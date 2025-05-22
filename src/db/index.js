import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
// 创建数据库连接函数
export function createConnection(env) {
    // 优先使用环境变量中的数据库URL，如果没有则使用配置中的URL
    const connectionString = env.DATABASE_URL;
    const client = postgres(connectionString, {
        max: 10,
        idle_timeout: 30000,
        connect_timeout: 10,
        transform: {
            undefined: null
        }
    });

    return drizzle(client, { schema });
}

// 获取数据库实例
export function getDB(env) {
    return createConnection(env);
}
