const tg = window.Telegram?.WebApp;
const API = 'https://shop-test-zcei.onrender.com';

let products = [];
let cart = {};
let sending = false;

/* ================= LOAD ================= */
async function load() {
    const r = await fetch('products.json?' + Date.now());
    products = await r.json();
    renderCategories();
    render();
    if (tg) { tg.ready(); tg.expand(); }
}

/* ================= CATEGORIES ================= */
function renderCategories() {
    const catList = document.getElementById('cat-list');
    const cats = [...new Set(products.map(p=>p.category))].filter(Boolean);
    cats.forEach(c=>{
        const btn = document.createElement('button');
        btn.className='cat-btn';
        btn.innerText=c;
        btn.onclick=()=>filter(c,btn);
        catList.appendChild(btn);
    });
}

function filter(cat, btn){
    document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    render();
}

/* ================= RENDER PRODUCTS ================= */
function render(){
    const container = document.getElementById('container');
    container.innerHTML='';
    const activeCat = document.querySelector('.cat-btn.active')?.innerText;
    let items = products;
    if(activeCat && activeCat!=='Всі') items=products.filter(p=>p.category===activeCat);

    items.forEach(p=>{
        const q = cart[p.name]?.q || '+';
        container.innerHTML += `
        <div class="product-card">
            <div class="info-icon" onclick="showDesc('${p.name}','${p.desc||'Смачна позиція'}')">i</div>
            <img src="${p.image||''}" onerror="this.src='https://placehold.co/200?text=VIC+ODESSA'">
            <div class="product-name">${p.name}</div>
            <div class="card-footer">
                <span class="price">${p.price} ₴</span>
                <button class="add-btn" onclick="addToCart('${p.name}',${p.price})">${q}</button>
            </div>
        </div>`;
    });
    updateCartUI();
}

/* ================= CART ================= */
function addToCart(name, price){
    if(!cart[name]) cart[name]={price,q:0};
    cart[name].q++;
    render();
}

function removeFromCart(name){
    if(!cart[name]) return;
    cart[name].q--;
    if(cart[name].q<=0) delete cart[name];
    render();
}

/* ================= CART UI ================= */
function updateCartUI(){
    const list=document.getElementById('cart-items');
    const count=document.getElementById('cart-count');
    const total=document.getElementById('cart-total');
    list.innerHTML='';
    let qty=0, sum=0;
    for(let n in cart){
        qty+=cart[n].q;
        sum+=cart[n].q*cart[n].price;
        list.innerHTML+=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span>${n} (${cart[n].q})</span>
            <div>
                <button onclick="removeFromCart('${n}')">−</button>
                <button onclick="addToCart('${n}',${cart[n].price})">+</button>
            </div>
        </div>`;
    }
    count.innerText=qty;
    total.innerText=qty?`Ітого: ${sum} ₴`:'';
}

/* ================= ORDER ================= */
function toggleCart(){ document.getElementById('order-ui').style.display='block'; }
function askClear(){ document.getElementById('clear-modal').style.display='flex'; }
function closeClear(){ document.getElementById('clear-modal').style.display='none'; }
function confirmClear(){ cart={}; closeClear(); closeCart(); render(); }
function closeCart(){ document.getElementById('order-ui').style.display='none'; }

async function handleOrder(){
    if(sending || !Object.keys(cart).length) return;

    const name=document.getElementById('cust-name').value.trim();
    const phone=document.getElementById('cust-phone').value.trim();
    if(!name||!phone) return alert('Вкажіть ім\'я та телефон');

    sending=true;
    let items='', sum=0;
    for(let n in cart){ items+=`\n• ${n} (${cart[n].q})`; sum+=cart[n].q*cart[n].price; }

    const userId = tg?.initDataUnsafe?.user?.id || 'PC-USER';
    const username = tg?.initDataUnsafe?.user?.username ? '@'+tg.initDataUnsafe.user.username : '-';

    const orderText = `👤 ${name}\n📞 ${phone}\n🆔 ${userId} (${username})\n🛒 Товари:${items}\n💰 Сума: ${sum} ₴`;

    try{
        await fetch(API+'/api/send-order',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({order:orderText,total:sum}) });
    }catch(e){ alert('Помилка відправки'); sending=false; return; }

    if(tg?.showPopup){
        tg.showPopup({ title:'Замовлення прийнято!', message:'Дякуємо! Ми вже готуємо ваше замовлення.', buttons:[{type:'ok', text:'OK'}] }, ()=>{
            closeSuccess();
            tg.close();
        });
    }else{
        alert('Дякуємо! Ваше замовлення прийнято.');
        closeSuccess();
    }
}

function closeSuccess(){
    cart={}; sending=false;
    document.getElementById('cust-name').value='';
    document.getElementById('cust-phone').value='';
    closeCart(); render(); updateCartUI();
}

/* ================= OTHER ================= */
function showDesc(name,desc){ if(tg) tg.showAlert(`${name}\n\n${desc}`); else alert(`${name}\n\n${desc}`); }

load();