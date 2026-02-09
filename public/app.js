const tg = window.Telegram?.WebApp;
const API = 'https://shop-test-zcei.onrender.com';

let products = [];
let cart = {};
let sending = false;

/* ================= LOAD ================= */
async function load() {
    const r = await fetch('products.json?' + Date.now());
    products = await r.json();
    render();
    if (tg) {
        tg.ready();
        tg.expand();
    }
}

/* ================= RENDER PRODUCTS ================= */
function render() {
    const c = document.getElementById('container');
    c.innerHTML = '';

    products.forEach(p => {
        c.innerHTML += `
        <div class="product-card">
            <img src="${p.image}" onerror="this.src='https://placehold.co/200x150'">
            <div class="product-name">${p.name}</div>
            <div style="display:flex;justify-content:space-between;align-items:center">
                <span class="price">${p.price} ₴</span>
                <button class="add-btn"
                  onclick="addToCart('${p.name}',${p.price})">
                  ${cart[p.name]?.q || '+'}
                </button>
            </div>
        </div>`;
    });

    updateCartUI();
}

/* ================= CART ================= */
function addToCart(name, price) {
    if (!cart[name]) cart[name] = { price, q: 0 };
    cart[name].q++;
    render();
}

function removeFromCart(name) {
    if (!cart[name]) return;
    cart[name].q--;
    if (cart[name].q <= 0) delete cart[name];
    render();
}

/* ================= CART UI ================= */
function updateCartUI() {
    const list = document.getElementById('cart-items');
    const count = document.getElementById('cart-count');
    const total = document.getElementById('cart-total');

    list.innerHTML = '';

    let qty = 0;
    let sum = 0;

    for (let n in cart) {
        qty += cart[n].q;
        sum += cart[n].q * cart[n].price;

        list.innerHTML += `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span>${n} (${cart[n].q})</span>
            <div>
                <button onclick="removeFromCart('${n}')">−</button>
                <button onclick="addToCart('${n}',${cart[n].price})">+</button>
            </div>
        </div>`;
    }

    count.innerText = qty;
    total.innerText = qty ? `Ітого: ${sum} ₴` : '';
}

/* ================= UI ================= */
function toggleCart() {
    document.getElementById('order-ui').style.display = 'block';
}

function askClear() {
    document.getElementById('clear-modal').style.display = 'flex';
}

function closeClear() {
    document.getElementById('clear-modal').style.display = 'none';
}

function confirmClear() {
    cart = {};
    closeClear();
    closeCart();
    render();
}

function closeCart() {
    document.getElementById('order-ui').style.display = 'none';
}

/* ================= ORDER ================= */
async function handleOrder() {
    if (sending || !Object.keys(cart).length) return;

    const nameInput = document.getElementById('cust-name');
    const phoneInput = document.getElementById('cust-phone');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) return;

    sending = true;

    let items = '';
    let sum = 0;

    for (let n in cart) {
        items += `\n• ${n} (${cart[n].q})`;
        sum += cart[n].q * cart[n].price;
    }

    const userId = tg?.initDataUnsafe?.user?.id || 'PC-USER';

    await fetch(API + '/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            order: `👤 ${name}\n📞 ${phone}\n🆔 ${userId}\n${items}`,
            total: sum
        })
    });

    document.getElementById('success-modal').style.display = 'flex';
}

/* ================= SUCCESS ================= */
function closeSuccess() {
    document.getElementById('success-modal').style.display = 'none';

    cart = {};
    sending = false;

    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';

    closeCart();
    render();
}

/* ================= START ================= */
load();