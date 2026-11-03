# Segurança e privacidade

## Identidade e autorização

Supabase Auth gerencia login Google e sessões; o Bot CISEB não recebe nem armazena senhas. O frontend e o backend exigem e-mail verificado de domínio institucional permitido. O backend valida o access token com Supabase Auth e obtém o UID verificado da sessão. As políticas RLS isolam os registros de cada usuário.

Todas as rotas privadas `/api/**` exigem uma sessão institucional válida. `/api/health` é a única rota pública. A chave Supabase `service_role` só é usada pelo backend para as RPCs de rate limit e concorrência, nunca pelo navegador.

## Limites e abuso

| Operação | Por usuário | Por IP |
|---|---:|---:|
| Chat | 10/min e 100/dia | 30/min |
| PDF | 5/min | 10/min |
| Chat simultâneo | máximo 2 | — |

Os limites têm defaults definidos em `backend/config.ts`; valores ausentes ou vazios mantêm os defaults. A janela diária usa UTC. Validação de corpo, tamanho e método acontece antes de operações caras. RPCs usam tabelas compartilhadas no Postgres para manter os limites entre instâncias.

Cloud Run usa um proxy confiável por padrão (`K_SERVICE`); revise a topologia antes de alterar `TRUST_PROXY_HOPS`. Confiar em cabeçalhos encaminhados por clientes não confiáveis enfraquece limites por IP. IPs são transformados em digest antes de persistir nos contadores.

## CORS, API e segredos

- `APP_ORIGINS` aceita uma lista explícita de origens HTTPS. Se ausente, origens de navegador não são permitidas fora do desenvolvimento local.
- O frontend chama a API pela URL configurada em `VITE_API_BASE_URL`.
- `SUPABASE_SERVICE_ROLE_KEY` e `GEMINI_API_KEY` pertencem somente ao Cloud Run/Secret Manager; nunca use prefixo `VITE_`.
- A chave pública Supabase pode ser incluída no frontend; autorização de dados continua dependendo de RLS e validação no servidor.
- Não registre conteúdo, tokens, e-mails, chaves nem prompts. Logs registram eventos técnicos sem os valores sensíveis.
- `.env` e `.env.*` reais são ignorados pelo Git e Docker; `.env.example` contém apenas placeholders e defaults.

## Dados e incidentes

Conversas podem conter informações pessoais fornecidas pelo usuário. O Postgres armazena conteúdo e metadados necessários ao histórico; políticas RLS limitam acesso ao proprietário. A exclusão de conversa remove mensagens relacionadas por cascata. Defina uma política de retenção e exclusão de conta no projeto Supabase antes de uso amplo.

Se uma credencial aparecer em captura de tela ou arquivo compartilhado, revogue/rotacione-a no provedor e atualize o segredo no Cloud Run. Não envie valores de chaves pelo chat. Verifique também o histórico Git antes de publicar para assegurar que arquivos de ambiente nunca foram commitados.
