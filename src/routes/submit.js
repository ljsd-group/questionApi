import { Hono } from 'hono';
import { getDB } from '../db/index.js';
import { responses, answers } from '../db/schema.js';
import { success, error } from '../utils/response.js';
import { validateDeviceId } from '../utils/validator.js';
import { eq } from 'drizzle-orm';

const submit = new Hono();

// 获取当前时间（UTC+8）
const getCurrentTime = () => {
    const now = new Date();
    // 获取当前时区的偏移量（分钟）
    const timezoneOffset = now.getTimezoneOffset();
    now.setHours(now.getHours() + 8);
    // 计算UTC时间
    const utcTime = new Date(now.getTime() + (timezoneOffset * 60 * 1000));
    // 从UTC时间计算UTC+8时间
    const utc8Time = new Date(utcTime.getTime() + (8 * 60 * 60 * 1000));
    return utc8Time;
};

// 将时间戳转换为UTC+8时间
const convertTimestampToUTC8 = (timestamp) => {
    try {
        // 确保时间戳是数字
        const ts = Number(timestamp);
        if (isNaN(ts)) {
            throw new Error('无效的时间戳');
        }
        // 创建日期对象
        const date = new Date(ts);
        if (isNaN(date.getTime())) {
            throw new Error('无效的日期');
        }
        return new Date(date.getTime() + (8 * 60 * 60 * 1000));
    } catch (err) {
        console.error('时间戳转换失败:', err, '时间戳:', timestamp);
        // 如果转换失败，返回当前时间
        return getCurrentTime();
    }
};

submit.post('/submit-response', async (c) => {
    try {
        let body;
        try {
            body = await c.req.json();
        } catch (e) {
            return c.json(error('无效的请求格式，请确保发送正确的JSON数据', 500), 200);
        }

        const { deviceId, language, answers: answerList } = body;

        // 验证参数
        if (!deviceId) {
            return c.json(error('缺少设备ID', 500), 200);
        }
        if (!validateDeviceId(deviceId)) {
            return c.json(error('无效的设备ID', 500), 200);
        }

        if (!language) {
            return c.json(error('缺少语言设置', 500), 200);
        }

        if (!Array.isArray(answerList) || answerList.length === 0) {
            return c.json(error('无效的答案数据', 500), 200);
        }

        // 验证答案内容
        for (const answer of answerList) {
            if (!answer.questionKey) {
                return c.json(error('缺少问题标识', 500), 200);
            }
            if (!answer.answer) {
                return c.json(error('缺少答案内容', 500), 200);
            }
            if (!Array.isArray(answer.answer)) {
                return c.json(error('答案内容必须是数组格式', 500), 200);
            }
            if (!answer.answeredTime) {
                return c.json(error('缺少答题时间', 500), 200);
            }
        }

        // 获取新的数据库连接
        const db = getDB(c.env);

        // 检查设备ID是否存在
        const existingResponse = await db
            .select()
            .from(responses)
            .where(eq(responses.deviceId, deviceId))
            .limit(1);

        let response;
        if (existingResponse.length > 0) {
            // 更新现有记录
            [response] = await db
                .update(responses)
                .set({
                    language,
                    completedAt: getCurrentTime()
                })
                .where(eq(responses.deviceId, deviceId))
                .returning();

            // 删除旧的答案记录
            await db
                .delete(answers)
                .where(eq(answers.responseId, response.id));
        } else {
            // 创建新记录
            [response] = await db
                .insert(responses)
                .values({
                    deviceId,
                    language,
                    completedAt: getCurrentTime()
                })
                .returning();
        }

        // 保存答案记录
        const answerValues = answerList.map(answer => ({
            responseId: response.id,
            questionKey: answer.questionKey,
            answerContent: answer.answer,
            answeredTime: convertTimestampToUTC8(answer.answeredTime)
        }));

        await db.insert(answers).values(answerValues);

        return c.json(success(response), 200);
    } catch (err) {
        console.error('提交答卷失败:', err);
        return c.json(error('提交答卷失败', 500), 200);
    }
});

export default submit; 