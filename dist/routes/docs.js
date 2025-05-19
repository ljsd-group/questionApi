import { Hono } from 'hono';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';
import { fileURLToPath } from 'url';

const docs = new Hono();
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 读取swagger配置
const swaggerYaml = readFileSync(join(__dirname, '../../swagger.yaml'), 'utf8');
const swaggerSpec = parse(swaggerYaml);

// 提供swagger UI
docs.get('/docs', (c) => {
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>调查问卷API文档</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
        <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script>
            window.onload = function() {
                SwaggerUIBundle({
                    spec: ${JSON.stringify(swaggerSpec)},
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIBundle.SwaggerUIStandalonePreset
                    ],
                });
            }
        </script>
    </body>
    </html>
    `;
    return c.html(html);
});

export default docs; 