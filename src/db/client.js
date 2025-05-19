import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { getDatabaseUrl } from '../config/index.js';

// 创建数据库连接
const connectionString = getDatabaseUrl();
const client = postgres(connectionString, {
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

export const db = drizzle(client, { schema }); 