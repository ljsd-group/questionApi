import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { getDatabaseUrl, DATABASE } from '../config/index.js';

// 创建数据库连接
const connectionString = getDatabaseUrl();
const client = postgres(connectionString, {
    max: DATABASE.MAX_CONNECTIONS,
    idle_timeout: DATABASE.IDLE_TIMEOUT,
    connect_timeout: 10,
});

export const db = drizzle(client, { schema }); 