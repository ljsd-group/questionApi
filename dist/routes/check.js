import { Hono } from 'hono';
import { db } from '../db/client.js';
import { responses } from '../db/schema.js';
import { success, error } from '../utils/response.js';
import { validateDeviceId } from '../utils/validator.js';
import { eq } from 'drizzle-orm';

const check = new Hono();

check.post('/check-device', async (c) => {
    try {
        let body;
        try {
            body = await c.req.json();
        } catch (e) {
            return c.json(error('无效的请求格式，请确保发送正确的JSON数据', 400), 400);
        }

        const { deviceId } = body;
        if (!deviceId) {
            return c.json(error('缺少设备ID', 400), 400);
        }

        // 验证设备ID
        if (!validateDeviceId(deviceId)) {
            return c.json(error('无效的设备ID', 400), 400);
        }

        // 检查设备是否已提交过答卷
        const existingResponse = await db
            .select()
            .from(responses)
            .where(eq(responses.deviceId, deviceId))
            .limit(1);

        return c.json(success({
            hasSubmitted: existingResponse.length > 0
        }), 200);
    } catch (err) {
        console.error('检查设备失败:', err);
        return c.json(error('检查设备失败', 500), 500);
    }
});

export default check; 