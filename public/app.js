let cart = {}; // { name: { price, quantity } }
let allProducts = [];
let showingConfirmClear = false;
const API_URL = 'https://shop-test-zcei.onrender.com';
const tg = window.Telegram?.WebApp;
let isSending = false;

// Загрузка товаров
async function load() {
    try {
        const r = await fetch('products.json?v=' + Date.now());
        allProducts = await r.json();
        renderCategories();
        renderProducts(allProducts);
    } catch (e) {
        console.error("Ошибка загрузки товаров:", e);
    }
}

// Рендер категорий
function renderCategories() {
    const cats = [...new Set(allProducts.map(p => p.category))].filter(Boolean);
    const catList = document.getElementById('cat-list');
    cats.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.innerText = c;
        btn.onclick = () => filter(c, btn);
        catList.appendChild(btn);
    });
}

// Рендер карточек товаров
function renderProducts(items) {
    const container = document.getElementById('container');
    container.innerHTML = '';

    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="info-icon" onclick="showDesc('${p.name}', '${p.desc || 'Смачна позиція'}')">i</div>
            <img src="${p.image || ''}" onerror="this.src='https://placehold.co/200?text=VIC+ODESSA'">
            <div class="product-name">${p.name}</div>
            <div class="card-footer">
                <span class="price">${p.price} ₴</span>
                <button class="add-btn" onclick="addToCart('${p.name}', ${p.price})">
                    ${cart[p.name]?.quantity || '+'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    updateCartUI();
}

// Фильтр по категории
function filter(cat, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const items = cat === 'all' ? allProducts : allProducts.filter(p => p.category === cat);
    renderProducts(items);
}

// Добавление товара
function addToCart(name, price) {
    if (!cart[name]) cart[name] = { price: price, quantity: 0 };
    cart[name].quantity++;
    renderProducts(getCurrentItems());
    updateCartUI();
}

// Удаление товара
function removeFromCart(name) {
    if (cart[name]) {
        cart[name].quantity--;
        if (cart[name].quantity <= 0) delete cart[name];
        renderProducts(getCurrentItems());
        updateCartUI();
    }
}

// Текущие элементы по фильтру
function getCurrentItems() {
    const activeBtn = document.querySelector('.cat-btn.active');
    if (!activeBtn || activeBtn.innerText === 'Всі') return allProducts;
    return allProducts.filter(p => p.category === activeBtn.innerText);
}

// Обновление интерфейса корзины
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total');
    const mainBtn = document.getElementById('main-button');

    cartItemsContainer.innerHTML = '';
    let totalQuantity = 0;
    let totalPrice = 0;

    if (showingConfirmClear) {
        cartItemsContainer.innerHTML = `<div style="margin-bottom:10px;">Вы точно хотите удалить всё из корзины?</div>`;
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.innerHTML = `
            <button onclick="cancelClear()" style="flex:1; margin-right:5px; padding:10px; border-radius:10px; border:1px solid #ccc;">Отменить</button>
            <button onclick="confirmClear()" style="flex:1; margin-left:5px; padding:10px; border-radius:10px; background:red; color:#fff; border:none;">Подтвердить</button>
        `;
        cartItemsContainer.appendChild(div);
        cartTotalContainer.innerText = '';
        mainBtn.innerText = 'Пiдтвердити замовлення';
        return;
    }

    for (let name in cart) {
        const item = cart[name];
        totalQuantity += item.quantity;
        totalPrice += item.price * item.quantity;

        const div = document.createElement('div');
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.style.marginBottom = "6px";
        div.innerHTML = `
            <span>${name} (${item.quantity} шт.)</span>
            <div>
                <button onclick="removeFromCart('${name}')">-</button>
                <button onclick="addToCart('${name}', ${item.price})">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    }

    cartTotalContainer.innerText = totalQuantity > 0 ? `Ітого: ${totalPrice} ₴` : '';
    document.getElementById('cart-count').innerText = totalQuantity;
    mainBtn.innerText = totalQuantity > 0 ? 'Пiдтвердити замовлення' : 'Пiдтвердити замовлення';
}

// Показ/скрытие окна корзины
function toggleCart() {
    const ui = document.getElementById('order-ui');
    ui.style.display = (ui.style.display === 'block') ? 'none' : 'block';
    showingConfirmClear = false;
    updateCartUI();
}

// Начало процесса очистки корзины
function cancelOrder() {
    if (Object.keys(cart).length === 0) return;
    showingConfirmClear = true;
    updateCartUI();
}

// Отмена очистки корзины
function cancelClear() {
    showingConfirmClear = false;
    updateCartUI();
}

// Подтверждение очистки корзины
function confirmClear() {
    cart = {};
    showingConfirmClear = false;
    renderProducts(getCurrentItems());
    updateCartUI();
    toggleCart();
}

// Подтверждение заказа
function handleButtonClick() {
    if (Object.keys(cart).length === 0) return alert("Корзина порожня!");
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    if (!name || !phone) return alert("Вкажіть контакти!");

    executeOrderAlgorithm(); // вызов функции отправки заказа
}

// Функция отправки заказа (твоя существующая, с доработкой очистки корзины после отправки)
async function executeOrderAlgorithm() {
    if (isSending) return;
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const btn = document.getElementById('main-button');
    if (!name || !phone) return alert("Вкажіть контакти!");

    isSending = true;
    btn.classList.add('loading-state');

    // 1. Прозвонка
    let ready = false; let attempts = 0;
    while (!ready && attempts < 15) {
        btn.innerText = `ЗВ'ЯЗОК... ${attempts + 1}`;
        try {
            const check = await fetch(API_URL + '/', { mode: 'cors', cache: 'no-cache' });
            if (check.ok) ready = true;
        } catch (e) { console.log("Чекаємо..."); }
        if (!ready) { attempts++; await new Promise(r => setTimeout(r, 2000)); }
    }

    // 2. Формирование данных
    btn.innerText = "ОБРОБКА...";
    let itemsText = ""; let sum = 0;
    for (let n in cart) {
        itemsText += `\n• ${n} (${cart[n].quantity} шт.)`;
        sum += cart[n].price * cart[n].quantity;
    }

    // 3. Отправка
    btn.innerText = "ВІДПРАВКА...";
    try {
        await fetch(API_URL + '/api/send-order', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order: `👤 Клієнт: ${name}\n📞 Тел: ${phone}\n🛒 Товари:${itemsText}`,
                total: sum
            })
        });
    } catch (e) { console.log("Ошибка отправки"); }

    // 4. Финиш
    btn.innerText = "ГОТОВО!";
    if (tg && tg.showPopup) {
        tg.showPopup({
            title: 'Замовлення прийнято!',
            message: 'Ми вже готуємо ваш чек.',
            buttons: [{type: 'ok', text: 'ОК'}]
        }, () => {
            tg.close();
            cart = {};
            renderProducts(getCurrentItems());
            updateCartUI();
        });
    } else {
        alert("Дякуємо! Ваше замовлення прийнято.");
        cart = {};
        renderProducts(getCurrentItems());
        updateCartUI();
    }
}

// Всплывающие описания
function showDesc(name, desc) { 
    if (tg) tg.showAlert(`${name}\n\n${desc}`); 
    else alert(`${name}\n\n${desc}`); 
}

// Загрузка сразу
load();