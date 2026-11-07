const ADMIN_PASSWORD = "adminadmin123mir.com"; // Демо-пароль.

// НАЛАШТУВАННЯ TELEGRAM БОТА
const BOT_TOKEN = "9233896450:AAFAxUkf9Dz4JqhGcR8YABtyJbKsr5Zk4Tc";
const CHAT_ID = "1397770315"; // Сюди впишіть числовий ID чату або групи (наприклад, 123456789 або -100...)

const DEFAULT_PRODUCTS = [
 {id:"p1",name:"Філадельфія класік",category:"Роли",description:"Лосось, вершковий сир, огірок та ніжний рис.",weight:280,price:300,image:"https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=700&q=80"},
 {id:"p2",name:"Каліфорнія з лососем",category:"Роли",description:"Лосось, авокадо, огірок та ікра тобіко.",weight:260,price:270,image:"https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=700&q=80"},
 {id:"p3",name:"Запечений рол",category:"Роли",description:"Теплий рол із сирною шапочкою та соусом.",weight:300,price:290,image:"https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=700&q=80"},
 {id:"p4",name:"Сет Момент",category:"Сети",description:"Улюблені роли для затишного вечора вдвох.",weight:850,price:790,image:"https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=700&q=80"},
 {id:"p5",name:"Сет Sushi Mir",category:"Сети",description:"Різноманіття смаків для компанії друзів.",weight:1200,price:1090,image:"https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=700&q=80"},
 {id:"p6",name:"Нігірі з лососем",category:"Суші",description:"Рис та скибочка свіжого лосося.",weight:70,price:95,image:"https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=700&q=80"},
 {id:"p7",name:"Матча лимонад",category:"Напої",description:"Освіжаючий лимонад із легкою ноткою матча.",weight:330,price:85,image:"https://images.unsplash.com/photo-1513558161293-cdaf765edfd4?auto=format&fit=crop&w=700&q=80"},
 {id:"p8",name:"Імбирний чай",category:"Напої",description:"Ароматний чай з імбиром та цитрусом.",weight:400,price:75,image:"https://images.unsplash.com/photo-1544787219-7f47acza0f5e?auto=format&fit=crop&w=700&q=80"}
];

const $ = s => document.querySelector(s);
const money = n => `${Number(n).toLocaleString("uk-UA")} грн`;
const safe = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let products = loadProducts(), cart = JSON.parse(localStorage.getItem("sushimir-cart") || "{}"), activeCategory = "Усі";

function loadProducts(){try{const p=JSON.parse(localStorage.getItem("sushimir-products"));return Array.isArray(p)?p:structuredClone(DEFAULT_PRODUCTS)}catch{return structuredClone(DEFAULT_PRODUCTS)}}
function saveProducts(){localStorage.setItem("sushimir-products",JSON.stringify(products))}
function saveCart(){localStorage.setItem("sushimir-cart",JSON.stringify(cart))}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2600)}

function renderCategories(){const cats=["Усі",...new Set(products.map(p=>p.category))];$("#categories").innerHTML=cats.map(c=>`<button class="category-btn ${c===activeCategory?"active":""}" data-category="${safe(c)}">${safe(c)}</button>`).join("")}
function renderProducts(){const list=products.filter(p=>activeCategory==="Усі"||p.category===activeCategory);$("#productGrid").innerHTML=list.length?list.map(p=>`<article class="product-card"><div class="product-photo"><img loading="lazy" src="${safe(p.image)}" alt="${safe(p.name)}" onerror="this.src='https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=700'"><span class="product-category">${safe(p.category)}</span></div><div class="product-info"><h3>${safe(p.name)}</h3><p>${safe(p.description)}</p><div class="product-meta"><span>⚖ ${Number(p.weight)} г</span><span>Свіже приготування</span></div><div class="product-buy"><strong>${money(p.price)}</strong><button class="add-btn" data-add="${safe(p.id)}">+ В кошик</button></div></div></article>`).join(""):`<p class="empty-cart">У цій категорії поки немає товарів.</p>`}

