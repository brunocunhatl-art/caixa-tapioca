import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createRoot } from 'react-dom/client';
import './style.css';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
      row.change_for ? `Troco para: ${row.change_for}` : ''
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
  const {data,error}=await supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(200);
  if(error){ console.error(error); return null; }
  return (data||[]).map(orderFromSupabase);
}



function receiptStyle(){return `<style>
@page{size:80mm auto;margin:0}
*{box-sizing:border-box}body{margin:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;font-size:12px}.receipt80{width:80mm;max-width:80mm;padding:4mm 4mm 7mm;margin:0 auto}.r-center{text-align:center}.r-logo{width:18mm;height:18mm;border-radius:50%;object-fit:cover;margin:0 auto 2mm;display:block}.r-title{font-size:20px;font-weight:900;letter-spacing:.8px;text-transform:uppercase}.r-sub{font-size:11px;margin-top:1mm}.r-line{border-top:1px dashed #000;margin:3mm 0}.r-row{display:flex;justify-content:space-between;gap:3mm;align-items:flex-start}.r-row span:first-child{max-width:47mm}.r-bold{font-weight:900}.r-total{font-size:18px;font-weight:900;text-align:center;border:2px solid #000;border-radius:3mm;padding:2mm;margin-top:3mm}.r-item{margin:2.5mm 0}.r-item-title{font-size:14px;font-weight:900}.r-add{padding-left:3mm;font-size:11px;line-height:1.35}.r-muted{font-size:11px}.r-footer{font-size:10px;text-align:center;margin-top:4mm}.no-print{display:none!important}@media print{html,body{width:80mm}.receipt80{width:80mm}}</style>`}
function openPrint(html){const w=window.open('','_blank','width=420,height=700');w.document.write(`<!doctype html><html><head><title>Impressão Verbo Hub</title>${receiptStyle()}</head><body>${html}<script>window.onload=()=>{setTimeout(()=>window.print(),200)}<\/script></body></html>`);w.document.close();}
function moneyLine(label,value){return `<div class="r-row"><span>${label}</span><b>${BRL(value)}</b></div>`}
function orderReceipt(o,total){return `<div class="receipt80"><div class="r-center"><img class="r-logo" src="/logo-verbohub.jpeg"/><div class="r-title">VERBO HUB</div><div class="r-sub">Pedido #${o.num} • ${today()}</div></div><div class="r-line"></div><div class="r-row"><b>Cliente</b><span>${o.customer}</span></div><div class="r-row"><b>Status</b><span>${o.status}</span></div><div class="r-line"></div>${(o.items||[]).map(i=>`<div class="r-item"><div class="r-row"><span class="r-item-title">1x ${i.product.name}</span><b>${BRL(calcItem(i))}</b></div>${(i.adds||[]).length?`<div class="r-add">${i.adds.map(a=>`+ ${a.name}`).join('<br/>')}</div>`:''}${i.obs?`<div class="r-add">Obs item: ${i.obs}</div>`:''}</div>`).join('')}${o.obs?`<div class="r-line"></div><div class="r-bold">OBSERVAÇÃO</div><div>${o.obs}</div>`:''}<div class="r-line"></div>${moneyLine('Desconto',Number(o.discount)||0)}${moneyLine('Valor extra',Number(o.extra)||0)}${(o.payments||[]).map(p=>moneyLine(p.method,Number(p.value)||0)).join('')}<div class="r-total">TOTAL ${BRL(total)}</div><div class="r-footer">Obrigado pela preferência!</div></div>`}
function financeReceipt({categoryRows,methodsRows,cashOpen,dinheiroRecebido,dinheiroEsperado,cashClose,diferenca,total,canceled,fiado,done}){return `<div class="receipt80"><div class="r-center"><img class="r-logo" src="/logo-verbohub.jpeg"/><div class="r-title">VERBO HUB</div><div class="r-sub">FECHAMENTO DO DIA • ${today()}</div></div><div class="r-line"></div><div class="r-row"><b>Pedidos concluídos</b><span>${done.length}</span></div><div class="r-row"><b>Pedidos cancelados</b><span>${canceled}</span></div>${moneyLine('Fiado em aberto',fiado)}<div class="r-line"></div><div class="r-bold">VENDAS POR CATEGORIA</div>${categoryRows.map(r=>`<div class="r-row"><span>${r.label}</span><b>${r.qtd} un • ${BRL(r.valor)}</b></div>`).join('')}<div class="r-line"></div><div class="r-bold">FORMAS DE PAGAMENTO</div>${methodsRows.map(r=>moneyLine(r.method,r.value)).join('')}<div class="r-line"></div><div class="r-bold">CAIXA EM DINHEIRO</div>${moneyLine('Abertura',cashOpen)}${moneyLine('Dinheiro recebido',dinheiroRecebido)}${moneyLine('Fechamento esperado',dinheiroEsperado)}${moneyLine('Fechamento informado',cashClose)}${moneyLine('Diferença',diferenca)}<div class="r-total">TOTAL DO DIA ${BRL(total)}</div><div class="r-footer">Relatório gerado pelo sistema Verbo Hub</div></div>`}

