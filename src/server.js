require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
//  app.use(cors());
// Найти и заменить блок с app.use(cors()...
app.use(cors({
    origin: '*', // Разрешить запросы ототовсюду
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Переменные окружения
const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.replace(/\s/g, '');
const GITHUB_REPO = process.env.GITHUB_REPO?.trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();
const TG_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.TARGET_CHAT_ID;

// Хранилище для защиты от дублей
let lastOrders = new Map();

app.get('/', (req, res) => res.send('🚀 VIC ODESSA Server is Active'));

// ОТПРАВКА ЗАКАЗА С ЗАЩИТОЙ
app.post('/api/send-order', async (req, res) => {
    const { order, total } = req.body;

    // Создаем уникальный ключ заказа (текст + сумма)
    const orderKey = `${order}_${total}`;
    const now = Date.now();

    // Если такой заказ уже был в последние 40 секунд — игнорируем
    if (lastOrders.has(orderKey) && (now - lastOrders.get(orderKey) < 40000)) {
        console.log("🚫 Заблокирован дубль заказа");
        return res.json({ success: true, message: "Duplicate ignored" });
    }

    // Запоминаем текущий заказ
    lastOrders.set(orderKey, now);

    const message = `<b>🔔 НОВИЙ ЗАКАЗ!</b>\n\n${order}\n\n<b>СУМА: ${total} ₴</b>`;

    try {
        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        res.json({ success: true });
    } catch (e) {
        console.error("TG Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// АДМИНКА (без изменений)
app.post('/api/admin/save', async (req, res) => {
    const { password, data, filename } = req.body;
    if (password?.toString() !== ADMIN_PASSWORD) return res.status(403).json({ error: 'Pass error' });
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
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('🚀 Brain Server active'));