function cartCount(){return Object.values(cart).reduce((a,b)=>a+b,0)}
function cartTotal(){return Object.entries(cart).reduce((sum,[id,q])=>sum+(products.find(p=>p.id===id)?.price||0)*q,0)}
function renderCart(){
 const rows=Object.entries(cart).filter(([id,q])=>q>0&&products.some(p=>p.id===id));
 $("#cartCount").textContent=cartCount();
 $("#cartTotal").textContent=money(cartTotal());
 $("#checkoutTotal").textContent=money(cartTotal());
 $("#cartItems").innerHTML=rows.length?rows.map(([id,q])=>{const p=products.find(x=>x.id===id);return `<div class="cart-row"><img src="${safe(p.image)}" alt=""><div><h4>${safe(p.name)}</h4><small>${money(p.price)} · ${Number(p.weight)} г</small><div class="quantity"><button data-qty="${id}" data-delta="-1">−</button><b>${q}</b><button data-qty="${id}" data-delta="1">+</button></div></div><button class="remove-btn" data-remove="${id}" aria-label="Видалити">×</button></div>`}).join(""):`<div class="empty-cart">🍣<br><br>Ваш кошик поки порожній.<br>Саме час обрати щось смачненьке!</div>`;
 $("#checkoutBtn").disabled=!rows.length
}

function addToCart(id){cart[id]=(cart[id]||0)+1;saveCart();renderCart();toast("Додано до кошика 🍣")}
function openOverlay(id){$("#"+id).classList.add("open");$("#"+id).setAttribute("aria-hidden","false");document.body.style.overflow="hidden"}
function closeOverlay(id){$("#"+id).classList.remove("open");$("#"+id).setAttribute("aria-hidden","true");if(!document.querySelector(".overlay.open"))document.body.style.overflow=""}

document.addEventListener("click",e=>{
 const add=e.target.closest("[data-add]");if(add)addToCart(add.dataset.add);
 const cat=e.target.closest("[data-category]");if(cat){activeCategory=cat.dataset.category;renderCategories();renderProducts()}
 const qty=e.target.closest("[data-qty]");if(qty){const id=qty.dataset.qty;cart[id]=Math.max(0,(cart[id]||0)+Number(qty.dataset.delta));if(!cart[id])delete cart[id];saveCart();renderCart()}
 const rem=e.target.closest("[data-remove]");if(rem){delete cart[rem.dataset.remove];saveCart();renderCart()}
 const close=e.target.closest("[data-close]");if(close)closeOverlay(close.dataset.close);
 if(e.target.classList.contains("overlay"))closeOverlay(e.target.id);
});

$("#openCart").onclick=()=>{renderCart();openOverlay("cartOverlay")};
$("#checkoutBtn").onclick=()=>{closeOverlay("cartOverlay");renderCart();openOverlay("checkoutOverlay")};
$("#themeToggle").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("sushimir-theme",document.body.classList.contains("dark")?"dark":"light")};
if(localStorage.getItem("sushimir-theme")==="dark")document.body.classList.add("dark");
$("#mobileMenu").onclick=()=>$(".main-nav").classList.toggle("show");
$(".main-nav").addEventListener("click",()=>$(".main-nav").classList.remove("show"));
$("#year").textContent=new Date().getFullYear();

const phone=$("#phone");
phone.addEventListener("input",()=>{let d=phone.value.replace(/\D/g,"");if(d.startsWith("380"))d=d.slice(3);if(d.startsWith("0"))d=d.slice(1);d=d.slice(0,9);phone.value="+380"+(d.length?" "+d.slice(0,2):"")+(d.length>2?" "+d.slice(2,5):"")+(d.length>5?" "+d.slice(5,7):"")+(d.length>7?" "+d.slice(7,9):"")});

