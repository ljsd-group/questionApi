import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 加载环境变量
config({ path: join(__dirname, '../../.env') });

// 构建数据库连接URL
export const getDatabaseUrl = () => {
    return process.env.DATABASE_URL || "postgresql://stock-question_owner:npg_OqrNj3SDlH2M@ep-withered-resonance-a46siw1o-pooler.us-east-1.aws.neon.tech/stock-question?sslmode=require";
}; 