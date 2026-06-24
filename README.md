# 💸 Financas

Dashboard de financas pessoais (web + mobile) para controlar entradas, gastos e saldo do mes. Projeto pessoal, construido para resolver uma dor propria: um controle de gastos simples, bonito e que se atualiza sozinho.

Em breve: lancar um gasto so tirando **foto da nota fiscal** (extracao automatica por IA de visao + leitura do QR Code da NFC-e).

## Stack

- **React + TypeScript + Vite**
- **Supabase** (Postgres + Auth + Row Level Security)
- **Recharts** (graficos)
- Tema dark, responsivo (pronto para virar PWA)

## Como rodar

```bash
npm install
cp .env.example .env   # preencha com a URL e a chave anon do seu projeto Supabase
npm run dev            # http://localhost:5173
```

## Banco de dados

Tabelas `categories`, `transactions` e `receipts`, todas com **RLS**: cada usuario so enxerga os proprios dados. As categorias padrao sao criadas automaticamente no cadastro, via trigger no Postgres.

## Roadmap

- [x] **v1** - dashboard com lancamento manual, KPIs do mes e grafico por categoria
- [ ] **v2** - foto da nota fiscal -> extracao automatica (IA de visao)
- [ ] **v3** - leitura do QR Code da NFC-e (dados estruturados da SEFAZ)
