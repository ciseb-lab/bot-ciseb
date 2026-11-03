# Deploy do Bot CISEB

## Arquitetura de produção

- **Vercel:** publica somente o frontend Vite estático.
- **Cloud Run:** executa a API Express e inclui os PDFs de `backend/documents/` na imagem Docker.
- **Supabase:** Google Auth, Postgres para conversas e funções transacionais de limites.
- **Gemini:** chamado exclusivamente pelo backend Cloud Run.

O backend e o frontend têm origens diferentes. `APP_ORIGINS` deve conter a origem exata do site Vercel; `VITE_API_BASE_URL` deve conter a URL pública do Cloud Run, sem barra final.

## Preparar Supabase

1. No Supabase, crie um projeto e abra **SQL Editor > New query**.
2. Execute, em ordem, o conteúdo de `supabase/migrations/20261103000000_conversations.sql` e `supabase/migrations/20261103001000_request_limits.sql`.
3. Em **Authentication > Sign In / Providers**, habilite Google e configure as credenciais OAuth do provedor Google.
4. Em **Authentication > URL Configuration**, defina a URL do site Vercel e adicione as URLs de callback exibidas na configuração do provedor. Inclua Preview apenas se for usá-lo.
5. Os endereços de callback e as credenciais OAuth pertencem aos respectivos painéis; não os envie por chat nem os salve no repositório.

## Publicar a API no Cloud Run

1. No Google Cloud Console, selecione o projeto e abra **Cloud Run > Create service**.
2. Escolha implantar a partir do repositório ou imagem, usando `bot-ciseb-app/Dockerfile` e `bot-ciseb-app/` como contexto de build. A pasta de PDFs precisa estar incluída.
3. Configure a porta `8080`. Permita invocações públicas no Cloud Run; a própria API valida o token Supabase em todas as rotas privadas. `/api/health` é público.
4. Em **Variables & Secrets**, cadastre no serviço `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` e `APP_ORIGINS`. Não coloque valores secretos no código, no `.env.example`, no Git ou em logs. Use Secret Manager para chaves privadas quando disponível.
5. Para `APP_ORIGINS`, use a origem de produção da Vercel, sem barra final. Adicione outras origens somente se forem destinos autorizados.
6. Salve, implante e copie a URL pública do serviço Cloud Run. A URL é necessária na configuração da Vercel, não é uma credencial.

## Publicar o frontend na Vercel

1. Abra o projeto em **Vercel > Settings > Build and Deployment**.
2. Defina **Root Directory** como `bot-ciseb-app` e habilite a opção de incluir arquivos da pasta raiz se a plataforma solicitar acesso ao `.env.example` fora da raiz (não são necessários arquivos de segredo).
3. Use Node.js 24.x, install command `npm ci --include=dev`, build command `npm run build` e output directory `dist`.
4. Em **Settings > Environment Variables**, configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_API_BASE_URL` para Production e Preview conforme os ambientes que serão usados.
5. Faça um novo deploy para incorporar as variáveis ao build estático.

## Variáveis

| Variável | Onde configurar | Observação |
|---|---|---|
| `SUPABASE_URL` | Cloud Run | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Cloud Run | Chave pública do Supabase, usada pelo backend ao verificar sessões |
| `SUPABASE_SERVICE_ROLE_KEY` | **Segredo Cloud Run** | Acesso administrativo do servidor; nunca usar no frontend |
| `GEMINI_API_KEY` | **Segredo Cloud Run** | Rotacione a chave antiga se ela apareceu em imagem ou arquivo compartilhado |
| `APP_ORIGINS` | Cloud Run | Origem HTTPS exata da Vercel, sem `/` no final |
| `VITE_SUPABASE_URL` | Vercel, build | URL pública do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Vercel, build | Chave pública; não substitui autorização e RLS |
| `VITE_API_BASE_URL` | Vercel, build | URL pública do serviço Cloud Run |
| `GEMINI_TIMEOUT_MS` | Cloud Run, opcional | Timeout em ms; padrão 45000 |

Os limites de chat/PDF e o proxy confiável têm defaults seguros no módulo `backend/config.ts`. Deixe variáveis de limite vazias para usar os defaults; valores vazios não viram zero.

## Testes de publicação

Antes do deploy, execute `npm ci --include=dev`, `npm test`, `npm run lint` e `npm run build`.

Após cada deploy:

1. `GET https://<URL-CLOUD-RUN>/api/health` deve responder HTTP 200.
2. No Preview Vercel, verifique a tela de login Google; teste sem sessão, domínio não autorizado e sessão institucional válida.
3. Com sessão válida, teste status de documentos, busca curricular, chat e exportação PDF.
4. Confirme que uma conta não consegue ler ou gravar conversas de outra e que origem não listada recebe 403.

## Custos e segurança operacional

Cloud Run, Supabase e Gemini têm cotas e políticas de cobrança independentes. Revise custos e limites antes de disponibilizar o site; não habilite billing apenas para corrigir autenticação. Mantenha secrets no Secret Manager/variáveis secretas e nunca compartilhe valores em mensagens ou capturas de tela.
