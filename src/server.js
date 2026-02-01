require('dotenv').config(); // Загружает данные из .env
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

// --- ДАННЫЕ ИЗ ОКРУЖЕНИЯ ---
const BOT_TOKEN = process.env.BOT_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const TARGET_CHAT_ID = process.env.TARGET_CHAT_ID;

// Пути к файлам (учитываем, что server.js в /src, а файлы в /public)
const PRODUCTS_PATH = 'public/products.json';
const ORDERS_PATH = 'public/orders.json';

const app = express();
const bot = new Telegraf(BOT_TOKEN);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Доступ к админке
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// ФУНКЦИЯ ОБНОВЛЕНИЯ ГИТХАБА
async function updateGitHubStorage(cart, orderInfo) {
    try {
        const headers = {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json'
        };

        // 1. ОБНОВЛЯЕМ СКЛАД (products.json)
        const prodRes = await axios.get(`https://api.github.com/repos/${GITHUB_REPO}/contents/${PRODUCTS_PATH}`, { headers });
        let products = JSON.parse(Buffer.from(prodRes.data.content, 'base64').toString());

        Object.keys(cart).forEach(id => {
            const p = products.find(item => item.id == id);
            if (p && p.stock !== undefined && p.stock !== null) {
                p.stock -= cart[id];
                if (p.stock < 0) p.stock = 0;
            }
        });

        await axios.put(`https://api.github.com/repos/${GITHUB_REPO}/contents/${PRODUCTS_PATH}`, {
            message: "🛒 Списання залишків (авто)",
            content: Buffer.from(JSON.stringify(products, null, 2)).toString('base64'),
            sha: prodRes.data.sha
        }, { headers });

        // 2. ЗАПИСЫВАЕМ ЗАКАЗ (orders.json)
        const ordRes = await axios.get(`https://api.github.com/repos/${GITHUB_REPO}/contents/${ORDERS_PATH}`, { headers }).catch(() => null);
        let orders = [];
        let ordSha = null;

        if (ordRes) {
            orders = JSON.parse(Buffer.from(ordRes.data.content, 'base64').toString());
            ordSha = ordRes.data.sha;
        }

        orders.push({
            id: Date.now(),
            date: new Date().toLocaleString('uk-UA'),
            details: orderInfo,
            status: 'Новий'
        });

        await axios.put(`https://api.github.com/repos/${GITHUB_REPO}/contents/${ORDERS_PATH}`, {
            message: "📝 Нове замовлення в базу",
            content: Buffer.from(JSON.stringify(orders, null, 2)).toString('base64'),
            sha: ordSha
        }, { headers });

        console.log('✅ Склад та історія замовлень оновлені на GitHub');
    } catch (e) {
        console.error('❌ Помилка синхронізації з GitHub:', e.response?.data?.message || e.message);
    }
}

// ПРИЕМ ЗАКАЗА
app.post('/api/send-order', async (req, res) => {
    const { order, chat_id, cart } = req.body;

    try {
        // Отправка в ТГ
        await bot.telegram.sendMessage(chat_id || TARGET_CHAT_ID, order, { parse_mode: 'HTML' });

        // Если пришла корзина — запускаем обновление склада
        if (cart && Object.keys(cart).length > 0) {
            updateGitHubStorage(cart, order);
        }

        res.status(200).send({ success: true });
    } catch (error) {
        console.error('Ошибка:', error.message);
        res.status(500).send({ error: 'Помилка при відправці' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));