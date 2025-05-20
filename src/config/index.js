
// 构建数据库连接URL
export const getDatabaseUrl = (env) => {
    return "postgres://pguser:123456@localhost:5432/honostudy"
    //return "postgresql://neondb_owner:npg_ZFiyhNqxn6t9@ep-autumn-mode-abq99hds-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";
}; 