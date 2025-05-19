import { getDatabaseUrl, DATABASE } from '../config/index.js';
import postgres from 'postgres';

async function testConnection() {
    const connectionString = getDatabaseUrl();
    console.log('尝试连接数据库...');
    console.log('连接URL:', connectionString);
    console.log('配置信息:', DATABASE);

    try {
        const client = postgres(connectionString, {
            max: DATABASE.MAX_CONNECTIONS,
            idle_timeout: DATABASE.IDLE_TIMEOUT,
            connect_timeout: 10
        });

        // 测试连接
        const result = await client`SELECT 1 as test`;
        console.log('数据库连接成功！');
        console.log('测试查询结果:', result);

        // 测试数据库是否存在
        const dbResult = await client`
            SELECT datname 
            FROM pg_database 
            WHERE datname = ${DATABASE.NAME}
        `;

        if (dbResult.length === 0) {
            console.log(`数据库 ${DATABASE.NAME} 不存在`);
        } else {
            console.log(`数据库 ${DATABASE.NAME} 存在`);
        }

        // 关闭连接
        await client.end();
    } catch (error) {
        console.error('数据库连接失败:', error);
        console.error('错误详情:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
    }
}

// 执行测试
testConnection(); 