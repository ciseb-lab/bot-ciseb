# Bot CISEB

Assistente de apoio à formação e às práticas pedagógicas da educação pública do Pará. Consulta documentos institucionais em PDF, ajuda a desenvolver propostas e habilidades curriculares, sincroniza o histórico entre dispositivos e permite exportar respostas em PDF.

## Arquitetura

- `frontend/`: React, TypeScript, Vite e autenticação Google via Supabase Auth.
- `backend/`: API Express, autenticação e persistência Supabase, Gemini, documentos e exportação PDF.
- `shared/`: política de domínios institucionais e catálogo curricular.
- `supabase/migrations/`: tabelas, políticas RLS e funções SQL para persistência e limites de uso.
- O frontend estático é publicado na Vercel; a API e os PDFs são executados juntos no Cloud Run.

O histórico é armazenado no Supabase Postgres com RLS por usuário; a chave de serviço fica somente no ambiente do backend.

## Desenvolvimento local

Requisitos: Node.js 24.x e npm.

```powershell
Copy-Item ..\.env.example .env.local
npm ci
npm run dev
```

Configure `.env.local` com as variáveis de desenvolvimento listadas em `../.env.example`. Não compartilhe nem versione chaves privadas. O servidor Express/Vite local usa `http://localhost:3000`; sem Supabase configurado, a tela informa que o login ainda não está disponível.

## Comandos

```powershell
npm run dev       # API e frontend de desenvolvimento
npm test          # testes locais sem serviços reais
npm run lint      # verificação TypeScript
npm run build     # frontend de produção em dist/
npm start         # API Node para o Cloud Run
```

## Serviços e configuração

1. Crie um projeto Supabase, habilite Google em **Authentication > Sign In / Providers** e configure os domínios de callback em **Authentication > URL Configuration**.
2. Execute as migrations em `supabase/migrations/` no SQL Editor do projeto Supabase.
3. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` e `APP_ORIGINS` como variáveis do serviço Cloud Run. Nunca coloque chaves de serviço ou Gemini em variáveis `VITE_*`.
4. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_API_BASE_URL` no projeto Vercel antes do build. `VITE_API_BASE_URL` aponta para a URL pública da API Cloud Run.

O guia [DEPLOY.md](DEPLOY.md) descreve a configuração passo a passo. Domínios autorizados para login ficam centralizados em `shared/authPolicy.ts`.

## API e documentos

O Express preserva as rotas `/api/health`, `/api/chat`, `/api/documents/status`, `/api/documents/:source`, `/api/curriculum/skills`, `/api/curriculum/validate/:code` e `/api/export/pdf`. Chamadas privadas usam access token Supabase no cabeçalho Bearer. Documentos são indexados sob demanda; a indisponibilidade dos PDFs não impede o servidor de iniciar nem a rota pública de health de responder.

Histórico existente em `localStorage` não é apagado automaticamente; a interface oferece importação para o usuário autenticado. Consulte [arquitetura](docs/ARCHITECTURE.md), [segurança](docs/SECURITY.md) e [otimização de custos](docs/AI_COST_OPTIMIZATION.md).
