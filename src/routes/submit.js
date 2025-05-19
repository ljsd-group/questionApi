import { Hono } from 'hono';
import { db } from '../db/client.js';
import { responses, answers } from '../db/schema.js';
import { success, error } from '../utils/response.js';
import { validateDeviceId, validateLanguage, validateAnswerContent } from '../utils/validator.js';

const submit = new Hono();

submit.post('/submit-response', async (c) => {
    try {
        const { deviceId, language, answers: answerList } = await c.req.json();

        // 验证参数
        if (!validateDeviceId(deviceId)) {
            return c.json(error('无效的设备ID'));
        }
        if (!validateLanguage(language)) {
            return c.json(error('无效的语言设置'));
        }
        if (!Array.isArray(answerList) || answerList.length === 0) {
            return c.json(error('无效的答案数据'));
        }

        // 验证答案内容
        for (const answer of answerList) {
            if (!validateAnswerContent(answer.answerContent)) {
                return c.json(error('无效的答案内容'));
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
                    completedAt: new Date()
                })
                .returning();

            // 保存答案记录
            const answerValues = answerList.map(answer => ({
                responseId: response.id,
                questionKey: answer.questionKey,
                answerContent: answer.answerContent,
                answeredTime: answer.answeredTime
            }));

            await tx.insert(answers).values(answerValues);

            return response;
        });

        return c.json(success(result));
    } catch (err) {
        console.error('提交答卷失败:', err);
        return c.json(error('提交答卷失败'));
    }
});

export default submit; 