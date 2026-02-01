require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Константы из .env
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Путь к админке
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// --- API ДЛЯ АДМИНКИ (СОХРАНЕНИЕ) ---
app.post('/api/admin/save', async (req, res) => {
    const { password, data, filename } = req.body;

    // 1. Проверка пароля
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Неверный пароль!' });
    }

    try {
        const filePath = `public/${filename}`;
        const headers = { Authorization: `token ${GITHUB_TOKEN}` };

        // 2. Получаем SHA файла
        const getFile = await axios.get(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, { headers });
        const sha = getFile.data.sha;

        // 3. Отправляем обновление в GitHub
        await axios.put(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
            message: `Admin update: ${filename}`,
            content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
            sha: sha
        }, { headers });

        res.json({ success: true });
    } catch (e) {
        console.error('GitHub Error:', e.response?.data || e.message);
        res.status(500).json({ error: 'Ошибка GitHub API' });
    }
});

// --- ПРИЕМ ЗАКАЗА ---
app.post('/api/send-order', async (req, res) => {
    const { order, chat_id, cart } = req.body;
    try {
        await bot.telegram.sendMessage(chat_id || process.env.TARGET_CHAT_ID, order, { parse_mode: 'HTML' });
        // Здесь можно вызвать функцию списания остатков (как в прошлый раз)
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));