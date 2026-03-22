# 🗄️ Integração Supabase - Guia de Configuração

## Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com/)
2. Clique em **"New Project"**
3. Configure:
   - **Name**: `lexia-game`
   - **Password**: (gere uma senha forte)
   - **Region**: `São Paulo (sa-east-1)`
   - **Pricing Plan**: Free tier
4. Aguarde 2-3 minutos enquanto o banco é provisionado

---

## Passo 2: Criar Tabelas (SQL)

No painel do Supabase:

1. Vá em **SQL Editor** (menu esquerdo)
2. Crie uma nova query
3. Cole e execute o seguinte SQL:

```sql
-- Tabela para salvar o progresso de cada letra (Cérebro FSRS)
create table progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  letter text not null,
  stability float8 default 0,
  difficulty float8 default 0,
  elapsed_days int4 default 0,
  scheduled_days int4 default 0,
  reps int4 default 0,
  lapses int4 default 0,
  state int4 default 0,
  last_review timestamp with time zone default now(),
  unique(user_id, letter)
);

-- Habilitar RLS (Row Level Security)
alter table progress enable row level security;

-- Policy para usuário ver apenas seu próprio progresso
create policy "Users can view their own progress"
  on progress for select
  using (auth.uid() = user_id);

-- Policy para usuário inserir e atualizar seu próprio progresso
create policy "Users can update their own progress"
  on progress for all
  using (auth.uid() = user_id);
```

---

## Passo 3: Obter Credenciais

1. Vá em **Project Settings** (⚙️ engrenagem, canto inferior esquerdo)
2. Clique em **API**
3. Copie:
   - **Project URL** (Ex: `https://xyz.supabase.co`)
   - **anon public** (chave longa)

---

## Passo 4: Configurar Variáveis de Ambiente

### Para Desenvolvimento Local

1. Edite o arquivo `.env.local` na raiz do projeto:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

1. Reinicie o servidor (`npm run dev`)

### Para Deploy na Vercel

1. Acesse o painel da Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione:
   - **Name**: `VITE_SUPABASE_URL` → **Value**: (cole a URL)
   - **Name**: `VITE_SUPABASE_ANON_KEY` → **Value**: (cole a chave)
4. Faça deploy novamente

---

## Passo 5: Usar no Código

O cliente Supabase já está criado em `src/lib/supabase.ts`. Para usar em qualquer componente:

```typescript
import { supabase } from '../lib/supabase';

// Exemplo: Salvar progresso
const saveProgress = async (letter: string, grade: number) => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user?.id) {
    console.error('Usuário não autenticado');
    return;
  }

  const { error } = await supabase
    .from('progress')
    .upsert({
      user_id: user.user.id,
      letter,
      stability: grade * 0.25, // Exemplo simples
      last_review: new Date().toISOString(),
    });

  if (error) console.error('Erro ao salvar:', error);
};

// Exemplo: Buscar progresso
const getProgress = async () => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user?.id) return;

  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', user.user.id);

  if (error) console.error('Erro ao buscar:', error);
  return data;
};
```

---

## ✅ Checklist de Verificação

- [ ] Projeto criado no Supabase
- [ ] Tabela `progress` criada com SQL
- [ ] Credenciais copiadas
- [ ] `.env.local` preenchido com credenciais
- [ ] Variáveis de ambiente adicionadas na Vercel
- [ ] `@supabase/supabase-js` instalado (`npm install`)
- [ ] Arquivo `src/lib/supabase.ts` criado
- [ ] Código commitado e pushado

---

## 🐛 Troubleshooting

**"VITE_SUPABASE_URL is undefined"**

- Verifique se `.env.local` existe e tem as variáveis
- Reinicie o servidor (`npm run dev`)
- Cheque se o nome das variáveis começa com `VITE_`

**"CORS error"**

- Vá em Supabase > Settings > API > CORS
- Adicione o domínio da Vercel à lista permitida

**"Error: Unauthorized"**

- RLS (Row Level Security) está bloqueando. Revise as policies SQL
- Verifique se o usuário está autenticado antes de fazer queries

---

## 📚 Documentação Oficial

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
