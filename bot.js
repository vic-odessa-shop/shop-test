const { Telegraf, Markup } = require('telegraf');
const http = require('http'); // Добавляем для Render

const bot = new Telegraf(process.env.BOT_TOKEN);
const webAppUrl = 'https://github.com/vic-odessa-shop/shop-test';

// --- Заглушка для Render (чтобы не падал) ---
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Health check server on port ${PORT}`));
// --------------------------------------------

bot.start((ctx) => {
    return ctx.reply(
        'Добро пожаловать в наш магазин! 🍕',
        Markup.keyboard([
            [Markup.button.webApp('Открыть меню', webAppUrl)]
        ]).resize()
    );
});

bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data);
        const itemsList = data.items.map(item => `• ${item}`).join('\n');

        await ctx.replyWithHTML(
            `<b>🛍 Новый заказ!</b>\n\n${itemsList}\n\n💰 <b>Итого: ${data.total_price} ₽</b>`
        );
    } catch (e) {
        ctx.reply('Ошибка обработки заказа.');
    }
});

bot.launch();