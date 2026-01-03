const tg = window.Telegram.WebApp;
tg.expand(); // Раскрыть на всё окно

async function loadProducts() {
    try {
        const response = await fetch('/api/products'); // Запрос к нашему серверу
        const products = await response.json();
        const list = document.getElementById('product-list');

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${p.image_url}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <div class="price">${p.price} грн</div>
                <button onclick="addToCart(${p.id})">Додати</button>
            `;
            list.appendChild(card);
        });
    } catch (e) {
        console.error("Ошибка загрузки товаров", e);
    }
}

function addToCart(id) {
    tg.MainButton.setText("Товар додано! Перейти до оплати");
    tg.MainButton.show();
}

loadProducts();