require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Синхронизация с твоими именами на Render
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.replace(/\s/g, '') : '';
const GITHUB_REPO = process.env.GITHUB_REPO ? process.env.GITHUB_REPO.trim() : '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';
const TG_TOKEN = process.env.BOT_TOKEN; // Твое имя на Render
const CHAT_ID = process.env.TARGET_CHAT_ID; // Твое имя на Render

app.post('/api/send-order', async (req, res) => {
    const { order, cart } = req.body;

    // Формируем красивый текст
    const message = `<b>🔔 НОВЫЙ ЗАКАЗ!</b>\n\n${order}\n\n<i>Проверьте админку для деталей.</i>`;

    try {
        if (TG_TOKEN && CHAT_ID) {
            await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            });
            console.log('✅ Отправлено в TG');
        } else {
            console.error('❌ Ошибка: BOT_TOKEN или TARGET_CHAT_ID не найдены');
        }
        res.json({ success: true });
    } catch (e) {
        console.error('❌ Ошибка TG API:', e.response?.data || e.message);
        res.status(500).json({ error: 'Ошибка отправки в Telegram' });
    }
});

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
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server live. ChatID: ${CHAT_ID ? 'OK' : 'ERR'}`));