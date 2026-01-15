const crypto = require('crypto');

function createPaymentLink(amount, description, orderId) {
    const publicKey = process.env.LIQPAY_PUBLIC_KEY;
    const privateKey = process.env.LIQPAY_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
        return "https://www.liqpay.ua/api/3/checkout?data=test&signature=test";
    }

    const jsonDescription = {
        public_key: publicKey,
        version: 3,
        action: 'pay',
        amount: amount,
        currency: 'UAH',
        description: description,
        order_id: orderId,
        result_url: 'https://t.me/shop_vic_bot' // замени на имя своего бота
    };

    const data = Buffer.from(JSON.stringify(jsonDescription)).toString('base64');
    const signature = crypto
        .createHash('sha1')
        .update(privateKey + data + privateKey)
        .digest('base64');

    return `https://www.liqpay.ua/api/3/checkout?data=${data}&signature=${signature}`;
}

module.exports = { createPaymentLink };