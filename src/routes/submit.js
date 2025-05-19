import { Hono } from 'hono';
import { db } from '../db/client.js';
import { responses, answers } from '../db/schema.js';
import { success, error } from '../utils/response.js';
import { validateDeviceId, validateLanguage, validateAnswerContent } from '../utils/validator.js';

const submit = new Hono();

submit.post('/submit-response', async (c) => {
    try {
        let body;
        try {
            body = await c.req.json();
        } catch (e) {
            return c.json(error('无效的请求格式，请确保发送正确的JSON数据', 400), 400);
        }

        const { deviceId, language, answers: answerList, completedAt } = body;

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
        // if (!validateLanguage(language)) {
        //     return c.json(error('无效的语言设置', 400), 400);
        // }

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
        }

        // 使用事务保存数据
        const result = await db.transaction(async (tx) => {
            // 创建答卷记录
            const [response] = await tx
                .insert(responses)
                .values({
                    deviceId,
                    language,
                    completedAt: completedAt ? new Date(completedAt) : new Date()
                })
                .returning();

            // 保存答案记录
            const answerValues = answerList.map(answer => ({
                responseId: response.id,
                questionKey: answer.questionKey,
                answerContent: answer.answer,
                answeredTime: answer.answeredTime
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