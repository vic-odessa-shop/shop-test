require('dotenv').config();
const express = require('express');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');

// Импортируем твои файлы (те самые, что мы создали)
const db = require('./db');
const { createPaymentLink } = require('./payments');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Настройки сервера
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- Команды Бота ---

bot.start(async (ctx) => {
    try {
        // Проверяем/создаем юзера в базе
        await db.upsertUser(ctx.from.id, ctx.from.username, ctx.from.first_name);

        ctx.reply(`Вітаю, ${ctx.from.first_name}! 🌯🚲`,
            Markup.keyboard([
                [Markup.button.webApp('Відкрити Магазин', process.env.WEB_APP_URL)]
            ]).resize()
        );
    } catch (e) {
        console.error("Помилка в команді start:", e);
    }
});

// Слушаем данные из Web App
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        const orderId = await db.createOrder(ctx.from.id, data.items, data.totalPrice);
        const paymentUrl = createPaymentLink(data.totalPrice, `Замовлення №${orderId}`, orderId);

        await ctx.reply(`Замовлення №${orderId} сформовано! Сума: ${data.totalPrice} грн.`,
            Markup.inlineKeyboard([
                [Markup.button.url('💳 Оплатити', paymentUrl)]
            ])
        );
    } catch (e) {
        console.error("Ошибка приема данных:", e);
    }
});

// --- API для фронтенда ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.getProducts();
        res.json(products);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Запуск
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер працює на порту ${PORT}`));

bot.launch().then(() => console.log('🤖 Бот запущений'));