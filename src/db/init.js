import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { getDatabaseUrl } from '../config/index.js';
import { responses } from './schema.js';
import { db } from './index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 获取当前时间（UTC+8）
const getCurrentTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 8);
    return now;
};

async function initDatabase() {
    let sql;
    try {
        // 创建数据库连接
        sql = postgres(getDatabaseUrl());
        console.log('数据库连接成功');

        // 读取SQL文件
        const sqlContent = readFileSync(join(__dirname, '../../drizzle/0000_initial.sql'), 'utf8');
        console.log('SQL文件读取成功');

        // 执行SQL
        await sql.unsafe(sqlContent);
        console.log('数据库表创建成功！');

        // 测试数据插入
        const [response] = await db.insert(responses).values({
            deviceId: 'test_device_1',
            language: 'zh',
            completedAt: getCurrentTime()
        }).returning();

        console.log('测试数据插入成功！', response);

    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    } finally {
        // 确保关闭连接
        if (sql) {
            await sql.end();
        }
    }
}

// 执行初始化
initDatabase().catch(console.error); 