# 调查问卷后端API开发文档

## 项目概述

基于Hono.js框架开发调查问卷系统的后端API，提供数据存储和设备验证功能。后端将负责处理问卷提交数据并验证设备是否已完成问卷，确保每台设备只能填写一次问卷。

## 技术栈

- **框架**: Hono.js
- **ORM**: Drizzle
- **数据库**: PostgreSQL
- **部署**: Cloudflare Workers

## 数据库设计 (使用Drizzle)

### 数据库模型定义

```javascript
// src/db/schema.js
import { pgTable, serial, varchar, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

// 答卷表
export const responses = pgTable('responses', {
  id: serial('id').primaryKey(),
  deviceId: varchar('device_id', { length: 100 }).notNull(),
  language: varchar('language', { length: 10 }).notNull(), // 'zh', 'en', 'ja'
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at')
});

// 答案表
export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  responseId: integer('response_id').references(() => responses.id),
  questionKey: varchar('question_key', { length: 50 }).notNull(),
  answerContent: jsonb('answer_content').notNull(),
  answeredTime: integer('answered_time'), // 回答用时（毫秒）
  createdAt: timestamp('created_at').defaultNow()
});
```

## API接口设计

### 1. 校验设备是否已填写

#### 接口信息
- **路径**: /api/check-device
- **方法**: GET
- **功能**: 验证特定设备是否已经完成问卷

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| deviceId | string | 是 | 设备唯一标识符 |

#### 响应数据
```json
{
  "code": 200,
  "data": {
    "submitted": true/false,
    "submittedAt": "2023-05-19T10:00:00Z" // 如果已提交，返回提交时间
  }
}
```

#### 错误响应
```json
{
  "code": 400,
  "message": "参数错误，缺少deviceId"
}
```

```json
{
  "code": 500,
  "message": "服务器内部错误"
}
```

### 2. 保存提交答卷数据

#### 接口信息
- **路径**: /api/submit-response
- **方法**: POST
- **功能**: 保存用户的问卷回答数据

#### 请求参数
```json
{
  "deviceId": "device123456",
  "language": "zh-CN",
  "answers": [
    {
      "questionContetn": "1、问题的内容",
      "answer": ["是"],
      "answeredTime": 200
    },
    {
      "questionKey": "2、问题的内容",
      "answer": ["1~3年"],
      "answeredTime": 150
    }
  ],
  "completedAt": "2023-05-19T10:02:00Z"
}
```

#### 响应数据
```json
{
  "code": 200,
  "data": {
    "responseId": 12345,
    "message": "问卷提交成功"
  }
}
```

#### 错误响应
```json
{
  "code": 400,
  "message": "参数错误，请检查提交数据"
}
```

```json
{
  "code": 409,
  "message": "该设备已提交过问卷"
}
```

```json
{
  "code": 500,
  "message": "服务器内部错误"
}
```

## 代码实现

### 项目结构
```
/
├── src/
│   ├── index.js         // 入口文件
│   ├── db/
│   │   ├── schema.js    // 数据库模型定义
│   │   └── client.js    // 数据库连接
│   ├── routes/
│   │   ├── check.js     // 设备验证接口
│   │   └── submit.js    // 提交问卷接口
│   └── utils/
│       ├── validator.js // 数据验证
│       └── response.js  // 响应格式化
├── drizzle/
│   └── migrations/      // 数据库迁移文件
├── drizzle.config.js    // Drizzle配置
├── wrangler.toml        // Cloudflare配置
└── package.json
```

### 入口文件 (index.js)
```javascript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { checkDevice } from './routes/check';
import { submitResponse } from './routes/submit';

const app = new Hono();

// CORS处理
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  maxAge: 86400,
}));

// 路由注册
app.get('/api/check-device', checkDevice);
app.post('/api/submit-response', submitResponse);

export default app;
```

### 数据库连接 (db/client.js)
```javascript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 创建连接池
const connectionString = process.env.DATABASE_URL;
const queryClient = postgres(connectionString);
const db = drizzle(queryClient, { schema });

export { db };
```

### 设备验证接口 (routes/check.js)
```javascript
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { responses } from '../db/schema';
import { successResponse, errorResponse } from '../utils/response';

export async function checkDevice(c) {
  try {
    const deviceId = c.req.query('deviceId');
    
    if (!deviceId) {
      return c.json(errorResponse(400, '参数错误，缺少deviceId'), 400);
    }

    const result = await db.select({ completedAt: responses.completedAt })
      .from(responses)
      .where(eq(responses.deviceId, deviceId))
      .orderBy(desc(responses.completedAt))
      .limit(1);

    if (result.length > 0) {
      return c.json(successResponse({
        submitted: true,
        submittedAt: result[0].completedAt
      }));
    }

    return c.json(successResponse({
      submitted: false
    }));
  } catch (error) {
    console.error('设备验证错误:', error);
    return c.json(errorResponse(500, '服务器内部错误'), 500);
  }
}
```

