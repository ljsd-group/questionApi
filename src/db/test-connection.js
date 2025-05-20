import { getDatabaseUrl } from '../config/index.js';
import postgres from 'postgres';

async function testConnection() {
    const connectionString = getDatabaseUrl();
    console.log('尝试连接数据库...');
    console.log('连接URL:', connectionString);


    try {
        const client = postgres(connectionString, {
            max: 10,
            idle_timeout: 3000,
            connect_timeout: 10
        });

        // 测试连接
        const result = await client`SELECT 1 as test`;
        console.log('数据库连接成功！');
        console.log('测试查询结果:', result);

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