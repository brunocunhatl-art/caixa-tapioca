# Verbo Hub V6 - Supabase Online

Versão com sincronização entre celular, tablet e computador usando Supabase.

## Antes de publicar

No Supabase:

1. Abra o projeto.
2. Vá em SQL Editor.
3. Cole o conteúdo do arquivo `supabase.sql`.
4. Clique em Run.

Na Vercel, adicione as variáveis:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Depois faça Redeploy.

## O que sincroniza

- Pedidos
- Produtos e categorias
- Adicionais
- Abertura/fechamento da loja
- Valores de caixa
- Financeiro do dia

Se o Supabase não estiver configurado, o sistema continua funcionando localmente no navegador.
