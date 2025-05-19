// 成功响应
export const success = (data = null, message = 'success') => {
    return {
        code: 200,
        message,
        data
    };
};

// 错误响应
export const error = (message = 'error', status = 500) => {
    return {
        code: status,
        message,
        data: null
    };
}; 