# Deploy do Bot CISEB na Vercel

## Arquitetura

Este projeto publica o frontend React/Vite e o backend Express no mesmo projeto Vercel. O Express é executado como Vercel Function; os assets do build e os PDFs institucionais são incluídos no bundle conforme `vercel.json`. A API permanece no mesmo domínio do frontend, portanto `VITE_API_BASE_URL` pode ficar vazia.

Firebase Authentication gerencia login Google. Cloud Firestore mantém perfis mínimos, histórico individual e contadores de uso. Gemini é chamado pelo backend; sua chave nunca deve ser configurada em `VITE_*`.

## Conectar o repositório

1. Importe `https://github.com/ciseb-lab/bot-ciseb` na Vercel.
2. Em **Root Directory**, escolha `bot-ciseb` — não a raiz do repositório, que também contém uma versão antiga do app.
3. Use Node.js 24 ou a versão LTS suportada pela Vercel.
4. Configure o install command como `npm ci --include=dev`. A pasta do app deve conter `package-lock.json`.
5. O `vercel.json` executa `npm run build`; deixe o output directory sem sobrescrita manual. A função `api/[...path].ts` encaminha as rotas da API para a aplicação Express; os assets do frontend são servidos pelo diretório `dist`.
6. Configure as variáveis abaixo antes de criar o primeiro deployment. Não publique um deployment funcional sem autenticação do backend e CORS configurados.

`@napi-rs/canvas` é uma dependência direta intencional: o PDF.js usado pelo `pdf-parse` precisa dela no runtime Node da Vercel para fornecer `DOMMatrix` e inicializar a leitura dos PDFs.

## Variáveis de ambiente na Vercel

Configure em **Project Settings > Environment Variables**. Aplique as variáveis públicas nos ambientes que precisam de frontend (Production e Preview conforme a política de testes) e os segredos apenas nos ambientes de servidor aprovados.

| Variável | Tipo | Uso |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Pública, build | Firebase Web SDK |
| `VITE_FIREBASE_AUTH_DOMAIN` | Pública, build | Normalmente `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Pública, build | O mesmo projeto Firebase do backend |
| `VITE_FIREBASE_APP_ID` | Pública, build | ID do app Web registrado no Firebase |
| `VITE_API_BASE_URL` | Pública, build | Deixe vazia para usar API e frontend no mesmo domínio |
| `FIREBASE_PROJECT_ID` | Servidor | ID do mesmo projeto Firebase |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | **Segredo de servidor** | JSON completo de uma service account aprovada; usado pelo Firebase Admin no runtime Vercel |
| `GEMINI_API_KEY` | **Segredo de servidor** | Chave Gemini existente |
| `APP_ORIGINS` | Servidor | Origem HTTPS exata do site publicado, sem barra final, por exemplo `https://seu-projeto.vercel.app` |
| `APP_CHECK_REQUIRED` | Servidor, opcional | Só `true` depois de configurar e testar App Check no frontend e API |
| `VITE_FIREBASE_APP_CHECK_ENABLED` | Pública, build, opcional | `true` somente com App Check pronto |
| `VITE_FIREBASE_APP_CHECK_SITE_KEY` | Pública, build, opcional | Site key do provedor configurado no Firebase |

O exemplo de nomes sem valores fica em `../.env.example`. `NODE_ENV`, `PORT` e `VERCEL` são fornecidos pela plataforma; não invente valores de credenciais.

### Credenciais do Firebase Admin

O backend verifica ID tokens, verifica revogação e grava contadores Firestore com Admin SDK. A Vercel não fornece Application Default Credentials de uma service account do projeto Firebase. O código aceita ADC em outros hosts e, na Vercel, exige `FIREBASE_SERVICE_ACCOUNT_JSON`.

Antes de configurar esse segredo:

- Obtenha aprovação do administrador do projeto e use uma identidade dedicada com somente as permissões necessárias para verificar usuários e acessar Firestore.
- Se a política institucional permitir chave de service account, configure o JSON integral como variável secreta de servidor na Vercel; nunca use variável `VITE_*`, arquivo público, Git, chat, logs ou saída de terminal.
- Não gere nem compartilhe uma chave sem aprovação. Prefira federação de identidade sem chave longa quando disponível e aprovada pela instituição.
- Não ative billing para resolver autenticação. O método de credencial é uma decisão de segurança independente do plano Firebase.

Sem esse segredo (ou uma integração de credenciais sem chave compatível implementada), o backend falha fechado e as rotas protegidas não funcionam.

## Firebase Console

1. Em Authentication, mantenha Google habilitado e adicione o domínio de produção do Vercel (e domínios de Preview somente se forem usados) à lista de domínios autorizados.
2. A política do app permite apenas contas verificadas com `@escola.seduc.pa.gov.br` ou `@seduc.pa.gov.br`. Habilitar Google não restringe automaticamente domínios; o cliente, API e regras verificam essa política.
3. Mantenha o Cloud Firestore existente. A aplicação grava histórico diretamente como `users/{uid}/conversations/...`; regras seguras precisam estar publicadas para os dois domínios e login Google.
4. Antes de publicar mudanças de regras, execute `npm run test:firestore-rules` em ambiente com Java e Firebase CLI. Esse teste usa projeto `demo-*` no emulador, não o banco real.
5. Não crie coleções ou usuários manualmente. O perfil e as conversas são criados pela aplicação após login autorizado.

## Limites e custos

Vercel Functions executa o Express sob limites de duração, tamanho de bundle, memória e cotas do plano escolhido. O carregamento dos PDFs ocorre sob demanda em cada instância fria; acompanhe logs e duração antes de uso amplo. A configuração não habilita faturamento nem cria recursos Firebase.

Firebase Authentication e Firestore têm cotas gratuitas sujeitas ao plano e uso. A API grava contadores distribuídos no Firestore, além do histórico; exceder cotas pode interromper chamadas ou gerar custos conforme o plano do projeto. Gemini tem cotas/custos próprios independentes. Não habilite billing sem aprovação.

## Validação antes do tráfego de usuários

1. `npm ci --include=dev`, `npm test`, `npm run lint` e `npm run build`.
2. No Vercel Preview, valide `/health`, login Google nos dois domínios permitidos, rejeição de domínios externos, sessão expirada, Firestore por UID, chat, documentos e exportação PDF.
3. Confirme que uma conta não consegue ler ou gravar o histórico de outra.
4. Verifique CORS: origens não listadas em `APP_ORIGINS` devem ser recusadas.
5. Não use contas ou conversas reais em testes de regras; não faça chamadas Gemini sem controlar o consumo.

## Referências oficiais

- [Vercel: Express](https://vercel.com/docs/frameworks/backend/express)
- [Vercel: Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel: configuração `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel: Vite](https://vercel.com/docs/frameworks/frontend/vite)
- [Firebase: Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase: Admin SDK setup](https://firebase.google.com/docs/admin/setup)
- [Firebase: Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
