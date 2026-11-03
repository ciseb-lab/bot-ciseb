# Arquitetura do Bot CISEB

## Componentes

- `frontend/`: React/TypeScript e Vite; publicado como arquivos estáticos na Vercel.
- `backend/`: Express no Cloud Run; integra Supabase Auth, Postgres, Gemini, PDFs e exportação.
- `shared/`: política de domínio institucional e catálogo curricular compartilhados.
- `supabase/migrations/`: schema de conversas, RLS e funções transacionais para limites de uso.

O histórico do usuário é sincronizado via Supabase Postgres e protegido por Row Level Security (RLS). PDFs institucionais são incluídos na imagem do Cloud Run.

## Autenticação e API

1. O frontend inicia login Google com Supabase Auth e mantém a sessão gerenciada pelo SDK.
2. A política compartilhada aceita somente `escola.seduc.pa.gov.br` e `seduc.pa.gov.br`, compara domínios completos e exige conta Google verificada.
3. Chamadas privadas enviam o access token Supabase como Bearer. O backend valida a sessão pelo Auth API do Supabase e deriva o UID do usuário autenticado; não confia em UID fornecido pelo cliente.
4. CORS aceita apenas as origens de `APP_ORIGINS`; sem origens configuradas, requisições com origem de navegador são bloqueadas.
5. A rota de health não exige Supabase nem inicializa PDFs. O índice documental é carregado sob demanda na primeira rota que necessita dele; falha de arquivo não impede o servidor de iniciar.
6. `/api/chat` envia instruções, pergunta, histórico recente limitado e trechos localizados nos PDFs ao Gemini. A chave Gemini existe somente no Cloud Run.

## Histórico

As tabelas `profiles`, `conversations` e `conversation_messages` usam RLS para isolar linhas por `auth.uid()`. A função `persist_conversation_message` executa gravação idempotente, atualiza a contagem em transação e recebe o usuário autenticado via sessão. A lista de conversas é paginada; mensagens podem ser lidas em blocos e carregadas progressivamente.

O histórico legado do `localStorage` permanece no navegador até que o usuário autenticado opte por importá-lo. A importação usa IDs estáveis e não apaga a cópia local.

## Limites e custos

As tabelas e RPCs de `request_limits` mantêm limites por UID e IP entre instâncias Cloud Run, além de leases para limitar chamadas simultâneas por usuário. RPCs administrativas só podem ser executadas pelo `service_role`, guardado no servidor. Os valores padrão são definidos em `backend/config.ts` e variáveis vazias não os substituem por zero.

As operações de chat e geração de PDF consomem recursos do Cloud Run e da API Gemini. A persistência e os limitadores consomem recursos Supabase; os planos e cobranças são independentes.

## Rotas preservadas

O backend mantém `/api/health`, `/api/chat`, `/api/documents/status`, `/api/documents/:source`, `/api/curriculum/skills`, `/api/curriculum/validate/:code` e `/api/export/pdf`. Os métodos e formatos principais permanecem os mesmos; o frontend recebe a URL do backend por `VITE_API_BASE_URL`.