function calcItem(item){
  const qty = Number(item.qty)||1;
  const base = Number(item.product.price)||0;
  const adds = item.adds || [];
  const isCuscuzBase = item.product.name.toLowerCase().includes('cuscuz base');
  const isCuscuzPremium = item.product.name.toLowerCase().includes('cuscuz premium');
  const unit = isCuscuzBase ? base + adds.slice(4).reduce((s,a)=>s+Number(a.price),0) : base + adds.reduce((s,a)=>s+Number(a.price),0);
  return unit * qty;
}
function calcOrder(o){return Math.max(0,(o.items||[]).reduce((s,i)=>s+calcItem(i),0)+(Number(o.extra)||0)-(Number(o.discount)||0));}

function App(){
 const [tab,setTab]=useState('novo');
 const [products,setProducts]=useState(()=>store.get('vh_products_v3',seedProducts));
 const [adds,setAdds]=useState(()=>store.get('vh_adds_v3',seedAdds));
 const [orders,setOrders]=useState(()=>store.get('vh_orders_v3',[]));
 const [syncStatus,setSyncStatus]=useState(supabase?'Conectando ao Supabase...':'Modo local: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para sincronizar.');
 const beepRef=useRef(null);
 const [open,setOpen]=useState(()=>store.get('vh_store_open',false));
 const [cashOpen,setCashOpen]=useState(()=>store.get('vh_cash_open',0));
 const [cashClose,setCashClose]=useState(()=>store.get('vh_cash_close',0));
 const [cart,setCart]=useState([]); const [customer,setCustomer]=useState(''); const [obs,setObs]=useState('');
 const cats=useMemo(()=>[...new Set(products.map(p=>p.cat))], [products]);
 const saveOrders=v=>{setOrders(v);store.set('vh_orders_v3',v)};
 const refreshOrders=async()=>{ const remote=await fetchSupabaseOrders(); if(remote){ saveOrders(remote); setSyncStatus('Sincronizado com Supabase'); } };
 useEffect(()=>{ refreshOrders(); if(!supabase) return; const ch=supabase.channel('orders-painel-verbohub').on('postgres_changes',{event:'*',schema:'public',table:'orders'}, payload=>{ refreshOrders(); if(payload.eventType==='INSERT'){ try{beepRef.current?.play()}catch(e){} } }).subscribe(); return()=>supabase.removeChannel(ch); },[]);
 const saveProducts=v=>{setProducts(v);store.set('vh_products_v3',v)};
 const saveAdds=v=>{setAdds(v);store.set('vh_adds_v3',v)};
 const setOpenStore=v=>{
   if(v){ const val=prompt('Com quanto em dinheiro está abrindo a loja?','0'); if(val===null) return; setCashOpen(Number(String(val).replace(',','.'))||0); store.set('vh_cash_open',Number(String(val).replace(',','.'))||0); setCashClose(0); store.set('vh_cash_close',0); }
   else { const val=prompt('Quanto tem em dinheiro no caixa ao fechar?','0'); if(val===null) return; setCashClose(Number(String(val).replace(',','.'))||0); store.set('vh_cash_close',Number(String(val).replace(',','.'))||0); }
   setOpen(v);store.set('vh_store_open',v)
 };
 const addProduct=p=>setCart([...cart,{uid:uid(),product:p,adds:[],obs:''}]);
 const toggleAdd=(id,a)=>setCart(cart.map(i=>i.uid===id?{...i,adds:i.adds.find(x=>x.id===a.id)?i.adds.filter(x=>x.id!==a.id):[...i.adds,a]}:i));
 const subtotal=cart.reduce((s,i)=>s+calcItem(i),0);
 const createOrder=async()=>{ 
   if(!cart.length) return alert('Adicione produtos ao pedido.'); 
   const o={id:uid(),num:orders.length+1,date:new Date().toISOString(),customer:customer||'Cliente balcão',items:cart,obs,status:'aberto',discount:0,extra:0,payments:[],fiado:false}; 
   if(supabase){
     const {error}=await supabase.from('orders').insert(orderToSupabase(o));
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
     const {error}=await supabase.from('orders').update(payload).eq('id',id);
     if(error) alert('Erro ao atualizar no Supabase: '+error.message);
   }
 };
 const cancel=id=>confirm('Cancelar este pedido?')&&update(id,{status:'cancelado'});
 const day=orders.filter(o=>new Date(o.date).toLocaleDateString('pt-BR')===today());
 const done=day.filter(o=>o.status==='concluido');
 return <div className="app">
  <audio ref={beepRef} src="/pedido.wav" preload="auto"></audio><header className="top"><img src="/logo-verbohub.jpeg"/><div><h1>Verbo Hub</h1><p>{open?'🟢 Loja aberta':'🔴 Loja fechada'} • {today()} • {syncStatus}</p></div><button className={open?'danger':'primary'} onClick={()=>setOpenStore(!open)}>{open?'Fechar loja':'Abrir loja'}</button></header>
  <nav>{[['novo','Novo pedido'],['pedidos','Pedidos'],['financeiro','Financeiro'],['cardapio','Cardápio']].map(t=><button key={t[0]} className={tab===t[0]?'on':''} onClick={()=>setTab(t[0])}>{t[1]}</button>)}</nav>
  {tab==='novo'&&<main className="layout"><section className="panel"><h2>Novo pedido</h2><div className="formline"><input placeholder="Nome do cliente / mesa" value={customer} onChange={e=>setCustomer(e.target.value)}/><textarea placeholder="Observação geral" value={obs} onChange={e=>setObs(e.target.value)}/></div><div className="catalog">{cats.map(c=><div className="cat" key={c}><h3>{c}</h3>{products.filter(p=>p.cat===c&&p.active).map(p=><button className="product" key={p.id} onClick={()=>addProduct(p)}><span>{p.name}</span><b>{BRL(p.price)}</b></button>)}</div>)}</div></section><section className="panel ticket"><h2>Pedido atual</h2>{cart.length===0&&<p className="muted">Escolha os produtos do cardápio.</p>}{cart.map(i=><div className="cartitem" key={i.uid}><div className="row"><b>{i.product.name}</b><button className="ghost dangerText" onClick={()=>setCart(cart.filter(x=>x.uid!==i.uid))}>remover</button></div>{i.product.name.toLowerCase().includes('cuscuz base')&&<small>{Math.min(i.adds.length,4)}/4 adicionais grátis • depois cobra automático</small>}{i.product.name.toLowerCase().includes('cuscuz premium')&&<small>Premium: todos os adicionais são cobrados</small>}<div className="chips">{adds.map(a=><button key={a.id} className={i.adds.find(x=>x.id===a.id)?'chip on':'chip'} onClick={()=>toggleAdd(i.uid,a)}>{a.name} {i.product.name.toLowerCase().includes('cuscuz base')?'':`+ ${BRL(a.price)}`}</button>)}</div><b className="totalitem">{BRL(calcItem(i))}</b></div>)}<h2>Total: {BRL(subtotal)}</h2><button className="primary big" onClick={createOrder}>Salvar como pedido aberto</button></section></main>}
  {tab==='pedidos'&&<main className="orders">{orders.length===0&&<section className="panel"><h2>Nenhum pedido ainda</h2></section>}{orders.map(o=><Order key={o.id} o={o} update={update} cancel={cancel}/>)}</main>}
  {tab==='financeiro'&&<Financeiro day={day} done={done} orders={orders} open={open} setOpenStore={setOpenStore} cashOpen={cashOpen} cashClose={cashClose} setCashOpen={v=>{setCashOpen(v);store.set('vh_cash_open',v)}} setCashClose={v=>{setCashClose(v);store.set('vh_cash_close',v)}}/>} 
  {tab==='cardapio'&&<Cardapio products={products} saveProducts={saveProducts} adds={adds} saveAdds={saveAdds}/>} 
 </div>;
}

