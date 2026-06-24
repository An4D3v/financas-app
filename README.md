# 💸 finanças

Dashboard de finanças pessoais (web + mobile) para controlar entradas, gastos e saldo — com o diferencial de **lançar um gasto só tirando foto da nota fiscal** (extração automática por IA). Projeto pessoal, 100% gratuito, criado pra resolver uma dor própria: um controle de gastos simples, bonito e que se atualiza sozinho.

🔗 **Acesse:** https://financas-app-ruby.vercel.app

## ✨ Funcionalidades

- 📷 **Scan de nota fiscal por foto** — a IA lê itens, valores, data e sugere categorias; você revisa e confirma antes de salvar
- ✍️ Lançamento manual + **edição inline** (clica no nome, categoria, valor, data ou tipo e altera na hora)
- 🏷️ Categorias coloridas, filtros por **período** (dia/semana/mês) e **calendário** de intervalo personalizado
- 📊 **Resumo com insights**: taxa de poupança, maior categoria, média diária e comparação com o período anterior
- 🥧 Gráfico de gastos por categoria
- 🌗 Tema **claro / escuro / sistema** + perfil (profissão e hobbies)
- ⬇️ **Exportar** os lançamentos em CSV
- 🔐 Login com dados **isolados por usuário** (Row Level Security)

## 🛠️ Stack

- **Front:** React + TypeScript + Vite, Recharts
- **Back:** Supabase (Postgres, Auth, Row Level Security, Edge Functions em Deno)
- **IA:** Google Gemini (visão) rodando server-side numa Edge Function
- **Deploy:** Vercel (CI automático — `push` na `main` publica sozinho)

## 📸 Screenshots

> _(adicione aqui alguns prints do app — login, dashboard, scan da nota e o tema claro/escuro)_

## 🚀 Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com a URL e a chave anon do seu projeto Supabase
npm run dev            # http://localhost:5173
```

A leitura de nota usa uma Edge Function (`supabase/functions/scan-receipt`) que chama o Gemini; a chave fica num secret do Supabase, nunca no front.

## 🗄️ Banco de dados

Tabelas `categories`, `transactions`, `receipts` e `profiles`, todas com **RLS**: cada conta só enxerga os próprios dados. As categorias padrão são criadas automaticamente no cadastro, via trigger no Postgres.

---

feito com ☕ + código por **Ana** 💚
