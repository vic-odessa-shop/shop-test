const tg = window.Telegram?.WebApp;
const API = 'https://shop-test-zcei.onrender.com';

let products = [];
let cart = {};
let sending = false;

async function load() {
    const r = await fetch('products.json?' + Date.now());
    products = await r.json();
    render();
    tg?.ready();
}

function render() {
    const c = document.getElementById('container');
    c.innerHTML = '';
    products.forEach(p => {
        c.innerHTML += `
        <div class="product-card">
            <img src="${p.image}">
            <div class="product-name">${p.name}</div>
            <div style="display:flex;justify-content:space-between">
                <span class="price">${p.price} ₴</span>
                <button class="add-btn"
                 onclick="add('${p.name}',${p.price})">
                 ${cart[p.name]?.q || '+'}
                </button>
            </div>
        </div>`;
    });
    updateCart();
}

function add(name, price) {
    cart[name] ??= { price, q:0 };
    cart[name].q++;
    render();
}

function remove(name) {
    cart[name].q--;
    if (cart[name].q <= 0) delete cart[name];
    render();
}

function updateCart() {
    let qty = 0, sum = 0;
    const list = document.getElementById('cart-items');
    list.innerHTML = '';
    for (let n in cart) {
        qty += cart[n].q;
        sum += cart[n].q * cart[n].price;
        list.innerHTML += `
          <div>${n} (${cart[n].q})
            <button onclick="remove('${n}')">−</button>
            <button onclick="add('${n}',${cart[n].price})">+</button>
          </div>`;
    }
    document.getElementById('cart-count').innerText = qty;
    document.getElementById('cart-total').innerText = qty ? `Ітого: ${sum} ₴` : '';
}

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

async function handleOrder() {
    if (sending) return;
    const name = cust-name.value.trim();
    const phone = cust-phone.value.trim();
    if (!name || !phone) return;

    sending = true;
    let txt = '';
    let sum = 0;
    for (let n in cart) {
        txt += `\n• ${n} (${cart[n].q})`;
        sum += cart[n].q * cart[n].price;
    }

    const id = tg?.initDataUnsafe?.user?.id || 'PC-USER';

    await fetch(API + '/api/send-order',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            order:`👤 ${name}\n📞 ${phone}\n🆔 ${id}\n${txt}`,
            total:sum
        })
    });

    document.getElementById('success-modal').style.display='flex';
}

function closeSuccess() {
    document.getElementById('success-modal').style.display='none';
    cart = {};
    sending = false;
    closeCart();
    cust-name.value='';
    cust-phone.value='';
    render();
}

load();