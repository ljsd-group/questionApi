import { Hono } from 'hono';
import { db } from '../db/client.js';
import { responses, answers } from '../db/schema.js';
import { success, error } from '../utils/response.js';
import { validateDeviceId } from '../utils/validator.js';
import { eq } from 'drizzle-orm';

const submit = new Hono();

submit.post('/submit-response', async (c) => {
    try {
        let body;
        try {
            body = await c.req.json();
        } catch (e) {
            return c.json(error('无效的请求格式，请确保发送正确的JSON数据', 400), 400);
        }

        const { deviceId, language, answers: answerList } = body;

        // 验证参数
        if (!deviceId) {
            return c.json(error('缺少设备ID', 400), 400);
        }
        if (!validateDeviceId(deviceId)) {
            return c.json(error('无效的设备ID', 400), 400);
        }

        if (!language) {
            return c.json(error('缺少语言设置', 400), 400);
        }

        if (!Array.isArray(answerList) || answerList.length === 0) {
            return c.json(error('无效的答案数据', 400), 400);
        }

        // 验证答案内容
        for (const answer of answerList) {
            if (!answer.questionKey) {
                return c.json(error('缺少问题标识', 400), 400);
            }
            if (!answer.answer) {
                return c.json(error('缺少答案内容', 400), 400);
            }
            if (!Array.isArray(answer.answer)) {
                return c.json(error('答案内容必须是数组格式', 400), 400);
            }
            if (!answer.answeredTime) {
                return c.json(error('缺少答题时间', 400), 400);
            }
            // 验证答题时间是否为数字
            if (typeof answer.answeredTime !== 'number') {
                return c.json(error('答题时间必须是毫秒时间戳', 400), 400);
            }
        }

        // 使用事务保存数据
        const result = await db.transaction(async (tx) => {
            // 检查设备ID是否存在
            const existingResponse = await tx
                .select()
                .from(responses)
                .where(eq(responses.deviceId, deviceId))
                .limit(1);

            let response;
            if (existingResponse.length > 0) {
                // 更新现有记录
                [response] = await tx
                    .update(responses)
                    .set({
                        language,
                        completedAt: new Date()
                    })
                    .where(eq(responses.deviceId, deviceId))
                    .returning();

                // 删除旧的答案记录
                await tx
                    .delete(answers)
                    .where(eq(answers.responseId, response.id));
            } else {
                // 创建新记录
                [response] = await tx
                    .insert(responses)
                    .values({
                        deviceId,
                        language,
                        completedAt: new Date()
                    })
                    .returning();
            }

            // 保存答案记录
            const answerValues = answerList.map(answer => ({
                responseId: response.id,
                questionKey: answer.questionKey,
                answerContent: answer.answer,
                answeredTime: answer.answeredTime // 直接使用毫秒时间戳
            }));

            await tx.insert(answers).values(answerValues);

            return response;
        });

        return c.json(success(result), 200);
    } catch (err) {
        console.error('提交答卷失败:', err);
        return c.json(error('提交答卷失败', 500), 500);
    }
});

export default submit; 