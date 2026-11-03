# Arquitetura do Bot CISEB

## Estado atual

O projeto é uma aplicação React/TypeScript servida localmente por Express com middleware do Vite. Em produção, Vercel publica a aplicação Express como função Node, serve o build estático do Vite e encaminha chamadas de API no mesmo domínio (`server.ts`, `vercel.json`). O Firebase Admin usa credenciais fornecidas pelo ambiente de servidor; no Vercel o código exige `FIREBASE_SERVICE_ACCOUNT_JSON`, enquanto outros hosts podem usar ADC.

O backend carrega e indexa PDFs da pasta `backend/documents/` uma vez durante a inicialização. A recuperação lexical seleciona os trechos relacionados à pergunta; códigos curriculares só são tratados como conferidos quando código e texto literal aparecem juntos em uma página indexada. O modelo configurado é `gemini-3.5-flash-lite` via `@google/genai`. A geração de PDF é feita no servidor com o conteúdo que a pessoa revisou na interface.

O código está separado em `frontend/` (React/Vite e assets), `backend/` (Express, Firebase Admin, lógica de servidor e documentos) e `shared/` (política institucional e catálogo curricular compartilhados). `package.json`, lockfile, testes e configuração de build permanecem na raiz para manter um único fluxo npm. O Vite usa `frontend/` como raiz web e continua gerando `dist/` na raiz do pacote para compatibilidade com os destinos atuais de frontend.

## Fluxo de autenticação e API

1. A interface usa Firebase Authentication com Google (popup em desktop e redirect em telas estreitas) e persiste a sessão no armazenamento local do SDK.
2. Os domínios `escola.seduc.pa.gov.br` e `seduc.pa.gov.br` são comparados como domínios completos na política compartilhada. O cliente exige provedor Google e e-mail verificado para liberar a aplicação.
3. Chamadas `/api/**` recebem Firebase ID token; o Firebase Admin verifica assinatura, validade, revogação, provedor Google, domínio e declaração `email_verified`.
4. App Check é validado quando o token é enviado; a exigência está desligada por padrão e só deve ser ligada após configurar e testar o provedor no frontend e no servidor.
5. CORS aceita apenas as origens enumeradas em `APP_ORIGINS`. JSON tem limite de tamanho. A verificação de saúde pública não inicializa nem lê PDFs; a API valida identidade antes da inicialização documental. O rate limiter e a concorrência são verificados antes das operações Gemini/PDF.
6. `/api/chat` envia a instrução de sistema, a pergunta, até quatro mensagens recentes limitadas e até quatro trechos documentais recuperados. A chave Gemini existe somente no ambiente do servidor.

## Persistência e histórico

O cliente usa Firestore Lite, carregado sob demanda, para gravar diretamente em `users/{uid}/conversations/{conversationId}/messages/{messageId}`. As operações atuais são leituras e gravações explícitas, sem listeners em tempo real. O SDK Lite não fornece cache/offline queue; as operações do histórico precisam de conexão e não são enfileiradas para sincronização posterior. As regras derivam a autorização de `request.auth.uid`, exigem sessão Google institucional verificada e limitam campos, tipos e comprimentos. Um documento `users/{uid}` contém somente UID, e-mail e timestamps. O Firebase Admin não é usado para gravar conversas.

A lista de conversas é paginada (20 por consulta), mensagens são carregadas em blocos de 50 e as anteriores podem ser solicitadas incrementalmente. A gravação da mensagem e atualização do contador da conversa usam transação. A exclusão remove mensagens em lotes antes do documento pai.

O legado do `localStorage` continua intacto até a pessoa autenticada confirmar explicitamente a importação. IDs estáveis e consulta de conversas existentes tornam a importação retomável sem duplicar documentos concluídos. A cópia local não é apagada.

## Proteção e limites

Os limites são contadores transacionais do Firestore, compartilhados entre instâncias: chat 10/min e 100/dia por UID, 30/min por IP no chat, PDF 5/min por UID e 10/min por IP, e até duas chamadas Gemini concorrentes por UID. Os valores podem ser substituídos por variáveis descritas no `.env.example`. `rateLimitCounters` é negada às regras do cliente; configure TTL no campo `expireAt` para limpeza automática. O uso de Redis não foi adotado: o Firestore já é dependência obrigatória e a transação oferece consistência entre instâncias, ao custo de leituras/escritas e latência por operação.

## Decisões e limites

- Não há cache compartilhado de respostas personalizadas nem chamadas automáticas de resumo.
- A busca documental e a geração de PDF são locais ao servidor e não são repetidas por cache de resposta.
- Conversas são dados do usuário, não do Admin SDK. O backend usa identidade verificada para cotas e chamadas caras.
- A escolha do modelo foi preservada; a compatibilidade/configuração é descrita em `AI_COST_OPTIMIZATION.md`.
- O deploy no Vercel depende das variáveis de ambiente, da identidade segura do Firebase Admin e dos domínios autorizados; configurar deploy não altera o Firebase Console nem publica as regras.
