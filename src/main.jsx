import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createRoot } from 'react-dom/client';
import './style.css';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || '2026';
async function adminRpc(name, payload={}){
  if(!supabase) return {data:null,error:null};
  return await supabase.rpc(name, { ...payload, admin_key: ADMIN_SECRET });
}

const BRL = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today = () => new Date().toLocaleDateString('pt-BR');
const uid = () => Date.now()+Math.random();
const store = {
  get(k,d){ try{return JSON.parse(localStorage.getItem(k)) ?? d}catch{return d} },
  set(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
};

const seedProducts = [
 ['Burgers','X-Burger',21.9],['Burgers','X-Salada',26.9],['Burgers','X-Bacon',28.9],['Burgers','X-Egg Bacon',30.9],['Burgers','Duplo Bacon BBQ 🔥',35.9],['Burgers','X-Tudo',37.9],
 ['Cuscuz','Cuscuz Base',24.9],['Cuscuz','Cuscuz Premium - Carne seca, queijo e queijo coalho',38.9],
 ['Tapiocas Salgadas','Frango + Mussarela + Requeijão',25.9],['Tapiocas Salgadas','Frango + Presunto + Bacon + Requeijão',28.9],['Tapiocas Salgadas','Carne + Calabresa + Tomate + Mussarela',28.9],['Tapiocas Salgadas','Carne + Ovo + Bacon + Requeijão',29.9],['Tapiocas Salgadas','Mussarela + Bacon + Requeijão',25.9],['Tapiocas Salgadas','Presunto + Mussarela + Tomate + Ovo',26.9],['Tapiocas Salgadas','Completa (Frango + Tudo) 🔥',31.9],['Tapiocas Salgadas','Banana + Bacon + Mussarela + Canela',25.9],['Tapiocas Salgadas','Carne Seca + Mussarela + Queijo Coalho',37.9],
 ['Tapiocas Doces','Nutella com Morango',19.9],['Tapiocas Doces','Leite Condensado com Coco',19.9],['Tapiocas Doces','Tapioca de Churros',19.9],['Tapiocas Doces','Romeu e Julieta',19.9],
 ['Sucos Naturais','Limão',7.9],['Sucos Naturais','Laranja',8.9],['Sucos Naturais','Abacaxi',8.9],['Sucos Naturais','Abacaxi com Hortelã',9.9],['Detox','Detox 1',11.9],['Detox','Detox 2',11.9],
 ['Refrigerantes','Coca-Cola Lata',6.5],['Refrigerantes','Guaraná Lata',6.5],['Refrigerantes','Fanta Lata',6.5],['Refrigerantes','Coca-Cola 1L',10],['Refrigerantes','Guaraná 1L',10],['Refrigerantes','Água com Gás',4.5],['Refrigerantes','Água Mineral',3.5],['Refrigerantes','Coca-Cola 600ml',7.5],
 ['Milkshakes','Chocolate com Nutella',20],['Milkshakes','Morango com Nutella',20],['Milkshakes','Chocolate',18],['Milkshakes','Morango',18]
].map((p,i)=>({id:i+1,cat:p[0],name:p[1],price:p[2],active:true}));

const seedAdds = [
 ['Carne Seca',10],['Carne',8],['Frango',8],['Mussarela',5],['Presunto',5],['Ovo',5],['Bacon',5],['Requeijão',5],['Catupiry',5],['Rúcula',5],['Queijo Coalho',5],['Calabresa',5],['Tomate',5],['Milho',5]
].map((a,i)=>({id:i+1,name:a[0],price:a[1]}));

function normalizePaymentName(method){
  const m = String(method||'').toLowerCase();
  if(m.includes('pix')) return 'Pix';
  if(m.includes('dinheiro')) return 'Dinheiro';
  if(m.includes('credito') || m.includes('crédito')) return 'Crédito';
  if(m.includes('debito') || m.includes('débito')) return 'Débito';
  return method || 'Pix';
}
function itemFromSupabase(i){
  const qty = Number(i.qty)||1;
  const addons = i.addons || i.adds || [];
  const included = i.included || [];
  const addText = [
    included.length ? `Inclusos: ${included.join(', ')}` : '',
    addons.length ? `Extras: ${addons.map(a=>a.name||a).join(', ')}` : '',
    i.observation || i.obs ? `Obs: ${i.observation || i.obs}` : ''
  ].filter(Boolean).join(' | ');
  return {
    uid: i.uid || uid(),
    qty,
    product: {
      id: i.id || i.product?.id || uid(),
      name: i.name || i.product?.name || 'Produto',
      cat: i.category || i.product?.cat || 'Cardápio online',
      price: Number(i.basePrice ?? i.price ?? i.product?.price ?? 0)
    },
    adds: addons.map((a,idx)=>({ id:a.id || idx+1, name:a.name || String(a), price:Number(a.price)||0 })),
    included,
    obs: addText
  };
}
function orderFromSupabase(row, index=0){
  const customer = row.customer || {};
  const customerName = typeof customer === 'string' ? customer : [customer.name, customer.phone].filter(Boolean).join(' • ');
  return {
    id: row.id,
    supabaseId: row.id,
    num: row.order_number || row.num || (index+1),
    date: row.created_at || row.date || new Date().toISOString(),
    customer: customerName || 'Cliente online',
    customerData: customer,
    items: (row.items||[]).map(itemFromSupabase),
    obs: [
      row.order_type ? `Tipo: ${row.order_type}` : '',
      customer.address ? `Endereço: ${customer.address}` : '',
      customer.reference ? `Referência: ${customer.reference}` : '',
      row.payment_method ? `Pagamento: ${normalizePaymentName(row.payment_method)}` : '',
      row.change_for ? `Troco para: ${row.change_for}` : '',
      row.coupon?.code ? `Cupom: ${row.coupon.code} (${row.coupon.percent}% off)` : ''
    ].filter(Boolean).join(' | '),
    status: row.status || 'novo',
    discount: Number(row.discount)||0,
    extra: Number(row.extra)||0,
    payments: row.payment_method ? [{method: normalizePaymentName(row.payment_method), value: Number(row.total)||0}] : [],
    fiado: !!row.fiado,
    totalFromSupabase: Number(row.total)||0,
    source: row.source || 'supabase'
  };
}
function orderToSupabase(o){
  return {
    customer: { name:o.customer || 'Cliente balcão' },
    items: (o.items||[]).map(i=>({
      uid:i.uid,
      id:i.product?.id,
      name:i.product?.name,
      category:i.product?.cat,
      basePrice:Number(i.product?.price)||0,
      qty:Number(i.qty)||1,
      addons:i.adds||[],
      included:i.included||[],
      observation:i.obs||'',
      total:calcItem(i)
    })),
    subtotal: (o.items||[]).reduce((s,i)=>s+calcItem(i),0),
    delivery_fee:0,
    total: calcOrder(o),
    payment_method: o.payments?.[0]?.method || null,
    order_type:'balcao',
    source:'verbo-hub-painel',
    status:o.status || 'aberto'
  };
}
async function fetchSupabaseOrders(){
  if(!supabase) return null;
  const {data,error}=await adminRpc('admin_list_orders');
  if(error){ console.error(error); return null; }
  return (data||[]).map(orderFromSupabase);
}





function slugify(v){ return String(v||'categoria').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'categoria'; }
function productFromMenuItem(row){ return { id:row.id, cat:row.category_name || row.cat || 'Cardápio', name:row.name, description:row.description || '', price:Number(row.price)||0, active:row.active !== false, category_id:row.category_id || slugify(row.category_name), icon:row.icon || '🍽️', addons:row.addons ?? null, sort_order:row.sort_order || 0 }; }
function menuItemFromProduct(p, index=0){ return { id:String(p.id || slugify(p.name)+'-'+Date.now()), category_id:p.category_id || slugify(p.cat), category_name:p.cat || 'Cardápio', icon:p.icon || '🍽️', addons:p.addons ?? null, name:p.name, description:p.description || '', price:Number(p.price)||0, active:p.active !== false, sort_order:Number(p.sort_order ?? index)||0, updated_at:new Date().toISOString() }; }
async function fetchMenuItems(){ if(!supabase) return null; const {data,error}=await adminRpc('admin_list_menu_items'); if(error){ console.error(error); return null; } return (data||[]).map(productFromMenuItem); }
async function saveProductRemote(p,index=0){ if(!supabase) return {error:null}; return await adminRpc('admin_upsert_menu_item', { item: menuItemFromProduct(p,index) }); }
async function deleteProductRemote(id){ if(!supabase) return {error:null}; return await adminRpc('admin_delete_menu_item', { item_id: String(id) }); }
async function fetchCoupons(){ if(!supabase) return null; const {data,error}=await adminRpc('admin_list_coupons'); if(error){ console.error(error); return null; } return data||[]; }
async function saveCouponRemote(c){
  if(!supabase) return {error:null};
  const payload={ code:String(c.code||c.name||'').trim().toUpperCase(), percent:Number(c.percent)||0, active:c.active!==false };
  return await adminRpc('admin_upsert_coupon', { coupon: payload });
}
async function deleteCouponRemote(id){ if(!supabase) return {error:null}; return await adminRpc('admin_delete_coupon', { coupon_id: id }); }

async function fetchStoreSettings(){
  if(!supabase) return null;
  const {data,error}=await supabase.from('store_settings').select('*').eq('id','main').maybeSingle();
  if(error){ console.error(error); return null; }
  return data;
}
async function saveStoreSettings(open, estimated=25, message, whatsapp='5567993248754'){
  if(!supabase) return null;
  const payload={id:'main', is_open:!!open, estimated_minutes:Number(estimated)||25, message:message || (open?'Estamos recebendo pedidos normalmente.':'Loja fechada no momento.'), whatsapp_number:onlyDigits(whatsapp)||'5567993248754', updated_at:new Date().toISOString()};
  const {error}=await adminRpc('admin_save_store_settings', { settings: payload });
  if(error) alert('Erro ao salvar loja aberta/fechada: '+error.message);
  return !error;
}

const defaultReceiptSettings = {
  name:'Verbo Hub',
  document:'',
  phone:'',
  address:'',
  footer:'Obrigado pela preferência!'
};
async function fetchReceiptSettings(){
  if(!supabase) return null;
  const {data,error}=await adminRpc('admin_get_receipt_settings');
  if(error){ console.error(error); return null; }
  return data || null;
}
async function saveReceiptSettingsRemote(settings){
  if(!supabase) return {data:null,error:null};
  return await adminRpc('admin_save_receipt_settings', { settings });
}
function onlyDigits(v){ return String(v || '').replace(/\D/g,''); }
function formatPhone(v){ const d=onlyDigits(v); if(!d) return ''; if(d.startsWith('55')) return d; return '55'+d; }
function categoryIconName(cat){
  const c=String(cat||'').toLowerCase();
  if(c.includes('burger')) return 'burger';
  if(c.includes('tapioca')) return 'tapioca';
  if(c.includes('cuscuz')) return 'cuscuz';
  if(c.includes('suco')||c.includes('detox')) return 'juice';
  if(c.includes('refrigerante')||c.includes('bebida')) return 'drink';
  if(c.includes('milk')) return 'shake';
  return 'plate';
}
function CategoryBadge({cat}){ return <span className={'catIcon '+categoryIconName(cat)} aria-hidden="true"></span>; }

function safeText(v){
  return String(v ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
}
function receiptHeader(settings={}, orderLabel=''){
  const s={...defaultReceiptSettings,...settings};
  return `<div class="r-center"><img class="r-logo" src="/logo-verbohub.jpeg"/><div class="r-title">${safeText(s.name || 'Verbo Hub')}</div>${s.document?`<div class="r-sub">${safeText(s.document)}</div>`:''}${s.phone?`<div class="r-sub">Tel: ${safeText(s.phone)}</div>`:''}${s.address?`<div class="r-sub">${safeText(s.address)}</div>`:''}${orderLabel?`<div class="r-sub">${safeText(orderLabel)}</div>`:''}</div>`;
}
function receiptStyle(kind='finance'){return `<style>
@page{size:80mm auto;margin:0}
*{box-sizing:border-box}body{margin:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;font-size:${kind==='order'?'15px':'12px'};font-weight:${kind==='order'?'600':'400'}}.receipt80{width:80mm;max-width:80mm;padding:${kind==='order'?'3mm 3mm 7mm':'4mm 4mm 7mm'};margin:0 auto}.r-center{text-align:center}.r-logo{width:${kind==='order'?'20mm':'18mm'};height:${kind==='order'?'20mm':'18mm'};border-radius:50%;object-fit:cover;margin:0 auto 2mm;display:block}.r-title{font-size:${kind==='order'?'24px':'20px'};font-weight:900;letter-spacing:.8px;text-transform:uppercase}.r-sub{font-size:${kind==='order'?'13px':'11px'};margin-top:1mm}.r-line{border-top:1px dashed #000;margin:3mm 0}.r-row{display:flex;justify-content:space-between;gap:3mm;align-items:flex-start}.r-row span:first-child{max-width:${kind==='order'?'54mm':'47mm'}}.r-bold{font-weight:900}.r-total{font-size:${kind==='order'?'24px':'18px'};font-weight:900;text-align:center;border:2px solid #000;border-radius:3mm;padding:2.5mm;margin-top:3mm}.r-item{margin:${kind==='order'?'3.5mm':'2.5mm'} 0}.r-item-title{font-size:${kind==='order'?'20px':'14px'};font-weight:900}.r-qty{font-size:${kind==='order'?'23px':'16px'};font-weight:900}.r-add{padding-left:3mm;font-size:${kind==='order'?'14px':'11px'};line-height:1.35}.r-muted{font-size:${kind==='order'?'13px':'11px'}}.r-footer{font-size:${kind==='order'?'12px':'10px'};text-align:center;margin-top:4mm}.no-print{display:none!important}@media print{html,body{width:80mm}.receipt80{width:80mm}}</style>`}
function openPrint(html, kind='finance'){const w=window.open('','_blank','width=520,height=760');w.document.write(`<!doctype html><html><head><title>Impressão Verbo Hub</title>${receiptStyle(kind)}</head><body>${html}<script>window.onload=()=>{setTimeout(()=>window.print(),200)}<\/script></body></html>`);w.document.close();}
function moneyLine(label,value){return `<div class="r-row"><span>${safeText(label)}</span><b>${BRL(value)}</b></div>`}
function orderReceipt(o,total,settings={}){return `<div class="receipt80">${receiptHeader(settings,`Pedido #${o.num} • ${today()}`)}<div class="r-line"></div><div class="r-row"><b>Cliente</b><span>${safeText(o.customer)}</span></div><div class="r-row"><b>Status</b><span>${safeText(o.status)}</span></div><div class="r-line"></div>${(o.items||[]).map(i=>{ const qty=Number(i.qty)||1; return `<div class="r-item"><div class="r-row"><span class="r-item-title"><span class="r-qty">${qty}x</span> ${safeText(i.product.name)}</span><b>${BRL(calcItem(i))}</b></div>${(i.adds||[]).length?`<div class="r-add">${i.adds.map(a=>`+ ${safeText(a.name)}`).join('<br/>')}</div>`:''}${i.obs?`<div class="r-add">Obs item: ${safeText(i.obs)}</div>`:''}</div>`}).join('')}${o.obs?`<div class="r-line"></div><div class="r-bold">OBSERVAÇÃO</div><div>${safeText(o.obs)}</div>`:''}<div class="r-line"></div>${moneyLine('Desconto',Number(o.discount)||0)}${moneyLine('Valor extra',Number(o.extra)||0)}${(o.payments||[]).map(p=>moneyLine(p.method,Number(p.value)||0)).join('')}<div class="r-total">TOTAL ${BRL(total)}</div><div class="r-footer">${safeText(settings.footer || defaultReceiptSettings.footer)}</div></div>`}
function financeReceipt({categoryRows,methodsRows,cashOpen,dinheiroRecebido,dinheiroEsperado,cashClose,diferenca,total,canceled,fiado,done,dateLabel='Hoje',gross=0,discounts=0,ticket=0},settings={}){return `<div class="receipt80">${receiptHeader(settings,`FECHAMENTO DE CAIXA • ${dateLabel}`)}<div class="r-line"></div><div class="r-row"><b>Pedidos concluídos</b><span>${done.length}</span></div><div class="r-row"><b>Pedidos cancelados</b><span>${canceled}</span></div>${moneyLine('Faturamento bruto',gross)}${moneyLine('Descontos',discounts)}${moneyLine('Faturamento líquido',total)}${moneyLine('Ticket médio',ticket)}${moneyLine('Fiado em aberto',fiado)}<div class="r-line"></div><div class="r-bold">VENDAS POR CATEGORIA</div>${categoryRows.map(r=>`<div class="r-row"><span>${r.label}</span><b>${r.qtd} un • ${BRL(r.valor)}</b></div>`).join('')}<div class="r-line"></div><div class="r-bold">FORMAS DE PAGAMENTO</div>${methodsRows.map(r=>moneyLine(r.method,r.value)).join('')}<div class="r-line"></div><div class="r-bold">CAIXA EM DINHEIRO</div>${moneyLine('Abertura',cashOpen)}${moneyLine('Dinheiro recebido',dinheiroRecebido)}${moneyLine('Fechamento esperado',dinheiroEsperado)}${moneyLine('Fechamento informado',cashClose)}${moneyLine('Diferença',diferenca)}<div class="r-total">TOTAL ${BRL(total)}</div><div class="r-footer">Relatório gerado pelo sistema Verbo Hub</div></div>`}

function calcItem(item){
  const qty = Number(item.qty)||1;
  const base = Number(item.product.price)||0;
  const adds = item.adds || [];
  const isCuscuzBase = item.product.name.toLowerCase().includes('cuscuz base');
  const isCuscuzPremium = item.product.name.toLowerCase().includes('cuscuz premium');
  const unit = isCuscuzPremium ? base : (isCuscuzBase ? base + adds.slice(3).reduce((s,a)=>s+Number(a.price),0) : base + adds.reduce((s,a)=>s+Number(a.price),0));
  return unit * qty;
}
function calcOrder(o){return Math.max(0,(o.items||[]).reduce((s,i)=>s+calcItem(i),0)+(Number(o.extra)||0)-(Number(o.discount)||0));}

function App(){
 const [tab,setTab]=useState('novo');
 const [products,setProducts]=useState(()=>store.get('vh_products_v3',seedProducts));
 const [adds,setAdds]=useState(()=>store.get('vh_adds_v3',seedAdds));
 const [coupons,setCoupons]=useState(()=>store.get('vh_coupons_v1',[]));
 const [orders,setOrders]=useState(()=>store.get('vh_orders_v3',[]));
 const [syncStatus,setSyncStatus]=useState(supabase?'Conectando ao Supabase...':'Modo local: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para sincronizar.');
 const beepRef=useRef(null);
 const latestOrderRef=useRef(null);
 const [open,setOpen]=useState(()=>store.get('vh_store_open',false));
 const [estimatedMinutes,setEstimatedMinutes]=useState(()=>store.get('vh_estimated_minutes',25));
 const [storeMessage,setStoreMessage]=useState(()=>store.get('vh_store_message','Estamos recebendo pedidos normalmente.'));
 const [deliveryWhatsApp,setDeliveryWhatsApp]=useState(()=>store.get('vh_delivery_whatsapp','5567993248754'));
 const [cashOpen,setCashOpen]=useState(()=>store.get('vh_cash_open',0));
 const [cashClose,setCashClose]=useState(()=>store.get('vh_cash_close',0));
 const [receiptSettings,setReceiptSettings]=useState(()=>store.get('vh_receipt_settings',defaultReceiptSettings));
 const [cart,setCart]=useState([]); const [customer,setCustomer]=useState(''); const [obs,setObs]=useState('');
 const cats=useMemo(()=>[...new Set(products.map(p=>p.cat))], [products]);
 const saveOrders=v=>{setOrders(v);store.set('vh_orders_v3',v)};
 const refreshOrders=async()=>{ const remote=await fetchSupabaseOrders(); if(remote){ const latest=remote[0]?.id || null; if(latestOrderRef.current && latest && latest !== latestOrderRef.current){ try{beepRef.current?.play()}catch(e){} } latestOrderRef.current=latest || latestOrderRef.current; saveOrders(remote); setSyncStatus('Sincronizado com Supabase'); } const st=await fetchStoreSettings(); if(st){ setOpen(st.is_open!==false); store.set('vh_store_open',st.is_open!==false); setEstimatedMinutes(st.estimated_minutes||25); store.set('vh_estimated_minutes',st.estimated_minutes||25); setStoreMessage(st.message||''); store.set('vh_store_message',st.message||''); setDeliveryWhatsApp(st.whatsapp_number||'5567993248754'); store.set('vh_delivery_whatsapp',st.whatsapp_number||'5567993248754'); } const rs=await fetchReceiptSettings(); if(rs){ const merged={...defaultReceiptSettings,...rs}; setReceiptSettings(merged); store.set('vh_receipt_settings',merged); } const remoteCoupons=await fetchCoupons(); if(remoteCoupons){ setCoupons(remoteCoupons); store.set('vh_coupons_v1',remoteCoupons); } const remoteProducts=await fetchMenuItems(); if(remoteProducts && remoteProducts.length){ setProducts(remoteProducts); store.set('vh_products_v3',remoteProducts); } };
 useEffect(()=>{ refreshOrders(); if(!supabase) return; const timer=setInterval(refreshOrders,5000); const stch=supabase.channel('store-settings-painel').on('postgres_changes',{event:'*',schema:'public',table:'store_settings'}, refreshOrders).subscribe(); return()=>{clearInterval(timer); supabase.removeChannel(stch);}; },[]);
 const saveProducts=v=>{setProducts(v);store.set('vh_products_v3',v)};
 const saveAdds=v=>{setAdds(v);store.set('vh_adds_v3',v)};
 const saveCoupons=v=>{setCoupons(v);store.set('vh_coupons_v1',v)};
 const setOpenStore=async v=>{
   if(v){ const val=prompt('Com quanto em dinheiro está abrindo a loja?','0'); if(val===null) return; setCashOpen(Number(String(val).replace(',','.'))||0); store.set('vh_cash_open',Number(String(val).replace(',','.'))||0); setCashClose(0); store.set('vh_cash_close',0); }
   else { const val=prompt('Quanto tem em dinheiro no caixa ao fechar?','0'); if(val===null) return; setCashClose(Number(String(val).replace(',','.'))||0); store.set('vh_cash_close',Number(String(val).replace(',','.'))||0); }
   setOpen(v);store.set('vh_store_open',v);
   await saveStoreSettings(v, estimatedMinutes, v?'Estamos recebendo pedidos normalmente.':'Loja fechada no momento.', deliveryWhatsApp);
 };
 const addProduct=p=>setCart([...cart,{uid:uid(),product:p,adds:[],obs:''}]);
 const toggleAdd=(id,a)=>setCart(cart.map(i=>i.uid===id?{...i,adds:i.adds.find(x=>x.id===a.id)?i.adds.filter(x=>x.id!==a.id):[...i.adds,a]}:i));
 const subtotal=cart.reduce((s,i)=>s+calcItem(i),0);
 const createOrder=async()=>{ 
   if(!cart.length) return alert('Adicione produtos ao pedido.'); 
   const o={id:uid(),num:orders.length+1,date:new Date().toISOString(),customer:customer||'Cliente balcão',items:cart,obs,status:'aberto',discount:0,extra:0,payments:[],fiado:false}; 
   if(supabase){
     const {error}=await adminRpc('admin_insert_order', { order_data: orderToSupabase(o) });
     if(error){ alert('Erro ao salvar no Supabase: '+error.message); return; }
     await refreshOrders();
   } else {
     saveOrders([o,...orders]);
   }
   setCart([]); setCustomer(''); setObs(''); setTab('pedidos'); 
 };
 const update=async(id,patch)=>{
   const next=orders.map(o=>o.id===id?{...o,...patch}:o);
   saveOrders(next);
   if(supabase){
     const current=next.find(o=>o.id===id);
     const payload={status:current.status, discount:Number(current.discount)||0, extra:Number(current.extra)||0, fiado:!!current.fiado};
     if(current.payments) payload.payment_method=current.payments[0]?.method || null;
     const {error}=await adminRpc('admin_update_order', { order_id: id, patch: payload });
     if(error) alert('Erro ao atualizar no Supabase: '+error.message);
   }
 };
 const cancel=id=>confirm('Cancelar este pedido?')&&update(id,{status:'cancelado'});
 const day=orders.filter(o=>new Date(o.date).toLocaleDateString('pt-BR')===today());
 const done=day.filter(o=>o.status==='concluido');
 const updateStoreConfig=async()=>{ const cleanPhone=formatPhone(deliveryWhatsApp); store.set('vh_estimated_minutes',estimatedMinutes); store.set('vh_store_message',storeMessage); store.set('vh_delivery_whatsapp',cleanPhone); setDeliveryWhatsApp(cleanPhone); await saveStoreSettings(open, estimatedMinutes, storeMessage, cleanPhone); alert('Configuração da loja salva.'); };
 return <div className="app shell">
  <audio ref={beepRef} src="/pedido.wav" preload="auto"></audio>
  <aside className="sidebar noPrint"><div className="brand"><img src="/logo-verbohub.jpeg"/><div><b>VERBO HUB</b><span>Painel operacional</span></div></div><nav>{[['novo','Novo pedido','plus'],['pedidos','Pedidos ativos','orders'],['finalizados','Finalizados','done'],['cozinha','Cozinha','kitchen'],['financeiro','Financeiro','finance'],['cardapio','Cardápio','menu'],['cupons','Cupons','coupon'],['recibo','Configurações','settings']].map(t=><button key={t[0]} className={(tab===t[0]?'on ':'')+'navItem '+t[2]} onClick={()=>setTab(t[0])}><span></span>{t[1]}</button>)}</nav><p className="sideFoot">{open?'Loja aberta':'Loja fechada'} • {today()}</p></aside>
  <section className="workspace"><header className="top"><div><small>PAINEL OPERACIONAL</small><h1>{tab==='novo'?'Novo pedido':tab==='pedidos'?'Pedidos ativos':tab==='finalizados'?'Finalizados':tab==='cozinha'?'Cozinha':tab==='financeiro'?'Financeiro':tab==='cardapio'?'Cardápio':tab==='cupons'?'Cupons':'Configurações'}</h1><p>{open?'Loja aberta':'Loja fechada'} • {today()} • {syncStatus}</p></div><div className="storeControls"><label>Tempo <input type="number" value={estimatedMinutes} onChange={e=>setEstimatedMinutes(e.target.value)}/> min</label><input placeholder="Mensagem da loja" value={storeMessage} onChange={e=>setStoreMessage(e.target.value)}/><button className="ghost" onClick={updateStoreConfig}>Salvar</button><button className={open?'danger':'primary'} onClick={()=>setOpenStore(!open)}>{open?'Fechar loja':'Abrir loja'}</button></div></header>
  {tab==='novo'&&<main className="layout"><section className="panel"><h2>Novo pedido</h2><div className="formline"><input placeholder="Nome do cliente / mesa" value={customer} onChange={e=>setCustomer(e.target.value)}/><textarea placeholder="Observação geral" value={obs} onChange={e=>setObs(e.target.value)}/></div><div className="catalog">{cats.map(c=><div className="cat" key={c}><h3><CategoryBadge cat={c}/>{c}</h3>{products.filter(p=>p.cat===c&&p.active).map(p=><button className="product" key={p.id} onClick={()=>addProduct(p)}><span>{p.name}</span><b>{BRL(p.price)}</b></button>)}</div>)}</div></section><section className="panel ticket"><h2>Pedido atual</h2>{cart.length===0&&<p className="muted">Escolha os produtos do cardápio.</p>}{cart.map(i=><div className="cartitem" key={i.uid}><div className="row"><b>{i.product.name}</b><button className="ghost dangerText" onClick={()=>setCart(cart.filter(x=>x.uid!==i.uid))}>remover</button></div>{i.product.name.toLowerCase().includes('cuscuz base')&&<small>{Math.min(i.adds.length,3)}/3 adicionais grátis • depois cobra automático</small>}{i.product.name.toLowerCase().includes('cuscuz premium')&&<small>Produto fechado: carne seca, queijo e queijo coalho inclusos.</small>}{!i.product.name.toLowerCase().includes('cuscuz premium')&&<div className="chips">{adds.filter(a=>!(i.product.name.toLowerCase().includes('cuscuz base') && a.name.toLowerCase().includes('carne seca'))).map(a=><button key={a.id} className={i.adds.find(x=>x.id===a.id)?'chip on':'chip'} onClick={()=>toggleAdd(i.uid,a)}>{a.name} {i.product.name.toLowerCase().includes('cuscuz base')?'':`+ ${BRL(a.price)}`}</button>)}</div>}<b className="totalitem">{BRL(calcItem(i))}</b></div>)}<h2>Total: {BRL(subtotal)}</h2><button className="primary big" onClick={createOrder}>Salvar como pedido aberto</button></section></main>}
  {tab==='pedidos'&&<><Dashboard orders={orders} done={done} day={day}/><main className="orders">{orders.filter(o=>!['concluido','cancelado'].includes(o.status)).length===0&&<section className="panel"><h2>Nenhum pedido ativo</h2><p className="muted">Pedidos concluídos ficam na aba Finalizados.</p></section>}{orders.filter(o=>!['concluido','cancelado'].includes(o.status)).map(o=><Order key={o.id} o={o} update={update} cancel={cancel} receiptSettings={receiptSettings}/>)}</main></>}
  {tab==='finalizados'&&<Finalizados orders={orders} update={update} receiptSettings={receiptSettings}/>}
  {tab==='cozinha'&&<Kitchen orders={orders} update={update}/>}
  {tab==='financeiro'&&<Financeiro day={day} done={done} orders={orders} open={open} setOpenStore={setOpenStore} cashOpen={cashOpen} cashClose={cashClose} setCashOpen={v=>{setCashOpen(v);store.set('vh_cash_open',v)}} setCashClose={v=>{setCashClose(v);store.set('vh_cash_close',v)}} receiptSettings={receiptSettings}/>} 
  {tab==='cardapio'&&<Cardapio products={products} saveProducts={saveProducts} adds={adds} saveAdds={saveAdds}/>}
  {tab==='cupons'&&<Cupons coupons={coupons} saveCoupons={saveCoupons}/>} 
  {tab==='recibo'&&<Recibo receiptSettings={receiptSettings} setReceiptSettings={setReceiptSettings} deliveryWhatsApp={deliveryWhatsApp} setDeliveryWhatsApp={setDeliveryWhatsApp} saveStoreConfig={updateStoreConfig}/>} 
  </section>
 </div>;
}


function localDateKey(date){
 const d = new Date(date || Date.now());
 const y = d.getFullYear();
 const m = String(d.getMonth()+1).padStart(2,'0');
 const day = String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
}
function brDateFromKey(key){
 if(!key) return today();
 const [y,m,d]=String(key).split('-');
 return `${d}/${m}/${y}`;
}
function dateOffsetKey(offsetDays=0){
 const d = new Date();
 d.setHours(12,0,0,0);
 d.setDate(d.getDate()+offsetDays);
 return localDateKey(d);
}
function buildFinanceData(allOrders, selectedDate, cashOpen=0, cashClose=0){
 const selectedOrders = allOrders.filter(o=>localDateKey(o.date)===selectedDate);
 const done = selectedOrders.filter(o=>o.status==='concluido');
 const canceled = selectedOrders.filter(o=>o.status==='cancelado').length;
 const fiado = selectedOrders.filter(o=>o.fiado&&o.status!=='concluido').reduce((sum,o)=>sum+calcOrder(o),0);
 const methods=['Pix','Débito','Crédito','Dinheiro'];
 const aliases={
  'Burgers':['Burgers'],
  'Tapiocas Salgadas':['Tapiocas Salgadas'],
  'Tapiocas Doces':['Tapiocas Doces'],
  'Cuscuz':['Cuscuz'],
  'Milkshakes':['Milkshakes'],
  'Refrigerantes':['Refrigerantes'],
  'Sucos Naturais':['Sucos Naturais','Detox']
 };
 const categoryRows=Object.entries(aliases).map(([label,list])=>{
  let qtd=0, valor=0;
  done.forEach(o=>(o.items||[]).forEach(i=>{
    if(list.includes(i.product.cat)){qtd+=Number(i.qty)||1; valor+=calcItem(i)}
  }));
  return {label,qtd,valor};
 });
 const methodsRows=methods.map(method=>({method,value:done.flatMap(o=>o.payments||[]).filter(p=>p.method===method).reduce((sum,p)=>sum+Number(p.value||0),0)}));
 const dinheiroRecebido=methodsRows.find(x=>x.method==='Dinheiro')?.value||0;
 const dinheiroEsperado=(Number(cashOpen)||0)+dinheiroRecebido;
 const diferenca=(Number(cashClose)||0)-dinheiroEsperado;
 const gross=done.reduce((sum,o)=>sum+(o.items||[]).reduce((s,i)=>s+calcItem(i),0)+(Number(o.extra)||0),0);
 const discounts=done.reduce((sum,o)=>sum+(Number(o.discount)||0),0);
 const total=done.reduce((sum,o)=>sum+calcOrder(o),0);
 const ticket=done.length?total/done.length:0;
 return {selectedOrders,done,canceled,fiado,methodsRows,categoryRows,dinheiroRecebido,dinheiroEsperado,diferenca,gross,discounts,total,ticket};
}


function Dashboard({orders,done,day}){
 const active=orders.filter(o=>!['concluido','cancelado'].includes(o.status)).length;
 const total=done.reduce((s,o)=>s+calcOrder(o),0);
 const ticket=done.length?total/done.length:0;
 return <main className="dash"><section className="card pro"><p>Faturamento hoje</p><h2>{BRL(total)}</h2></section><section className="card pro"><p>Pedidos hoje</p><h2>{day.length}</h2></section><section className="card pro"><p>Ticket médio</p><h2>{BRL(ticket)}</h2></section><section className="card pro"><p>Pedidos ativos</p><h2>{active}</h2></section></main>;
}


function useNowTick(){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{ const t=setInterval(()=>setNow(Date.now()),1000); return()=>clearInterval(t); },[]);
 return now;
}
function prepClock(date, now){
 const started = new Date(date || Date.now()).getTime();
 const elapsed = Math.max(0, Math.floor((now-started)/1000));
 const remaining = Math.max(0, (20*60)-elapsed);
 const mm = String(Math.floor(remaining/60)).padStart(2,'0');
 const ss = String(remaining%60).padStart(2,'0');
 return {elapsed,remaining,label:`${mm}:${ss}`};
}


function Finalizados({orders,update,receiptSettings}){
 const finished=orders.filter(o=>['concluido','cancelado'].includes(o.status));
 const grouped=finished.reduce((acc,o)=>{
   const key=localDateKey(o.date);
   acc[key]=acc[key]||[];
   acc[key].push(o);
   return acc;
 },{});
 const keys=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
 return <main className="orders finishedOrders">
  {finished.length===0&&<section className="panel"><h2>Nenhum pedido finalizado</h2><p className="muted">Quando concluir ou cancelar um pedido, ele aparece aqui.</p></section>}
  {keys.map(key=><section className="panel finishedDay" key={key}>
    <div className="row"><h2>{brDateFromKey(key)}</h2><span className="badge">{grouped[key].length} pedido(s)</span></div>
    {grouped[key].map(o=>{
      const total=calcOrder(o);
      return <div className={'finishedCard '+o.status} key={o.id}>
        <div className="row"><div><b>#{o.num} • {o.customer}</b><p className="muted">{new Date(o.date).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} • {o.status}</p></div><b>{BRL(total)}</b></div>
        <div className="finishedItems">{(o.items||[]).map((i,k)=><span key={k}>{i.qty||1}x {i.product.name}</span>)}</div>
        <div className="actions">
          <button onClick={()=>openPrint(orderReceipt(o,total,receiptSettings),'order')}>Reimprimir pedido</button>
          {o.status==='concluido'&&<button className="ghost" onClick={()=>update(o.id,{status:'aberto'})}>Voltar para ativos</button>}
        </div>
      </div>
    })}
  </section>)}
 </main>;
}

function Kitchen({orders,update}){
 const now=useNowTick();
 const list=orders.filter(o=>!['concluido','cancelado'].includes(o.status));
 return <main className="kitchen"><section className="kitchenHead"><h2>🔥 Tela da Cozinha</h2><p>Meta de preparo: máximo 20 minutos por pedido. O relógio fica vermelho quando estoura.</p></section>{list.length===0&&<section className="panel"><h2>Nenhum pedido ativo na cozinha</h2></section>}{list.map(o=>{ const clock=prepClock(o.date,now); return <section className={'kitchenOrder '+o.status+(clock.remaining<=0?' late':'')} key={o.id}><div className="row"><h2>#{o.num} • {o.customer}</h2><span className={clock.remaining<=0?'badge danger':'badge'}>⏱ {clock.remaining<=0?'Estourou 20 min':clock.label}</span><span className="badge">{o.status}</span></div>{o.items.map((i,k)=><div className="kitem" key={k}><b>{i.qty||1}x {i.product.name}</b>{i.adds?.length? <small>Extras: {i.adds.map(a=>a.name).join(', ')}</small>:null}{i.included?.length? <small>Inclusos: {i.included.join(', ')}</small>:null}{i.obs? <em>Obs: {i.obs}</em>:null}</div>)}{o.obs&&<p className="warn">Obs geral: {o.obs}</p>}<div className="actions"><button onClick={()=>update(o.id,{status:'preparando'})}>Preparando</button><button className="primary" onClick={()=>update(o.id,{status:'concluido'})}>Pronto/Concluir</button></div></section>})}</main>;
}

function Order({o,update,cancel,receiptSettings}){const[discount,setDiscount]=useState(o.discount||0),[extra,setExtra]=useState(o.extra||0),[pays,setPays]=useState(o.payments?.length?o.payments:[{method:'Pix',value:''}]); const total=calcOrder({...o,discount,extra,payments:pays}); const paid=pays.reduce((s,p)=>s+Number(p.value||0),0); const save=patch=>update(o.id,{discount:Number(discount)||0,extra:Number(extra)||0,payments:pays,...patch}); return <section className={'panel order '+o.status}><div className="row"><h2>#{o.num} • {o.customer}</h2><span className="badge">{o.status}</span></div>{o.items.map((i,k)=><p key={k}><b>{i.qty||1}x {i.product.name}</b>{i.adds.length?` + ${i.adds.map(a=>a.name).join(', ')}`:''}{i.obs?` • ${i.obs}`:''} — {BRL(calcItem(i))}</p>)}{o.obs&&<p className="muted">Obs: {o.obs}</p>}<div className="checkout"><label>Desconto R$<input type="number" value={discount} onChange={e=>setDiscount(e.target.value)}/></label><label>Valor extra R$<input type="number" value={extra} onChange={e=>setExtra(e.target.value)}/></label><label className="check"><input type="checkbox" checked={o.fiado} onChange={e=>update(o.id,{fiado:e.target.checked})}/> Fiado</label></div><h2>Total: {BRL(total)}</h2><h3>Pagamento dividido</h3>{pays.map((p,idx)=><div className="pay" key={idx}><select value={p.method} onChange={e=>setPays(pays.map((x,i)=>i===idx?{...x,method:e.target.value}:x))}><option>Pix</option><option>Débito</option><option>Crédito</option><option>Dinheiro</option></select><input type="number" placeholder="valor" value={p.value} onChange={e=>setPays(pays.map((x,i)=>i===idx?{...x,value:e.target.value}:x))}/></div>)}<button className="ghost" onClick={()=>setPays([...pays,{method:'Pix',value:''}])}>+ forma de pagamento</button><p className={paid>=total?'ok':'warn'}>Pago: {BRL(paid)} • Falta: {BRL(Math.max(0,total-paid))}</p><div className="actions"><button onClick={()=>save({status:'aberto'})}>Aberto</button><button onClick={()=>save({status:'aguardando pagamento'})}>Aguardando</button><button className="primary" onClick={()=>save({status:'concluido'})}>Concluir</button><button onClick={()=>openPrint(orderReceipt({...o,discount:Number(discount)||0,extra:Number(extra)||0,payments:pays}, total, receiptSettings),'order')}>Imprimir pedido 80mm</button><button className="danger" onClick={()=>cancel(o.id)}>Cancelar</button></div></section>}

function Financeiro({day,done,orders,open,setOpenStore,cashOpen,cashClose,setCashOpen,setCashClose,receiptSettings}){
 const [selectedDate,setSelectedDate]=useState(dateOffsetKey(0));
 const [reportCashOpen,setReportCashOpen]=useState(cashOpen||0);
 const [reportCashClose,setReportCashClose]=useState(cashClose||0);
 const data=useMemo(()=>buildFinanceData(orders, selectedDate, reportCashOpen, reportCashClose),[orders,selectedDate,reportCashOpen,reportCashClose]);
 const todayData=useMemo(()=>buildFinanceData(orders, dateOffsetKey(0), cashOpen, cashClose),[orders,cashOpen,cashClose]);
 const yesterdayData=useMemo(()=>buildFinanceData(orders, dateOffsetKey(-1), 0, 0),[orders]);
 const dateLabel=brDateFromKey(selectedDate);
 const printClose=()=>openPrint(financeReceipt({...data,cashOpen:reportCashOpen,cashClose:reportCashClose,dateLabel},receiptSettings),'finance');
 const useTodayCash=()=>{ setReportCashOpen(Number(cashOpen)||0); setReportCashClose(Number(cashClose)||0); };
 const setQuickDate=(offset)=>{ const key=dateOffsetKey(offset); setSelectedDate(key); if(offset===0){ setReportCashOpen(Number(cashOpen)||0); setReportCashClose(Number(cashClose)||0); } else { setReportCashOpen(0); setReportCashClose(0); } };
 return <main className="finance">
  <section className="card"><p>Total vendido hoje</p><h2>{BRL(todayData.total)}</h2></section>
  <section className="card"><p>Concluídos hoje</p><h2>{todayData.done.length}</h2></section>
  <section className="card"><p>Total vendido ontem</p><h2>{BRL(yesterdayData.total)}</h2></section>
  <section className="card"><p>Concluídos ontem</p><h2>{yesterdayData.done.length}</h2></section>
  <section className="panel wide printArea">
   <div className="row"><div><h2>Fechamento de caixa • {dateLabel}</h2><p className="muted">Escolha qualquer data salva no Supabase para ver, conferir e imprimir o fechamento.</p></div><button onClick={printClose}>Imprimir fechamento</button></div>
   <div className="cashbox noPrint">
    <button className={selectedDate===dateOffsetKey(0)?'primary':'ghost'} onClick={()=>setQuickDate(0)}>Hoje</button>
    <button className={selectedDate===dateOffsetKey(-1)?'primary':'ghost'} onClick={()=>setQuickDate(-1)}>Ontem</button>
    <label>Data do fechamento<input type="date" value={selectedDate} onChange={e=>{setSelectedDate(e.target.value); setReportCashOpen(0); setReportCashClose(0);}}/></label>
    <label>Dinheiro na abertura<input type="number" value={reportCashOpen} onChange={e=>setReportCashOpen(Number(e.target.value)||0)}/></label>
    <label>Dinheiro no fechamento<input type="number" value={reportCashClose} onChange={e=>setReportCashClose(Number(e.target.value)||0)}/></label>
    {selectedDate===dateOffsetKey(0)&&<button className="ghost" onClick={useTodayCash}>Usar caixa de hoje</button>}
   </div>
   <div className="dash mini">
    <section className="card"><p>Faturamento bruto</p><h2>{BRL(data.gross)}</h2></section>
    <section className="card"><p>Descontos</p><h2>{BRL(data.discounts)}</h2></section>
    <section className="card"><p>Faturamento líquido</p><h2>{BRL(data.total)}</h2></section>
    <section className="card"><p>Ticket médio</p><h2>{BRL(data.ticket)}</h2></section>
   </div>
   <p className="row"><b>Pedidos concluídos</b><span>{data.done.length}</span></p>
   <p className="row"><b>Pedidos cancelados</b><span>{data.canceled}</span></p>
   <p className="row"><b>Fiado em aberto do dia</b><span>{BRL(data.fiado)}</span></p>
   <hr/>
   <h3>Vendas por categoria</h3>
   {data.categoryRows.map(r=><p className="row" key={r.label}><b>{r.label}</b><span>{r.qtd} un • {BRL(r.valor)}</span></p>)}
   <hr/>
   <h3>Formas de pagamento</h3>
   {data.methodsRows.map(r=><p className="row" key={r.method}><b>{r.method}</b><span>{BRL(r.value)}</span></p>)}
   <hr/>
   <h3>Caixa em dinheiro</h3>
   <p className="row"><b>Abertura</b><span>{BRL(reportCashOpen)}</span></p>
   <p className="row"><b>Dinheiro recebido</b><span>{BRL(data.dinheiroRecebido)}</span></p>
   <p className="row"><b>Fechamento esperado</b><span>{BRL(data.dinheiroEsperado)}</span></p>
   <p className="row"><b>Fechamento informado</b><span>{BRL(reportCashClose)}</span></p>
   <p className="row"><b>Diferença</b><span className={data.diferenca===0?'ok':'warn'}>{BRL(data.diferenca)}</span></p>
   <hr/>
   <p className="row"><b>Total geral</b><b>{BRL(data.total)}</b></p>
   <div className="actions noPrint"><button className={open?'danger':'primary'} onClick={()=>setOpenStore(!open)}>{open?'Fechar loja':'Abrir loja'}</button><button onClick={printClose}>Imprimir fechamento</button></div>
  </section>
 </main>
}


function Cupons({coupons,saveCoupons}){
 const [form,setForm]=useState({code:'',percent:'10',active:true});
 const add=async()=>{
  const code=String(form.code||'').trim().toUpperCase();
  const percent=Number(form.percent)||0;
  if(!code || percent<=0) return alert('Preencha o nome do cupom e a porcentagem.');
  if(percent>100) return alert('A porcentagem máxima é 100%.');
  const temp={id:uid(),code,percent,active:form.active};
  if(supabase){ const {error}=await saveCouponRemote(temp); if(error){ alert('Erro ao salvar cupom no Supabase: '+error.message); return; } const remote=await fetchCoupons(); if(remote) saveCoupons(remote); }
  else saveCoupons([temp,...coupons]);
  setForm({code:'',percent:'10',active:true});
 };
 const toggle=async(c)=>{
  const changed={...c,active:!c.active};
  if(supabase){ const {error}=await saveCouponRemote(changed); if(error){ alert('Erro ao atualizar cupom: '+error.message); return; } const remote=await fetchCoupons(); if(remote) saveCoupons(remote); }
  else saveCoupons(coupons.map(x=>x.id===c.id?changed:x));
 };
 const remove=async(c)=>{
  if(!confirm('Remover este cupom?')) return;
  if(supabase){ const {error}=await deleteCouponRemote(c.id); if(error){ alert('Erro ao remover cupom: '+error.message); return; } const remote=await fetchCoupons(); if(remote) saveCoupons(remote); }
  else saveCoupons(coupons.filter(x=>x.id!==c.id));
 };
 return <main className="layout"><section className="panel"><h2>Criar cupom de desconto</h2><p className="muted">O cupom salvo aqui aparece no cardápio digital. O cliente digita o nome do cupom e o desconto entra no pedido sincronizado.</p><div className="formgrid"><input placeholder="Nome do cupom. Ex.: VERBO10" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})}/><input type="number" placeholder="Porcentagem" value={form.percent} onChange={e=>setForm({...form,percent:e.target.value})}/><label className="check"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Ativo</label><button className="primary" onClick={add}>Salvar cupom</button></div></section><section className="panel"><h2>Cupons cadastrados</h2>{coupons.length===0&&<p className="muted">Nenhum cupom cadastrado ainda.</p>}{coupons.map(c=><p className="row" key={c.id}><span><b>{c.code || c.name}</b> • {Number(c.percent)||0}%</span><b>{c.active?'Ativo':'Inativo'}</b><button className="ghost" onClick={()=>toggle(c)}>{c.active?'Desativar':'Ativar'}</button><button className="ghost dangerText" onClick={()=>remove(c)}>remover</button></p>)}</section></main>
}

function Cardapio({products,saveProducts,adds,saveAdds}){
 const blank={cat:'Burgers',name:'',description:'',price:'',active:true};
 const [p,setP]=useState(blank);
 const [a,setA]=useState({name:'',price:''});
 const cats=[...new Set(products.map(p=>p.cat))];
 const persist=async(next)=>{
   saveProducts(next);
   if(!supabase){ alert('Produto salvo apenas neste navegador. Configure as variáveis do Supabase na Vercel para sincronizar com o cardápio digital.'); return false; }
   for(const [idx,item] of next.entries()){
     const {error}=await saveProductRemote(item,idx);
     if(error){ alert('Erro ao salvar produto no Supabase: '+error.message); return false; }
   }
   return true;
 };
 const addProd=async()=>{ if(!p.name||!p.price) return alert('Preencha nome e preço.'); const item={...p,id:slugify(p.name)+'-'+Date.now(),price:Number(p.price),active:p.active!==false,sort_order:products.length}; const next=[...products,item]; const ok=await persist(next); if(ok){ const remote=await fetchMenuItems(); if(remote?.length) saveProducts(remote); } setP(blank); };
 const updateProd=async(id,patch)=>{ const next=products.map((x,idx)=>x.id===id?{...x,...patch,price:patch.price!==undefined?Number(patch.price):x.price,sort_order:idx}:x); saveProducts(next); if(supabase){ const item=next.find(x=>x.id===id); const {error}=await saveProductRemote(item,next.indexOf(item)); if(error) alert('Erro ao salvar no Supabase: '+error.message); } };
 const del=async(id)=>{ if(!confirm('Remover item?')) return; const next=products.filter(p=>p.id!==id); saveProducts(next); if(supabase){ const {error}=await deleteProductRemote(id); if(error) alert('Erro ao remover no Supabase: '+error.message); } };
 const addAdd=()=>{ if(!a.name||!a.price) return alert('Preencha adicional e valor.'); saveAdds([...adds,{id:uid(),name:a.name,price:Number(a.price)}]); setA({name:'',price:''}); };
 return <main className="menuEditor"><section className="panel menuCreate"><h2>Cadastrar produto</h2><p className="muted">Tudo que você salvar aqui vai para o Supabase e aparece no cardápio digital sem subir código de novo.</p>{!supabase&&<p className="warn"><b>Atenção:</b> Supabase não configurado neste painel. O produto só vai ficar local e não aparecerá no cardápio online.</p>}<div className="formgrid menuForm"><label>Categoria<input placeholder="Categoria" list="cats" value={p.cat} onChange={e=>setP({...p,cat:e.target.value})}/></label><datalist id="cats">{cats.map(c=><option key={c}>{c}</option>)}</datalist><label>Nome<input placeholder="Nome do produto" value={p.name} onChange={e=>setP({...p,name:e.target.value})}/></label><label className="wideField">Descrição<textarea placeholder="Descrição do produto" value={p.description} onChange={e=>setP({...p,description:e.target.value})}/></label><label>Preço<input type="number" placeholder="Preço" value={p.price} onChange={e=>setP({...p,price:e.target.value})}/></label><label className="check"><input type="checkbox" checked={p.active} onChange={e=>setP({...p,active:e.target.checked})}/> Ativo</label><button className="primary" onClick={addProd}>Adicionar ao cardápio</button></div><h2>Adicionais</h2><div className="formgrid addonsForm"><input placeholder="Nome do adicional" value={a.name} onChange={e=>setA({...a,name:e.target.value})}/><input type="number" placeholder="Preço" value={a.price} onChange={e=>setA({...a,price:e.target.value})}/><button onClick={addAdd}>Adicionar adicional</button></div><div className="chips">{adds.map(x=><button className="chip" key={x.id}>{x.name} • {BRL(x.price)}</button>)}</div></section><section className="panel menuList"><div className="sectionHead"><div><h2>Cardápio atual</h2><p className="muted">Edite nome, descrição, preço e status com mais espaço.</p></div></div>{cats.map(c=><div className="categoryBlock" key={c}><h3><CategoryBadge cat={c}/>{c}</h3><div className="productTable">{products.filter(p=>p.cat===c).map(p=><div className="productEdit" key={p.id}><div className="peMain"><label>Produto<input value={p.name} onChange={e=>updateProd(p.id,{name:e.target.value})}/></label><label className="descField">Descrição<textarea value={p.description||''} placeholder="Descrição" onChange={e=>updateProd(p.id,{description:e.target.value})}/></label></div><div className="peSide"><label>Preço<input type="number" value={p.price} onChange={e=>updateProd(p.id,{price:e.target.value})}/></label><label className="check switch"><input type="checkbox" checked={p.active!==false} onChange={e=>updateProd(p.id,{active:e.target.checked})}/><span>Ativo</span></label><button className="ghost dangerText" onClick={()=>del(p.id)}>Remover</button></div></div>)}</div></div>)}</section></main>
}


function Recibo({receiptSettings,setReceiptSettings,deliveryWhatsApp,setDeliveryWhatsApp,saveStoreConfig}){
 const [form,setForm]=useState({...defaultReceiptSettings,...receiptSettings});
 const save=async()=>{
  const clean={
   name:String(form.name||'Verbo Hub').trim(),
   document:String(form.document||'').trim(),
   phone:String(form.phone||'').trim(),
   address:String(form.address||'').trim(),
   footer:String(form.footer||defaultReceiptSettings.footer).trim()
  };
  if(supabase){
    const {data,error}=await saveReceiptSettingsRemote(clean);
    if(error){ alert('Erro ao salvar dados do recibo no Supabase: '+error.message); return; }
    const merged={...defaultReceiptSettings,...(data||clean)};
    setReceiptSettings(merged); store.set('vh_receipt_settings',merged);
  } else {
    setReceiptSettings(clean); store.set('vh_receipt_settings',clean);
  }
  alert('Dados do recibo salvos. Eles aparecerão na impressão dos pedidos e fechamentos.');
 };
 const preview=`<div class="receipt80">${receiptHeader(form,'Pedido #000 • Prévia')}<div class="r-line"></div><div class="r-item"><div class="r-row"><span class="r-item-title"><span class="r-qty">2x</span> X-Burger</span><b>${BRL(43.80)}</b></div><div class="r-add">Obs item: exemplo de pedido duplicado</div></div><div class="r-total">TOTAL ${BRL(43.80)}</div><div class="r-footer">${safeText(form.footer||defaultReceiptSettings.footer)}</div></div>`;
 return <main className="layout"><section className="panel"><h2>Configurações da loja</h2><p className="muted">Altere aqui o WhatsApp que o cardápio usa automaticamente nos pedidos de entrega.</p><div className="formgrid"><input placeholder="WhatsApp de entrega. Ex: 67993248754" value={deliveryWhatsApp} onChange={e=>setDeliveryWhatsApp(e.target.value)}/><button className="primary" onClick={saveStoreConfig}>Salvar WhatsApp da entrega</button></div><hr/><h2>Dados para impressão do recibo</h2><p className="muted">Preencha os dados da tapiocaria. Eles aparecem no recibo de pedido e no fechamento para clientes que precisam prestar contas.</p><div className="formgrid"><input placeholder="Nome do estabelecimento" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input placeholder="CNPJ ou CPF" value={form.document} onChange={e=>setForm({...form,document:e.target.value})}/><input placeholder="Telefone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Endereço opcional" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/><input placeholder="Mensagem de rodapé" value={form.footer} onChange={e=>setForm({...form,footer:e.target.value})}/><button className="primary" onClick={save}>Salvar dados do recibo</button></div>{!supabase&&<p className="warn"><b>Atenção:</b> Supabase não configurado. Os dados serão salvos só neste navegador.</p>}</section><section className="panel"><h2>Prévia 80mm</h2><div className="receiptPreview" dangerouslySetInnerHTML={{__html:preview}}/><button onClick={()=>openPrint(preview,'order')}>Imprimir prévia de pedido</button></section></main>
}

createRoot(document.getElementById('root')).render(<App/>);
