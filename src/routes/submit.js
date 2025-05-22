import { Hono } from 'hono';
import { getDB } from '../db/index.js';
import { responses, answers } from '../db/schema.js';
import { success, error } from '../utils/response.js';
import { validateDeviceId } from '../utils/validator.js';
import { eq } from 'drizzle-orm';

const submit = new Hono();

// 获取当前 UTC 时间
const getCurrentTime = () => {
    return new Date();
};

// 将时间戳转换为 UTC 时间
const convertTimestampToUTC = (timestamp) => {
    try {
        const ts = Number(timestamp);
        if (isNaN(ts)) {
            throw new Error('无效的时间戳');
        }
        return new Date(ts);
    } catch (err) {
        console.error('时间戳转换失败:', err, '时间戳:', timestamp);
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
            if (!answer.questionContetn) {
                return c.json(error('缺少问题内容', 500), 200);
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
            questionTitle: answer.questionContetn,
            answerContent: answer.answer,
            answeredTime: convertTimestampToUTC(answer.answeredTime)
        }));

        await db.insert(answers).values(answerValues);
        const list = [
            { lan: 'ja', imgurl: 'https://img.aimetaaid.com/stock-app-line.jpg', href: "https://www.tradetutorvideosao.top" },
            { lan: 'en', imgurl: 'https://img.aimetaaid.com/stock-app-whatsapp.jpg', href: 'https://app.tradetutorvideo.net' }
        ];

        // 根据 language 匹配 list 中的 lan，如果匹配不到则使用 'ja'
        const matchedItem = list.find(item => item.lan === response.language) || list.find(item => item.lan === 'en');

        // 将匹配到的数据解构到 response 中
        const result = {
            ...response,
            ...matchedItem
        };

        return c.json(success(result), 200);
    } catch (err) {
        console.error('提交答卷失败:', err);
        return c.json(error('提交答卷失败', 500), 200);
    }
});

export default submit; 