// 验证设备ID
export const validateDeviceId = (deviceId) => {
    if (!deviceId || typeof deviceId !== 'string') {
        return false;
    }
    return true;
};

// 验证语言
export const validateLanguage = (language) => {
    const validLanguages = ['zh', 'en', 'ja'];
    return validLanguages.includes(language);
};

// 验证答案内容
export const validateAnswerContent = (content) => {
    if (!content || typeof content !== 'object') {
        return false;
    }
    return true;
}; 