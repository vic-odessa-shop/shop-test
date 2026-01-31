require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Подключаем библиотеку
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const db = require('./db');
const { createPaymentLink } = require('./payments');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- НАСТРОЙКИ СЕРВЕРА (Middleware) ---
// ВНИМАНИЕ: CORS должен быть ВЫШЕ всех остальных настроек
app.use(cors({
    origin: '*', // Разрешает запросы с любого адреса (включая твой GitHub)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- API МАРШРУТ ДЛЯ ЗАКАЗОВ ---
app.post('/api/send-order', async (req, res) => {
    try {
        const { order, chat_id } = req.body;
        console.log(`[API] Получен новый заказ для CHAT_ID: ${chat_id}`);

        await bot.telegram.sendMessage(chat_id, order, { parse_mode: 'Markdown' });

        res.status(200).json({ success: true, message: "Order sent to Telegram" });
    } catch (e) {
        console.error("[API ERROR] Ошибка при отправке заказа:", e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Команда /start
bot.start(async (ctx) => {
    try {
        await db.upsertUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
        ctx.reply(`Вітаю, ${ctx.from.first_name}! 🍕 Обирайте найкраще в нашому магазині:`,
            Markup.keyboard([
                [Markup.button.webApp('Відкрити Магазин', process.env.WEB_APP_URL)]
            ]).resize()
        );
    } catch (e) {
        console.error("Помилка в команді start:", e);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

bot.launch()
    .then(() => console.log('✅ Бот успешно запущен'))
    .catch((err) => console.error('❌ Ошибка запуска бота:', err));