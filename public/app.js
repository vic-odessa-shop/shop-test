const tg = window.Telegram?.WebApp || null;

let cart = {};
let isSending = false;
let showingConfirmClear = false;

// ==== товары (пример) ====
const products = [
    { id: 1, name: 'Товар 1', price: 100 },
    { id: 2, name: 'Товар 2', price: 150 },
    { id: 3, name: 'Товар 3', price: 200 }
];

// ==== render товаров ====
function renderProducts(items) {
    const wrap = document.getElementById('products');
    wrap.innerHTML = '';

    items.forEach(p => {
        const count = cart[p.id] || 0;

        wrap.innerHTML += `
            <div class="card">
                <b>${p.name}</b><br>
                ${p.price} грн<br>
                <button class="count-btn"
                    onclick="addToCart(${p.id})">
                    ${count ? count : '+'}
                </button>
            </div>
        `;
    });
}

renderProducts(products);

// ==== корзина ====
function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    renderProducts(products);
}

function openCart() {
    updateCartUI();
    document.getElementById('order-ui').style.display = 'block';
}

function lockUI() {
    document.getElementById('ui-lock').style.display = 'block';
}

function unlockUI() {
    document.getElementById('ui-lock').style.display = 'none';
}

// ==== UI корзины ====
function updateCartUI() {
    const box = document.getElementById('order-ui');

    if (showingConfirmClear) {
        box.innerHTML = `
            <h3 style="color:red">Видалити всі товари?</h3>
            <button onclick="cancelClear()">Відмінити</button>
            <button style="background:red;color:white" onclick="confirmClear()">Підтвердити</button>
        `;
        return;
    }

    let html = '<h3>Ваше замовлення</h3>';
    let sum = 0;

    for (const id in cart) {
        const p = products.find(x => x.id == id);
        sum += p.price * cart[id];
        html += `<div>${p.name} × ${cart[id]}</div>`;
    }

    html += `
        <p><b>Ітого: ${sum} грн</b></p>
        <input id="name" placeholder="Імʼя">
        <input id="phone" placeholder="Телефон">
        <button onclick="sendOrder()">Пiдтвердити замовлення</button>
        <button style="background:red;color:white" onclick="cancelOrder()">Очистити</button>
    `;

    box.innerHTML = html;
}

function cancelOrder() {
    showingConfirmClear = true;
    lockUI();
    updateCartUI();
}

function cancelClear() {
    showingConfirmClear = false;
    unlockUI();
    updateCartUI();
}

function confirmClear() {
    cart = {};
    showingConfirmClear = false;
    unlockUI();
    document.getElementById('order-ui').style.display = 'none';
    renderProducts(products);
}

// ==== отправка заказа ====
async function sendOrder() {
    if (isSending) return;

    const name = document.getElementById('name')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();

    if (!name || !phone) {
        alert('Заповніть імʼя та телефон');
        return;
    }

    isSending = true;

    const userId = tg?.initDataUnsafe?.user?.id || 'PC-USER';

    let text = `🛒 Нове замовлення\nID: ${userId}\nІмʼя: ${name}\nТелефон: ${phone}\n\n`;

    for (const id in cart) {
        const p = products.find(x => x.id == id);
        text += `${p.name} × ${cart[id]}\n`;
    }

    await fetch('https://api.telegram.org/botXXXX/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: 'YYYY',
            text
        })
    });

    finishOrder();
}

function finishOrder() {
    if (tg) {
        tg.showPopup({
            title: 'Готово',
            message: 'Замовлення прийнято',
            buttons: [{ type: 'ok' }]
        }, () => {
            tg.close();
        });
    } else {
        showSuccessModal();
    }
}

function showSuccessModal() {
    document.getElementById('success-modal').style.display = 'flex';
}

function closeSuccessModal() {
    document.getElementById('success-modal').style.display = 'none';
    resetAfterOrder();
}

function resetAfterOrder() {
    cart = {};
    isSending = false;
    document.getElementById('order-ui').style.display = 'none';
    renderProducts(products);
}