# 🚀 Salão Bella — Guia de Instalação Completo

## O que você vai precisar
- Conta no **Supabase** (banco de dados gratuito)
- Conta no **Vercel** (hospedagem gratuita)
- Conta no **GitHub** (para conectar Vercel ao projeto)

Tempo estimado: **20-30 minutos**

---

## PASSO 1 — Criar conta no Supabase

1. Acesse **https://supabase.com**
2. Clique em **Start your project**
3. Crie conta com Google ou GitHub
4. Clique em **New Project**
5. Preencha:
   - **Name:** `salao-bella`
   - **Database Password:** crie uma senha forte e guarde
   - **Region:** `South America (São Paulo)`
6. Clique em **Create new project**
7. Aguarde ~2 minutos enquanto o projeto é criado

---

## PASSO 2 — Criar as tabelas no banco

1. No seu projeto Supabase, clique em **SQL Editor** (menu lateral)
2. Clique em **New Query**
3. Abra o arquivo **`supabase-schema.sql`** que está neste zip
4. Copie todo o conteúdo e cole no editor do Supabase
5. Clique em **Run** (botão verde)
6. Deve aparecer "Success" — as tabelas foram criadas!

---

## PASSO 3 — Pegar as chaves de acesso

1. No menu lateral do Supabase, clique em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Você vai ver dois valores — guarde os dois:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** (em Project API Keys) → texto longo começando com `eyJ...`

---

## PASSO 4 — Subir o projeto no GitHub

1. Acesse **https://github.com** e crie uma conta (se não tiver)
2. Clique em **+** → **New repository**
3. Nome: `salao-bella` | Deixe **Private** | Clique em **Create repository**
4. Na próxima tela clique em **uploading an existing file**
5. Extraia o conteúdo deste zip no seu computador
6. Arraste a pasta **`salao-bella-site`** inteira para o GitHub
7. Clique em **Commit changes**

---

## PASSO 5 — Publicar no Vercel

1. Acesse **https://vercel.com**
2. Crie conta com o mesmo GitHub
3. Clique em **Add New Project**
4. Selecione o repositório `salao-bella`
5. Configure:
   - **Root Directory:** clique em Edit → digite `salao-bella-site`
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `dist/public`
6. Antes de clicar em Deploy, clique em **Environment Variables** e adicione:

   | Nome | Valor |
   |------|-------|
   | `VITE_SUPABASE_URL` | sua URL do Supabase (passo 3) |
   | `VITE_SUPABASE_ANON_KEY` | sua chave anon do Supabase (passo 3) |

7. Clique em **Deploy**
8. Aguarde ~2 minutos

---

## PASSO 6 — Acessar o app! 🎉

O Vercel vai gerar um link tipo:
`https://salao-bella-xxx.vercel.app`

Esse link funciona em **qualquer celular ou computador** ao mesmo tempo!

### Instalar no celular como app:

**iPhone (Safari):**
1. Abra o link no Safari
2. Toque em **Compartilhar** ↑
3. Role e toque em **"Adicionar à Tela de Início"**
4. Toque em **Adicionar**

**Android (Chrome):**
1. Abra o link no Chrome
2. Toque em **⋮** (três pontos)
3. Toque em **"Adicionar à tela inicial"**

---

## ❓ Dúvidas frequentes

**O app está em branco / mostrando erro de conexão?**
→ Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` foram adicionadas corretamente no Vercel

**Esqueci de rodar o SQL das tabelas?**
→ Volte ao Supabase → SQL Editor → cole o conteúdo de `supabase-schema.sql` e clique em Run

**Quero usar no computador localmente?**
1. Copie `.env.example` e renomeie para `.env`
2. Preencha com suas chaves do Supabase
3. Execute: `pnpm install && pnpm dev`
4. Acesse `http://localhost:3000`

---

Qualquer dúvida, é só perguntar! 💪
