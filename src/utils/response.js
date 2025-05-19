// 成功响应
export const success = (data = null, message = 'success') => {
    return {
        code: 0,
        message,
        data
    };
};

// 错误响应
export const error = (message = 'error', code = 1) => {
    return {
        code,
        message,
        data: null
    };
}; 