function Order({o,update,cancel}){const[discount,setDiscount]=useState(o.discount||0),[extra,setExtra]=useState(o.extra||0),[pays,setPays]=useState(o.payments?.length?o.payments:[{method:'Pix',value:''}]); const total=calcOrder({...o,discount,extra,payments:pays}); const paid=pays.reduce((s,p)=>s+Number(p.value||0),0); const save=patch=>update(o.id,{discount:Number(discount)||0,extra:Number(extra)||0,payments:pays,...patch}); return <section className={'panel order '+o.status}><div className="row"><h2>#{o.num} • {o.customer}</h2><span className="badge">{o.status}</span></div>{o.items.map((i,k)=><p key={k}><b>{i.qty||1}x {i.product.name}</b>{i.adds.length?` + ${i.adds.map(a=>a.name).join(', ')}`:''}{i.obs?` • ${i.obs}`:''} — {BRL(calcItem(i))}</p>)}{o.obs&&<p className="muted">Obs: {o.obs}</p>}<div className="checkout"><label>Desconto R$<input type="number" value={discount} onChange={e=>setDiscount(e.target.value)}/></label><label>Valor extra R$<input type="number" value={extra} onChange={e=>setExtra(e.target.value)}/></label><label className="check"><input type="checkbox" checked={o.fiado} onChange={e=>update(o.id,{fiado:e.target.checked})}/> Fiado</label></div><h2>Total: {BRL(total)}</h2><h3>Pagamento dividido</h3>{pays.map((p,idx)=><div className="pay" key={idx}><select value={p.method} onChange={e=>setPays(pays.map((x,i)=>i===idx?{...x,method:e.target.value}:x))}><option>Pix</option><option>Débito</option><option>Crédito</option><option>Dinheiro</option></select><input type="number" placeholder="valor" value={p.value} onChange={e=>setPays(pays.map((x,i)=>i===idx?{...x,value:e.target.value}:x))}/></div>)}<button className="ghost" onClick={()=>setPays([...pays,{method:'Pix',value:''}])}>+ forma de pagamento</button><p className={paid>=total?'ok':'warn'}>Pago: {BRL(paid)} • Falta: {BRL(Math.max(0,total-paid))}</p><div className="actions"><button onClick={()=>save({status:'aberto'})}>Aberto</button><button onClick={()=>save({status:'aguardando pagamento'})}>Aguardando</button><button className="primary" onClick={()=>save({status:'concluido'})}>Concluir</button><button onClick={()=>openPrint(orderReceipt({...o,discount:Number(discount)||0,extra:Number(extra)||0,payments:pays}, total))}>Imprimir pedido 80mm</button><button className="danger" onClick={()=>cancel(o.id)}>Cancelar</button></div></section>}

function Financeiro({day,done,orders,open,setOpenStore,cashOpen,cashClose,setCashOpen,setCashClose}){
 const total=done.reduce((sum,o)=>sum+calcOrder(o),0);
 const canceled=day.filter(o=>o.status==='cancelado').length;
 const fiado=orders.filter(o=>o.fiado&&o.status!=='concluido').reduce((sum,o)=>sum+calcOrder(o),0);
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
    if(list.includes(i.product.cat)){qtd+=1; valor+=calcItem(i)}
  }));
  return {label,qtd,valor};
 });
 const methodsRows=methods.map(method=>({method,value:done.flatMap(o=>o.payments||[]).filter(p=>p.method===method).reduce((sum,p)=>sum+Number(p.value||0),0)}));
 const dinheiroRecebido=methodsRows.find(x=>x.method==='Dinheiro')?.value||0;
 const dinheiroEsperado=(Number(cashOpen)||0)+dinheiroRecebido;
 const diferenca=(Number(cashClose)||0)-dinheiroEsperado;
 const printClose=()=>openPrint(financeReceipt({categoryRows,methodsRows,cashOpen,dinheiroRecebido,dinheiroEsperado,cashClose,diferenca,total,canceled,fiado,done}));
 return <main className="finance">
  <section className="card"><p>Total vendido hoje</p><h2>{BRL(total)}</h2></section>
  <section className="card"><p>Concluídos</p><h2>{done.length}</h2></section>
  <section className="card"><p>Cancelados</p><h2>{canceled}</h2></section>
  <section className="card"><p>Fiado em aberto</p><h2>{BRL(fiado)}</h2></section>
  <section className="panel wide printArea">
   <h2>Fechamento do dia • {today()}</h2>
   <div className="cashbox noPrint">
    <label>Dinheiro na abertura<input type="number" value={cashOpen} onChange={e=>setCashOpen(Number(e.target.value)||0)}/></label>
    <label>Dinheiro no fechamento<input type="number" value={cashClose} onChange={e=>setCashClose(Number(e.target.value)||0)}/></label>
   </div>
   <h3>Vendas por categoria</h3>
   {categoryRows.map(r=><p className="row" key={r.label}><b>{r.label}</b><span>{r.qtd} un • {BRL(r.valor)}</span></p>)}
   <hr/>
   <h3>Formas de pagamento</h3>
   {methods.map(m=><p className="row" key={m}><b>{m}</b><span>{BRL(done.flatMap(o=>o.payments||[]).filter(p=>p.method===m).reduce((sum,p)=>sum+Number(p.value||0),0))}</span></p>)}
   <hr/>
   <h3>Caixa em dinheiro</h3>
   <p className="row"><b>Abertura</b><span>{BRL(cashOpen)}</span></p>
   <p className="row"><b>Dinheiro recebido</b><span>{BRL(dinheiroRecebido)}</span></p>
   <p className="row"><b>Fechamento esperado</b><span>{BRL(dinheiroEsperado)}</span></p>
   <p className="row"><b>Fechamento informado</b><span>{BRL(cashClose)}</span></p>
   <p className="row"><b>Diferença</b><span className={diferenca===0?'ok':'warn'}>{BRL(diferenca)}</span></p>
   <hr/>
   <p className="row"><b>Total geral</b><b>{BRL(total)}</b></p>
   <div className="actions noPrint"><button className={open?'danger':'primary'} onClick={()=>setOpenStore(!open)}>{open?'Fechar loja':'Abrir loja'}</button><button onClick={printClose}>Imprimir financeiro 80mm</button></div>
  </section>
 </main>
}