// ВІДПРАВКА ЗАМОВЛЕННЯ НАПРЯМУ В TELEGRAM
$("#checkoutForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!cartCount())return toast("Кошик порожній");
 
 const f=new FormData(e.currentTarget), phoneValue=f.get("phone").replace(/\s/g,"");
 if(!/^\+380\d{9}$/.test(phoneValue))return toast("Перевірте номер телефону у форматі +380XXXXXXXXX");
 
 const items=Object.entries(cart).filter(([id,q])=>q>0).map(([id,quantity])=>{const p=products.find(x=>x.id===id);return {name:p.name,quantity,price:Number(p.price),weight:Number(p.weight)}});
 
 const order={
  name:f.get("name").trim(),
  phone:phoneValue,
  telegram:f.get("telegram").trim()||"Не вказано",
  fulfillment:f.get("fulfillment"),
  comment:f.get("comment").trim()||"Немає",
  items,
  total:cartTotal()
 };

 // Форматування тексту для Telegram
 let text = `📦 <b>НОВЕ ЗАМОВЛЕННЯ Sushi Mir</b>\n\n`;
 text += `👤 <b>Ім'я:</b> ${safe(order.name)}\n`;
 text += `📞 <b>Телефон:</b> ${safe(order.phone)}\n`;
 text += `💬 <b>Telegram:</b> ${safe(order.telegram)}\n`;
 text += `📍 <b>Спосіб:</b> ${safe(order.fulfillment)}\n`;
 text += `📝 <b>Коментар:</b> ${safe(order.comment)}\n\n`;
 text += `🛒 <b>Склад замовлення:</b>\n`;
 order.items.forEach(i=>{
  text += `• ${safe(i.name)} x${i.quantity} — ${money(i.price * i.quantity)}\n`;
 });
 text += `\n💰 <b>Всього до сплати:</b> ${money(order.total)}`;

 const btn=$("#submitOrder");
 btn.disabled=true;
 btn.textContent="Надсилаємо…";

 try{
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
   method: "POST",
   headers: {"Content-Type": "application/json"},
   body: JSON.stringify({
    chat_id: CHAT_ID,
    text: text,
    parse_mode: "HTML"
   })
  });
  
  const data = await response.json();
  if(!response.ok || !data.ok) throw new Error(data.description || "Помилка Telegram API");
  
  cart={};
  saveCart();
  renderCart();
  e.currentTarget.reset();
  closeOverlay("checkoutOverlay");
  toast("Замовлення прийнято! Дякуємо 💚");
 }catch(err){
  console.error(err);
  $("#checkoutMessage").textContent=`Помилка: ${err.message}. Перевірте CHAT_ID та чи писали ви боту.`;
  toast("Не вдалося відправити замовлення");
 }finally{
  btn.disabled=false;
  btn.innerHTML='Підтвердити замовлення <span>→</span>';
 }
});

// Адмін-панель
$("#openAdmin").onclick=()=>{openOverlay("adminOverlay");$("#adminPassword").value="";$("#adminLogin").hidden=false;$("#adminPanel").hidden=true};
$("#loginAdmin").onclick=()=>{if($("#adminPassword").value===ADMIN_PASSWORD){$("#adminLogin").hidden=true;$("#adminPanel").hidden=false;renderAdmin();toast("Вхід виконано")}else toast("Неправильний пароль")};
$("#adminPassword").addEventListener("keydown",e=>{if(e.key==="Enter")$("#loginAdmin").click()});

function renderAdmin(){$("#adminProducts").innerHTML=products.map(p=>`<div class="admin-product"><span><b>${safe(p.name)}</b> · ${money(p.price)}</span><span><button data-edit="${safe(p.id)}">Редагувати</button> <button class="delete" data-delete="${safe(p.id)}">Видалити</button></span></div>`).join("")||"<p class='tiny-note'>Каталог порожній.</p>"}

$("#productForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget),id=f.get("id")||"p"+Date.now(),p={id,name:f.get("name").trim(),category:f.get("category"),description:f.get("description").trim(),price:Number(f.get("price")),weight:Number(f.get("weight")),image:f.get("image").trim()};if(!p.price||!p.weight)return toast("Вкажіть коректні ціну та вагу");const index=products.findIndex(x=>x.id===id);if(index>=0)products[index]=p;else products.push(p);saveProducts();renderCategories();renderProducts();renderAdmin();e.currentTarget.reset();toast("Товар збережено")});

$("#adminProducts").addEventListener("click",e=>{const edit=e.target.closest("[data-edit]");if(edit){const p=products.find(x=>x.id===edit.dataset.edit),form=$("#productForm");Object.entries(p).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v});form.scrollIntoView({behavior:"smooth",block:"center"})}const del=e.target.closest("[data-delete]");if(del&&confirm("Видалити цей товар?")){products=products.filter(p=>p.id!==del.dataset.delete);delete cart[del.dataset.delete];saveProducts();saveCart();renderCategories();renderProducts();renderCart();renderAdmin()}});

$("#resetProductForm").onclick=()=>$("#productForm").reset();
$("#resetProducts").onclick=()=>{if(confirm("Відновити стандартний каталог?")){products=structuredClone(DEFAULT_PRODUCTS);saveProducts();renderCategories();renderProducts();renderAdmin();toast("Каталог відновлено")}};
$("#clearProducts").onclick=()=>{if(confirm("Видалити всі товари?")){products=[];cart={};saveProducts();saveCart();renderCategories();renderProducts();renderCart();renderAdmin()}};
$("#logoutAdmin").onclick=()=>{$("#adminPanel").hidden=true;$("#adminLogin").hidden=false;$("#adminPassword").value=""};

renderCategories();
renderProducts();
renderCart();