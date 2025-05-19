// 成功响应
export const success = (data = null, message = 'success') => {
    return {
        status: 200,
        message,
        data
    };
};

// 错误响应
export const error = (message = 'error', status = 500) => {
    return {
        status,
        message,
        data: null
    };
}; 