-- 创建答卷表
CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    language VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 创建答案表
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    response_id INTEGER REFERENCES responses(id),
    question_key VARCHAR(50) NOT NULL,
    answer_content JSONB NOT NULL,
    answered_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_responses_device_id ON responses(device_id);
CREATE INDEX IF NOT EXISTS idx_answers_response_id ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_key ON answers(question_key); 