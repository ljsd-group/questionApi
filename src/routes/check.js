import { Hono } from 'hono';
import { db } from '../db/client.js';
import { responses } from '../db/schema.js';
import { success, error } from '../utils/response.js';
import { validateDeviceId } from '../utils/validator.js';
import { eq } from 'drizzle-orm';

const check = new Hono();

check.post('/check-device', async (c) => {
    try {
        const { deviceId } = await c.req.json();

        // 验证设备ID
        if (!validateDeviceId(deviceId)) {
            return c.json(error('无效的设备ID'));
        }

        // 检查设备是否已提交过答卷
        const existingResponse = await db
            .select()
            .from(responses)
            .where(eq(responses.deviceId, deviceId))
            .limit(1);

        return c.json(success({
            hasSubmitted: existingResponse.length > 0
        }));
    } catch (err) {
        console.error('检查设备失败:', err);
        return c.json(error('检查设备失败'));
    }
});

export default check; 