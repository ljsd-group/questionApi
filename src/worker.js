// 简化版的 Worker 入口点
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 简单路由系统
    if (path === '/') {
      return new Response("调查问卷 API 服务已启动", {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    
    if (path === '/api/status') {
      return new Response(JSON.stringify({
        status: "operational",
        timestamp: new Date().toISOString(),
        database: env.DATABASE_URL ? "已配置" : "未配置",
        message: "系统运行正常"
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    // 默认返回 404
    return new Response(JSON.stringify({
      code: 404,
      message: "接口不存在",
      data: null
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}; 