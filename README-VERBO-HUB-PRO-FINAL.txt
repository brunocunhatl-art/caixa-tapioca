# VERBO HUB PRO FINAL

Versão final agregada usando como base o cardápio v9 e o painel v6 que já funcionavam.

## Mantido
- Cardápio premium Verbo Hub
- Logo e identidade visual
- Supabase realtime
- Impressão 80mm
- Pedido balcão no painel
- Financeiro, fiado, desconto, extra e pagamentos divididos
- Som/campainha de pedido
- Cardápio oficial com cuscuz premium fechado

## Adicionado
- Controle loja aberta/fechada sincronizado no Supabase
- Cardápio bloqueia finalização quando a loja está fechada
- Tela cozinha separada
- Dashboard no painel
- Upsell inteligente no checkout: doce/milkshake/refrigerante
- Mensagem e tempo estimado da loja

## Deploy
Suba cada pasta em seu projeto correspondente no GitHub/Vercel.

Variáveis nas duas Vercels:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

Rode o supabase.sql uma vez se ainda não rodou esta versão.
Ele usa IF NOT EXISTS e não apaga pedidos.
