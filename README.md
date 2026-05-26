# Verbo Hub Painel/Caixa com Supabase

Esta versão continua funcionando como painel de controle/balcão e agora lê/grava pedidos na tabela `orders` do Supabase.

## Como sincronizar com o cardápio digital

Use o mesmo projeto Supabase do cardápio digital e configure na Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Depois faça Redeploy.

## Deploy na Vercel

- Framework: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

## Observação

Se as variáveis do Supabase não forem configuradas, o sistema continua em modo local usando o navegador.
