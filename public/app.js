const tg = window.Telegram.WebApp;
tg.expand();

let cart = [];

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        const list = document.getElementById('product-list');
        list.innerHTML = ''; // Очищаем список перед загрузкой

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            // Используем p.title, так как в базе столбец называется так
            card.innerHTML = `
                <img src="piza1.png" alt="${p.title}" style="width:100%">
                <h3>${p.title}</h3>
                <p>${p.description || ''}</p>
                <div class="price">${p.price} грн</div>
                <button id="btn-${p.id}">Додати</button>
            `;
            list.appendChild(card);

            // Навешиваем событие клика на кнопку
            document.getElementById(`btn-${p.id}`).addEventListener('click', () => {
                addToCart(p);
            });
        });
    } catch (e) {
        console.error("Помилка завантаження:", e);
    }
}

function addToCart(product) {
    cart.push(product);

    // Настраиваем главную кнопку Telegram (внизу экрана)
    tg.MainButton.text = `Перевірити кошик (${cart.length})`;
    tg.MainButton.color = "#2cab37";
    tg.MainButton.isVisible = true; // Важно для новой версии API
    tg.MainButton.show();
}

// Слушаем нажатие на кнопку внизу экрана
tg.onEvent('mainButtonClicked', () => {
    const total = cart.reduce((sum, item) => sum + Number(item.price), 0);
    tg.showAlert(`У кошику ${cart.length} товарів на суму ${total} грн.`);
});

loadProducts();