function Cardapio({products,saveProducts,adds,saveAdds}){const blank={cat:'Burgers',name:'',price:''}; const[p,setP]=useState(blank); const[a,setA]=useState({name:'',price:''}); const cats=[...new Set(products.map(p=>p.cat))]; const addProd=()=>{ if(!p.name||!p.price) return alert('Preencha nome e preço.'); saveProducts([...products,{...p,id:uid(),price:Number(p.price),active:true}]); setP(blank);}; const del=id=>confirm('Remover item?')&&saveProducts(products.filter(p=>p.id!==id)); const addAdd=()=>{ if(!a.name||!a.price) return alert('Preencha adicional e valor.'); saveAdds([...adds,{id:uid(),name:a.name,price:Number(a.price)}]); setA({name:'',price:''});}; return <main className="layout"><section className="panel"><h2>Cadastrar produto</h2><div className="formgrid"><input placeholder="Categoria" list="cats" value={p.cat} onChange={e=>setP({...p,cat:e.target.value})}/><datalist id="cats">{cats.map(c=><option key={c}>{c}</option>)}</datalist><input placeholder="Nome do produto" value={p.name} onChange={e=>setP({...p,name:e.target.value})}/><input type="number" placeholder="Preço" value={p.price} onChange={e=>setP({...p,price:e.target.value})}/><button className="primary" onClick={addProd}>Adicionar ao cardápio</button></div><h2>Adicionais</h2><div className="formgrid"><input placeholder="Nome do adicional" value={a.name} onChange={e=>setA({...a,name:e.target.value})}/><input type="number" placeholder="Preço" value={a.price} onChange={e=>setA({...a,price:e.target.value})}/><button onClick={addAdd}>Adicionar adicional</button></div><div className="chips">{adds.map(x=><button className="chip" key={x.id}>{x.name} • {BRL(x.price)}</button>)}</div></section><section className="panel"><h2>Cardápio atual</h2>{cats.map(c=><div key={c}><h3>{c}</h3>{products.filter(p=>p.cat===c).map(p=><p className="row" key={p.id}><span>{p.name}</span><b>{BRL(p.price)}</b><button className="ghost dangerText" onClick={()=>del(p.id)}>remover</button></p>)}</div>)}</section></main>}

createRoot(document.getElementById('root')).render(<App/>);
