require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Загрузка настроек
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.replace(/\s/g, '') : '';
const GITHUB_REPO = process.env.GITHUB_REPO ? process.env.GITHUB_REPO.trim() : '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';
const TG_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// --- ПУТЬ ДЛЯ ЗАКАЗОВ (Исправляет 404) ---
app.post('/api/send-order', async (req, res) => {
    const { order, cart } = req.body;

    // Формируем текст для Telegram
    let message = `<b>🔔 НОВЫЙ ЗАКАЗ!</b>\n\n${order}\n\n<b>Состав:</b>\n`;
    // Мы не знаем названий из корзины (там только ID),
    // поэтому просто выведем структуру, пока ты не настроишь передачу имен.
    message += `<pre>${JSON.stringify(cart, null, 2)}</pre>`;

    try {
        // Отправка в телеграм
        if (TG_TOKEN && CHAT_ID) {
            const tgUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
            await axios.post(tgUrl, {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            });
        }

        console.log('✅ Заказ отправлен в TG');
        res.json({ success: true });
    } catch (e) {
        console.error('❌ Ошибка заказа:', e.message);
        res.status(500).json({ error: 'Ошибка при отправке заказа' });
    }
});

// --- ПУТЬ ДЛЯ АДМИНКИ (Работающий) ---
app.post('/api/admin/save', async (req, res) => {
    const { password, data, filename } = req.body;
    if (password?.toString() !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Невірний пароль!' });
    }
    const headers = { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' };
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/public/${filename}`;
    try {
        const getFile = await axios.get(url, { headers });
        await axios.put(url, {
            message: 'Admin update',
            content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
            sha: getFile.data.sha
        }, { headers });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: `GitHub API: ${e.message}` });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));