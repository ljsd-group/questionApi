// 环境变量获取函数
const getEnvString = (key, defaultValue) => {
    return process.env[key] || defaultValue;
};

const getEnvNumber = (key, defaultValue) => {
    const value = process.env[key];
    return value ? Number(value) : defaultValue;
};

// 数据库配置
export const DATABASE = {
    HOST: getEnvString('DB_HOST', 'localhost'),
    PORT: getEnvNumber('DB_PORT', 5432),
    USER: getEnvString('DB_USER', 'pguser'),
    PASSWORD: getEnvString('DB_PASSWORD', '123456'),
    NAME: getEnvString('DB_NAME', 'honostudy'),
    MAX_CONNECTIONS: getEnvNumber('DB_MAX_CONNECTIONS', 10),
    IDLE_TIMEOUT: getEnvNumber('DB_IDLE_TIMEOUT', 30000)
};

// 构建数据库连接URL
export const getDatabaseUrl = () => {
    const { HOST, PORT, USER, PASSWORD, NAME } = DATABASE;
    return `postgres://${USER}:${PASSWORD}@${HOST}:${PORT}/${NAME}`;
}; 