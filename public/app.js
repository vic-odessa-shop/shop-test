let cart = [];
let totalPrice = 0;

async function loadProducts() {
    const response = await fetch('products.json');
    const products = await response.json();
    const productsContainer = document.querySelector('.products');

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product');

        productDiv.innerHTML = `
            <img src="${product.image}" alt="${product.name}" />
            <h3>${product.name}</h3>
            <p>${product.price}₴</p>
            <button onclick="addToCart(${product.id}, ${product.price})">+</button>
        `;

        productsContainer.appendChild(productDiv);
    });
}

function addToCart(id, price) {
    cart.push(id);
    totalPrice += price;
    updateOrderButton();
}

function updateOrderButton() {
    document.getElementById('orderButton').innerText = `Заказать: ${totalPrice}₴`;
}

// Обновление красного кружка с количеством товаров
function updateCartCount() {
    let total = 0;
    for (let key in cart) total += cart[key];
    document.getElementById('cart-count').innerText = total;
}

// Добавление товара
function addToCart(name) {
    cart[name] = (cart[name] || 0) + 1;
    updateUI();             // Показывает блок корзины, обновляет сумму
    render(getCurrentItems());
    updateCartCount();      // Обновляет красный кружок
    if (tg) tg.HapticFeedback.impactOccurred('medium');
}

// Показ/скрытие блока корзины при клике на иконку
function toggleCart() {
    const ui = document.getElementById('order-ui');
    ui.style.display = (ui.style.display === 'block') ? 'none' : 'block';
}




window.onload = loadProducts;