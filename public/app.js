let cart = {}; // { name: { price, quantity } }
let allProducts = [];
let showingConfirmClear = false;
let isSending = false;

const tg = window.Telegram?.WebApp;
const API_URL = 'https://shop-test-zcei.onrender.com';

/* ================== ЗАГРУЗКА ================== */
async function load() {
    try {
        const r = await fetch('products.json?v=' + Date.now());
        allProducts = await r.json();
        renderCategories();
        renderProducts(allProducts);

        if (tg) { tg.ready(); tg.expand(); }
    } catch (e) { console.error('Ошибка загрузки:', e); }
}

/* ================== КАТЕГОРИИ ================== */
function renderCategories() {
    const catList = document.getElementById('cat-list');
    const cats = [...new Set(allProducts.map(p => p.category))].filter(Boolean);
    cats.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.innerText = c;
        btn.onclick = () => filter(c, btn);
        catList.appendChild(btn);
    });
}
function filter(cat, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(getCurrentItems());
}
function getCurrentItems() {
    const active = document.querySelector('.cat-btn.active');
    if (!active || active.innerText === 'Всі') return allProducts;
    return allProducts.filter(p => p.category === active.innerText);
}

/* ================== ПРОДУКТЫ ================== */
function renderProducts(items) {
    const container = document.getElementById('container');
    container.innerHTML = '';

    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="info-icon" onclick="showDescModal('${p.name}','${p.desc||'Смачна позиція'}','${p.image||''}')">i</div>
            <img src="${p.image||''}" onerror="this.src='https://placehold.co/200?text=VIC+ODESSA'">
            <div class="product-name">${p.name}</div>
            <div class="card-footer">
                <span class="price">${p.price} ₴</span>
                <button class="add-btn" onclick="addToCart('${p.name}',${p.price})">
                    ${cart[p.name]?.quantity||'+'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    updateCartUI();
}

/* ================== КОРЗИНА ================== */
function addToCart(name, price) {
    if (!cart[name]) cart[name]={price,quantity:0};
    cart[name].quantity++;
    renderProducts(getCurrentItems());
    updateCartUI();
}
function removeFromCart(name) {
    if(!cart[name]) return;
    cart[name].quantity--;
    if(cart[name].quantity<=0) delete cart[name];
    renderProducts(getCurrentItems());
    updateCartUI();
}
function toggleCart() {
    const ui = document.getElementById('order-ui');
    ui.style.display = ui.style.display==='block'?'none':'block';
    showingConfirmClear=false;
    updateCartUI();
}
function updateCartUI() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count');
    const mainBtn = document.getElementById('main-button');

    cartItems.innerHTML='';
    let totalQty=0, totalSum=0;

    if(showingConfirmClear){
        cartItems.innerHTML=`
            <div style="background:#ffecec;border:1px solid #ff3b30;border-radius:12px;padding:12px;margin-bottom:10px;text-align:center;color:#900;font-weight:600;">
            ⚠️ Ви точно бажаєте видалити <b>усі товари</b> з кошика?
            </div>
            <div style="display:flex;gap:10px;">
            <button style="flex:1" onclick="cancelClear()">Відмінити</button>
            <button style="flex:1;background:#ff3b30;color:#fff" onclick="confirmClear()">Підтвердити</button>
            </div>`;
        cartTotal.innerText='';
        return;
    }

    for(let name in cart){
        const item=cart[name];
        totalQty+=item.quantity;
        totalSum+=item.price*item.quantity;
        const row=document.createElement('div');
        row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.marginBottom='6px';
        row.innerHTML=`<span>${name} (${item.quantity})</span>
        <div>
        <button onclick="removeFromCart('${name}')">−</button>
        <button onclick="addToCart('${name}',${item.price})">+</button>
        </div>`;
        cartItems.appendChild(row);
    }

    cartCount.innerText=totalQty;
    cartTotal.innerText=totalQty?`Ітого: ${totalSum} ₴`:'';
    mainBtn.innerText='Пiдтвердити замовлення';
}

/* ================== ОЧИСТКА ================== */
function cancelOrder(){ if(!Object.keys(cart).length) return; showingConfirmClear=true; updateCartUI(); }
function cancelClear(){ showingConfirmClear=false; updateCartUI(); }
function confirmClear(){ cart={}; showingConfirmClear=false; document.getElementById('order-ui').style.display='none'; renderProducts(getCurrentItems()); updateCartUI(); }

/* ================== ПОДТВЕРЖДЕНИЕ ЗАКАЗА ================== */
function handleButtonClick(){
    if(!Object.keys(cart).length) return alert('Корзина порожня');
    const name=document.getElementById('cust-name').value.trim();
    const phone=document.getElementById('cust-phone').value.trim();
    if(!name||!phone) return alert("Вкажіть ім'я та телефон");
    executeOrderAlgorithm();
}
async function executeOrderAlgorithm(){
    if(isSending) return; isSending=true;
    const btn=document.getElementById('main-button'); btn.classList.add('loading-state');

    const name=document.getElementById('cust-name').value.trim();
    const phone=document.getElementById('cust-phone').value.trim();

    let itemsText='', sum=0;
    for(let n in cart){ itemsText+=`\n• ${n} (${cart[n].quantity} шт.)`; sum+=cart[n].price*cart[n].quantity; }
    const userId=tg?.initDataUnsafe?.user?.id||'PC-USER';
    const username=tg?.initDataUnsafe?.user?.username?`@${tg.initDataUnsafe.user.username}`:'-';
    const orderText=`👤 Клієнт: ${name}
📞 Тел: ${phone}
🆔 ID: ${userId} (${username})
🛒 Товари:${itemsText}
💰 Сума: ${sum} ₴`;

    btn.innerText='ВІДПРАВКА...';

    try{
        await fetch(API_URL+'/api/send-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order:orderText,total:sum})});
    } catch(e){ alert('Помилка відправки'); isSending=false; return; }

    const finish=()=>{
        cart={}; showingConfirmClear=false;
        document.getElementById('order-ui').style.display='none';
        document.getElementById('cust-name').value='';
        document.getElementById('cust-phone').value='';
        renderProducts(getCurrentItems());
        updateCartUI();
        btn.classList.remove('loading-state'); btn.innerText='Пiдтвердити замовлення'; isSending=false;
    };

    if(tg?.showPopup){
        tg.showPopup({title:'Замовлення прийнято!', message:'Дякуємо! Ми вже готуємо ваше замовлення.', buttons:[{type:'ok', text:'OK'}]},()=>{tg.close(); finish();});
    } else {
        document.getElementById('success-modal').style.display='flex';
        finish(); // обнуление состояния после показа модалки
    }
}

/* ================== МОДАЛКА ОПИСАНИЯ ================== */
function showDescModal(name, desc, img){
    document.getElementById('desc-title').innerText=name;
    document.getElementById('desc-text').innerText=desc;
    document.getElementById('desc-img').src=img||'https://placehold.co/200?text=VIC+ODESSA';
    document.getElementById('desc-modal').style.display='flex';
}
function closeDesc(){ document.getElementById('desc-modal').style.display='none'; }

/* ================== МОДАЛКА УСПЕХА ================== */
function closeSuccess(){ document.getElementById('success-modal').style.display='none'; }

/* ================== START ================== */
load();