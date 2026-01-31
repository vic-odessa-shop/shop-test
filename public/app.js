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

window.onload = loadProducts;