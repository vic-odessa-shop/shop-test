require('dotenv').config();
const express = require('express');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const cors = require('cors'); // Подключаем CORS для связи фронтенда с бэкендом

// Твои локальные модули
const db = require('./db');
const { createPaymentLink } = require('./payments');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- НАСТРОЙКИ СЕРВЕРА (Middleware) ---
require('dotenv').config();
const express = require('express');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const cors = require('cors'); // 1. Убедись, что эта строка есть

const app = express();

// 2. ВНИМАНИЕ: Это должно стоять ВЫШЕ всех остальных app.use и app.post
app.use(cors({
    origin: '*', // Разрешает запросы с любого адреса (включая твой GitHub)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
// ... остальной код (static, bot, api) ...
// 1. Разрешаем запросы с других адресов (чтобы твой сайт мог достучаться до сервера на Render)
app.use(cors());

// 2. Учим сервер понимать JSON, который присылает сайт при оформлении заказа
app.use(express.json());

// 3. Раздаем статические файлы из папки public (картинки, стили и сам index.html)
app.use(express.static(path.join(__dirname, '../public')));

// --- НОВЫЙ API МАРШРУТ ДЛЯ ЗАКАЗОВ ---

/**
 * Этот эндпоинт принимает данные заказа от фронтенда (функция sendOrder).
 * Путь: https://твой-проект.onrender.com/api/send-order
 */
app.post('/api/send-order', async (req, res) => {
    try {
        const { order, chat_id } = req.body;

        console.log(`[API] Получен новый заказ для CHAT_ID: ${chat_id}`);

        // Отправляем сформированный текст заказа в Telegram
        // Используем Markdown для красивого форматирования (жирный текст, списки)
        await bot.telegram.sendMessage(chat_id, order, { parse_mode: 'Markdown' });

        // Отправляем ответ фронтенду, что всё прошло успешно
        res.status(200).json({ success: true, message: "Order sent to Telegram" });
    } catch (e) {
        console.error("[API ERROR] Ошибка при отправке заказа:", e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// --- ЛОГИКА ТЕЛЕГРАМ-БОТА ---

// Команда /start - приветствие и кнопка открытия магазина
bot.start(async (ctx) => {
    try {
        // Сохраняем или обновляем данные пользователя в БД
        await db.upsertUser(ctx.from.id, ctx.from.username, ctx.from.first_name);

        ctx.reply(`Вітаю, ${ctx.from.first_name}! 🌯🚲 Обирайте найкраще в нашому магазині:`,
            Markup.keyboard([
                [Markup.button.webApp('Відкрити Магазин', process.env.WEB_APP_URL)]
            ]).resize()
        );
    } catch (e) {
        console.error("Помилка в команді start:", e);
    }
});

// Обработка данных, если заказ отправляется через стандартный Telegram WebApp метод
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        // Создаем запись в БД о новом заказе
        const orderId = await db.createOrder(ctx.from.id, data.items, data.totalPrice);
        // Генерируем ссылку на оплату (WayForPay или аналог)
        const paymentUrl = createPaymentLink(data.totalPrice, `Замовлення №${orderId}`, orderId);

        await ctx.reply(`Замовлення №${orderId} сформовано! Сума: ${data.totalPrice} грн.`,
            Markup.inlineKeyboard([
                [Markup.button.url('💳 Оплатити', paymentUrl)]
            ])
        );
    } catch (e) {
        console.error("Помилка прийому даних WebApp:", e);
    }
});

// --- API ДЛЯ ПОЛУЧЕНИЯ ТОВАРОВ ---

// Эндпоинт, который отдает список товаров из БД для отрисовки на сайте
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.getProducts();
        res.json(products);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- ЗАПУСК СИСТЕМЫ ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен и слушает порт ${PORT}`);
});

// Запуск бота с обработкой ошибок старта
bot.launch()
    .then(() => console.log('🤖 Telegram Бот успешно запущен'))
    .catch((err) => console.error('❌ Ошибка запуска бота:', err));