import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// 创建数据库连接函数
export function createConnection(env) {
    const client = postgres(env.DATABASE_URL, {
        max: 10,
        idle_timeout: 30000,
        connect_timeout: 10,
        connection: {
            timezone: 'Asia/Shanghai'
        },
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
