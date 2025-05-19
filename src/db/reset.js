import { db } from './client.js';
import { sql } from 'drizzle-orm';

async function resetDatabase() {
    try {
        // 删除现有表
        await db.execute(sql`
            DROP TABLE IF EXISTS answers;
            DROP TABLE IF EXISTS responses;
        `);
        console.log('旧表删除成功');

        // 读取并执行新的建表SQL
        const { readFileSync } = await import('fs');
        const { join } = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = fileURLToPath(new URL('.', import.meta.url));

        const sqlContent = readFileSync(join(__dirname, '../../drizzle/0000_initial.sql'), 'utf8');
        await db.execute(sql.unsafe(sqlContent));
        console.log('新表创建成功');

    } catch (error) {
        console.error('数据库重置失败:', error);
        throw error;
    }
}

// 执行重置
resetDatabase().catch(console.error); 