### 提交问卷接口 (routes/submit.js)
```javascript
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { responses, answers } from '../db/schema';
import { successResponse, errorResponse } from '../utils/response';

export async function submitResponse(c) {
  try {
    const { deviceId, language, answers: answerList, completedAt } = await c.req.json();
    
    if (!deviceId || !language || !Array.isArray(answerList) || answerList.length === 0) {
      return c.json(errorResponse(400, '参数错误，请检查提交数据'), 400);
    }

    // 检查设备是否已提交
    const existingResponse = await db.select({ id: responses.id })
      .from(responses)
      .where(eq(responses.deviceId, deviceId))
      .limit(1);

    if (existingResponse.length > 0) {
      return c.json(errorResponse(409, '该设备已提交过问卷'), 409);
    }

    // 使用事务提交答案
    return await db.transaction(async (tx) => {
      // 插入响应记录
      const [newResponse] = await tx.insert(responses)
        .values({
          deviceId,
          language,
          completedAt: completedAt || new Date().toISOString()
        })
        .returning({ id: responses.id });

      const responseId = newResponse.id;

      // 批量插入答案
      await tx.insert(answers)
        .values(
          answerList.map(answer => ({
            responseId,
            questionKey: answer.questionKey,
            answerContent: answer.answer,
            answeredTime: answer.answeredTime
          }))
        );

      return c.json(successResponse({
        responseId,
        message: '问卷提交成功'
      }));
    });
  } catch (error) {
    console.error('提交问卷错误:', error);
    return c.json(errorResponse(500, '服务器内部错误'), 500);
  }
}
```

### 响应格式化 (utils/response.js)
```javascript
export function successResponse(data) {
  return {
    code: 200,
    data
  };
}

export function errorResponse(code, message) {
  return {
    code,
    message
  };
}
```

### 数据验证 (utils/validator.js)
```javascript
export function validateDevice(deviceId) {
  return typeof deviceId === 'string' && deviceId.trim().length > 0;
}

export function validateResponse(data) {
  if (!data || typeof data !== 'object') return false;
  if (!validateDevice(data.deviceId)) return false;
  if (typeof data.language !== 'string' || !data.language) return false;
  if (!Array.isArray(data.answers) || data.answers.length === 0) return false;
  
  // 验证答案格式
  return data.answers.every(answer => (
    typeof answer.questionKey === 'string' && 
    answer.questionKey && 
    Array.isArray(answer.answer)
  ));
}
```

### Drizzle配置 (drizzle.config.js)
```javascript
import * as dotenv from 'dotenv';
dotenv.config();

/** @type {import('drizzle-kit').Config} */
export default {
  schema: './src/db/schema.js',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
};
```

## 部署说明

### 1. 环境准备
```bash
npm init -y
npm install hono drizzle-orm postgres
npm install -D drizzle-kit wrangler
```

### 2. 创建数据库结构
```bash
# 生成迁移文件
npx drizzle-kit generate

# 应用迁移
npx drizzle-kit push
```

### 3. Wrangler配置 (wrangler.toml)
```toml
name = "questionnaire-api"
main = "src/index.js"
compatibility_date = "2023-01-01"

[vars]
DATABASE_URL = "postgres://username:password@your-postgres-host/database"

[build]
command = "npm run build"

# 配置秘钥
# [secrets]
# DATABASE_URL
```

### 4. 构建与部署
```bash
# 本地开发测试
npx wrangler dev

# 部署到Cloudflare Workers
npx wrangler publish
```

## 注意事项

1. **数据安全**
   - 确保数据库连接字符串作为环境变量或秘钥存储
   - 接口可考虑增加简单的鉴权机制，防止恶意提交

2. **性能优化**
   - Cloudflare Workers有执行时间限制(10-50ms)，优化数据库查询性能
   - 使用连接池管理数据库连接
   - 考虑使用Cloudflare D1作为替代方案

3. **错误处理**
   - 完善的日志记录机制
   - 适当的错误反馈给客户端
   - 处理网络问题和数据库连接失败场景

4. **多语言支持**
   - 确保数据库结构正确存储多语言内容
   - API响应支持不同语言内容的返回

5. **扩展性**
   - 设计上考虑未来可能的需求变更
   - 问卷结构和配置可灵活调整

6. **AppsFlyer集成**
   - 可在API响应中添加特定字段，便于前端接入事件追踪
   - 或考虑在后端直接调用AppsFlyer API

7. **监控与告警**
   - 设置Cloudflare Workers的监控
   - 关键错误告警通知机制 