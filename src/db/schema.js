import { pgTable, serial, varchar, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

// 答卷表
export const responses = pgTable('responses', {
    id: serial('id').primaryKey(),
    deviceId: varchar('device_id', { length: 100 }).notNull(),
    language: varchar('language', { length: 10 }).notNull(), // 'zh', 'en', 'ja'
    createdAt: timestamp('created_at').defaultNow(),
    completedAt: timestamp('completed_at')
});

// 答案表
export const answers = pgTable('answers', {
    id: serial('id').primaryKey(),
    responseId: integer('response_id').references(() => responses.id),
    questionKey: varchar('question_key', { length: 50 }).notNull(),
    answerContent: jsonb('answer_content').notNull(),
    answeredTime: timestamp('answered_time'),
    createdAt: timestamp('created_at').defaultNow()
}); 