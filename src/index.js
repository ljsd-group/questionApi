import { Hono } from 'hono';
import { cors } from 'hono/cors';
import check from './routes/check.js';
import submit from './routes/submit.js';

const app = new Hono();

// 配置CORS
app.use('/*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
}));

// 注册路由
app.route('/api', check);
app.route('/api', submit);

// 错误处理
app.onError((err, c) => {
    console.error('服务器错误:', err);
    return c.json({
        code: 500,
        message: '服务器内部错误',
        data: null
    });
});

// 404处理
app.notFound((c) => {
    return c.json({
        code: 404,
        message: '接口不存在',
        data: null
    });
});

// 导出 Worker
export default {
    fetch: app.fetch
}; 