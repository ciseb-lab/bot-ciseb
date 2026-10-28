# Deploy do Bot CISEB

## Arquitetura

O backend Express pode ser hospedado como um Web Service gratuito no Render. O frontend continua no provedor atual (por exemplo, Vercel ou Firebase Hosting) e chama a API pela variável de build `VITE_API_BASE_URL`. O modelo Gemini e os documentos institucionais permanecem no backend.

O projeto já lê `process.env.PORT`, escuta em `0.0.0.0` e possui `GET /health`. Não é necessário Docker para o deploy nativo. O `Dockerfile` existente não precisa ser usado.

## Pré-requisito importante: Firebase Admin

A API atual usa Firebase Admin para validar o ID token e App Check, além de usar Firestore para os limites distribuídos. `backend/firebaseAdmin.ts` inicializa o Admin SDK com Application Default Credentials (ADC); o Render não fornece automaticamente a identidade Google Cloud disponível no Cloud Run.

Por isso, a implantação do backend no Render **não está pronta para produção até que haja uma solução de credenciais aprovada para o Firebase Admin**. A presença de `FIREBASE_PROJECT_ID` sozinha não garante que o backend consiga validar tokens ou acessar Firestore. Esta atualização não cria nem documenta credenciais administrativas como requisito, não altera a integração e não publica o serviço. Não prossiga com tráfego de usuários até esse ponto ser resolvido e testado.

## Criar o Web Service no Render

1. No Render, escolha **New > Web Service** e conecte o repositório GitHub existente.
2. Selecione a branch usada para publicação.
3. Configure:

   | Campo | Valor |
   |---|---|
   | Name | Nome de sua escolha |
   | Language | Node |
   | Root Directory | `bot-ciseb` (diretório do app que contém `package.json`) |
   | Instance Type | **Free** |
   | Build Command | `npm ci --include=dev` |
   | Start Command | `npm start` |
   | Health Check Path | `/health` |

O comando de instalação inclui `devDependencies` porque o script atual `start` executa `tsx`, listado nessa seção do `package.json`. O build Vite não é necessário no serviço da API: o frontend é publicado separadamente. `npm run build` continua sendo o comando para compilar o frontend. O Render fornece `PORT`; não fixe esse valor manualmente.

O Render usa Node 24.22.1 por padrão para novos serviços segundo a documentação consultada em 28/10/2026. O ambiente local deste projeto usa Node 24.19.0. Para fixar a versão no painel, configure `NODE_VERSION=24.22.1` e valide o primeiro deploy; o `Dockerfile` existente não é usado nessa configuração nativa.

Na organização do repositório, o pacote npm permanece na raiz do app; `backend/` e `frontend/` são diretórios de código-fonte, não raízes independentes de instalação.

## Variáveis do backend

Configure as variáveis em **Environment** no painel do Render. Não inclua segredos em arquivos do repositório nem em variáveis `VITE_*`.

| Variável | Valor/uso |
|---|---|
| `NODE_ENV` | `production` |
| `GEMINI_API_KEY` | Chave existente do Gemini, cadastrada como variável secreta. |
| `APP_ORIGINS` | Origens exatas do frontend, separadas por vírgula e sem barra final, por exemplo `https://seu-site.example`. |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase já utilizado pela aplicação. |
| `PORT` | Fornecida pelo Render; não configurar manualmente. |
| `TRUST_PROXY_HOPS` | Só definir após validar o endereço IP observado pela aplicação e a topologia de proxy. O rate limit por IP depende dessa configuração. |

Os limites e ajustes opcionais existentes estão listados em `.env.example`. Não copie valores secretos de arquivos locais. `APP_CHECK_REQUIRED` permanece conforme a política já aprovada para o ambiente e não deve ser ativada sem validar o cliente e a API.

### CORS e proxy

`APP_ORIGINS` deve conter a origem HTTPS real do frontend. Não use `*` nem inclua a URL do backend como substituta da origem do site. Em desenvolvimento, os padrões locais existentes continuam válidos.

O serviço já escuta em `0.0.0.0` e na porta `PORT`, conforme exigido pelo Render. O valor padrão de `TRUST_PROXY_HOPS` não presume a topologia Render; confirme-a antes de habilitar confiança nos cabeçalhos encaminhados. CORS não é autenticação: a API continua exigindo a identidade Firebase existente.

## Configurar o frontend

No provedor atual do frontend, configure `VITE_API_BASE_URL` com a URL HTTPS raiz do Web Service Render, sem `/api` e sem barra final, por exemplo `https://seu-servico.onrender.com`. Faça um novo build/publicação do frontend após mudar a variável.

Configure também as variáveis públicas `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID` já usadas pelo app. Se App Check estiver habilitado para o frontend, mantenha também suas variáveis públicas correspondentes. A chave Gemini e credenciais administrativas nunca pertencem ao frontend.

Com `VITE_API_BASE_URL` configurada, `src/utils/api.ts` direciona chamadas diretamente ao Render. Para isso, `APP_ORIGINS` precisa permitir a origem do frontend. A regra `/api/**` existente em `firebase.json` ainda aponta para Cloud Run e não deve ser considerada o encaminhamento para o Render.

## Arquivos incluídos no backend

Mantenha `backend/` e `shared/` no repositório, assim como `frontend/` para o build do cliente. Os nove PDFs de `backend/documents/` são carregados e indexados ao iniciar; os caminhos são resolvidos a partir da localização do código, não dependem de arquivos enviados pelo usuário nem de diretório persistente.

O índice é reconstruído a cada inicialização. O sistema de arquivos do Render Free é efêmero, mas os PDFs versionados são parte do deploy e a geração de PDF atual ocorre em memória. Não armazene dados persistentes no disco local do serviço.

## Limitações e custos

O serviço Free entra em repouso após 15 minutos sem tráfego e pode levar cerca de um minuto para voltar. Pode reiniciar, não tem disco persistente e está sujeito a cotas mensais de instância, banda e minutos de build; ao excedê-las, o serviço ou novos deploys podem ser suspensos, especialmente sem método de pagamento. Não há garantia de disponibilidade contínua.

O plano Render não elimina cotas nem eventuais custos externos do Gemini ou do Firebase. Verifique os limites e a forma de faturamento desses provedores separadamente. Esta configuração não exige adicionar cartão ou habilitar faturamento no Render, mas também não garante uso gratuito dos serviços externos.

## Validação antes de publicar para usuários

1. Execute `npm ci`, `npm test`, `npm run lint` e `npm run build` localmente.
2. Após o deploy, confirme `GET https://URL-DO-RENDER/health` e `documentsReady: true`.
3. Teste o preflight CORS da origem real do frontend e confirme que uma origem não autorizada é recusada.
4. Com a solução Firebase Admin aprovada e validada, teste sessão verificada, App Check conforme configuração, cotas, chat, consulta/download de PDFs e exportação.
5. Teste os limites por IP após configurar `TRUST_PROXY_HOPS`, e confirme respostas 429 sem expor dados pessoais.
6. Faça o smoke test do frontend com a URL Render de produção. Chamadas Gemini reais podem consumir cota/custo e devem ser controladas.

## Referências oficiais

- [Render: Free instances e limitações](https://render.com/docs/free)
- [Render: Web Services e binding de porta](https://render.com/docs/web-services)
- [Render: versões Node.js](https://render.com/docs/node-version)
- [Render: variáveis e arquivos secretos](https://render.com/docs/configure-environment-variables)
