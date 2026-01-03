const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Новая функция для автоматического создания таблиц
const initDB = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS users (
            tg_id BIGINT PRIMARY KEY,
            username VARCHAR(255),
            first_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            image_url TEXT,
            is_available BOOLEAN DEFAULT TRUE
        );

        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            user_id BIGINT REFERENCES users(tg_id),
            items JSONB,
            total_amount DECIMAL(10, 2),
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(sql);
        console.log("✅ Таблиці в базі даних готові (або вже існували)");
    } catch (err) {
        console.error("❌ Помилка ініціалізації бази:", err);
    }
};

// Запускаем инициализацию сразу
initDB();

const query = (text, params) => pool.query(text, params);

const db = {
    getProducts: async () => {
        const res = await query('SELECT * FROM products WHERE is_available = TRUE ORDER BY id');
        return res.rows;
    },

    getUser: async (tgId) => {
        const res = await query('SELECT * FROM users WHERE tg_id = $1', [tgId]);
        return res.rows[0];
    },

    upsertUser: async (tgId, username, firstName) => {
        const sql = `
            INSERT INTO users (tg_id, username, first_name)
            VALUES ($1, $2, $3)
            ON CONFLICT (tg_id) DO UPDATE
            SET username = $2, first_name = $3
            RETURNING *;
        `;
        const res = await query(sql, [tgId, username, firstName]);
        return res.rows[0];
    },

    createOrder: async (userId, items, total) => {
        const sql = `
            INSERT INTO orders (user_id, items, total_amount)
            VALUES ($1, $2, $3)
            RETURNING id;
        `;
        const res = await query(sql, [userId, JSON.stringify(items), total]);
        return res.rows[0].id;
    }
};

module.exports = db;
