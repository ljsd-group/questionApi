# 调查问卷后端API

基于Hono.js、Drizzle ORM和PostgreSQL的调查问卷后端API，部署在Cloudflare Workers上。

## 功能特性

- 设备验证：检查设备是否已提交过答卷
- 答卷提交：保存用户的问卷答案
- 多语言支持：支持中文、英文和日文
- 数据验证：确保提交的数据格式正确
- 事务处理：保证数据一致性

## 技术栈

- Hono.js：轻量级Web框架
- Drizzle ORM：类型安全的ORM
- PostgreSQL：关系型数据库
- Cloudflare Workers：边缘计算平台

## 开发环境设置

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
- 复制`.env.example`为`.env`
- 设置数据库连接信息

3. 运行开发服务器：
```bash
npm run dev
```

## 部署

1. 安装Wrangler CLI：
```bash
npm install -g wrangler
```

2. 登录Cloudflare：
```bash
wrangler login
```

3. 部署到Cloudflare Workers：
```bash
npm run deploy
```

## API接口

### 1. 检查设备
- 路径：`/api/check-device`
- 方法：POST
- 请求体：
```json
{
  "deviceId": "string"
}
```
- 响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "hasSubmitted": boolean
  }
}
```

### 2. 提交答卷
- 路径：`/api/submit-response`
- 方法：POST
- 请求体：
```json
{
  "deviceId": "string",
  "language": "string",
  "answers": [
    {
      "questionKey": "string",
      "answerContent": object,
      "answeredTime": number
    }
  ]
}
```
- 响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": number,
    "deviceId": "string",
    "language": "string",
    "createdAt": "string",
    "completedAt": "string"
  }
}
```

## 数据库结构

### responses表
- id: 主键
- deviceId: 设备ID
- language: 语言
- createdAt: 创建时间
- completedAt: 完成时间

### answers表
- id: 主键
- responseId: 答卷ID
- questionKey: 问题标识
- answerContent: 答案内容
- answeredTime: 回答用时
- createdAt: 创建时间

## 注意事项

1. 数据安全
   - 使用HTTPS
   - 验证输入数据
   - 防止SQL注入

2. 性能优化
   - 使用索引
   - 合理使用事务
   - 优化查询语句

3. 错误处理
   - 统一的错误响应格式
   - 详细的错误日志
   - 友好的错误提示

4. 多语言支持
   - 支持中文、英文、日文
   - 语言参数验证
   - 错误信息本地化

5. 监控告警
   - 错误日志记录
   - 性能监控
   - 异常告警 