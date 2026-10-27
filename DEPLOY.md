# Deploy do Bot CISEB

## Arquitetura de publicação

O deploy documentado usa frontend Vercel e API Express no Cloud Run. `firebase.json` também mantém uma alternativa de Firebase Hosting com `/api/**` reescrito para o serviço Cloud Run `bot-ciseb-api`, região `southamerica-east1`. Escolha uma origem web e configure-a exatamente em `APP_ORIGINS`.

## API no Cloud Run

Na pasta do app (onde estão `Dockerfile`, `server.ts` e `package.json`), publique o serviço. A API fica publicamente roteável porque autenticação de usuário é validada pelo Firebase Admin em cada rota; não confunda Cloud Run público com rota da aplicação sem autorização.

```sh
gcloud run deploy bot-ciseb-api \
  --source . \
  --region southamerica-east1 \
  --min 0 \
  --allow-unauthenticated
```

Configure no serviço, por mecanismo seguro:

- `NODE_ENV=production`
- `APP_ORIGINS=https://SEU-SITE` (origem exata, sem barra final; vírgulas entre origens)
- `FIREBASE_PROJECT_ID=ID_REAL_DO_PROJETO`
- `GEMINI_API_KEY` associado como segredo do Secret Manager
- identidade de serviço com acesso mínimo necessário a Firebase Authentication/App Check e Cloud Firestore
- limites de chat/PDF de `.env.example`, se os valores iniciais precisarem de ajuste
- `APP_CHECK_REQUIRED=false` inicialmente; só alterar para `true` após validar frontend, site key, tráfego e verificação no servidor

Cloud Run fornece `PORT` e ADC. `TRUST_PROXY_HOPS` usa um salto por padrão quando `K_SERVICE` está definido; valide a topologia antes de alterar. O servidor falha ao iniciar se não houver origem, Firebase Admin ou chave Gemini em produção. A API e o índice dos PDFs permanecem no serviço; os documentos da pasta `documents/` são incluídos pela imagem. O diretório `dist/` não é necessário no container da API.

## Frontend Vercel

1. Defina a Root Directory para `bot-ciseb/`.
2. Use `npm ci`, `npm run build` e a saída `dist`.
3. Configure `VITE_API_BASE_URL` com a URL raiz do Cloud Run (sem `/api`).
4. Configure `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID` do app Web aprovado.
5. Se o App Check já tiver sido configurado, configure também `VITE_FIREBASE_APP_CHECK_ENABLED=true` e sua site key pública.
6. Desabilite cadastro deixando `VITE_ALLOW_INSTITUTIONAL_SIGNUP=false`, a menos que o fluxo de cadastro institucional tenha sido aprovado.
7. Cadastre a origem exata do Vercel em `APP_ORIGINS` no Cloud Run e faça novo deploy.

`VITE_*` é incorporado ao bundle do navegador; nunca inclua chave Gemini, service account, senha ou token nessas variáveis.

## Firebase Hosting (alternativa já configurada)

`firebase.json` define `public: dist`, regras Firestore e rewrite `/api/**` para o Cloud Run. Execute `npm ci`, `npm run build`, revise projeto/target Firebase e então publique hosting e regras com Firebase CLI. Configure a origem `https://PROJECT_ID.web.app` e domínios personalizados em `APP_ORIGINS`; configure os mesmos valores públicos `VITE_FIREBASE_*` no build. Não publique regras em projeto de produção antes da revisão e teste.

## Smoke test de deploy

- `GET https://URL-DO-CLOUD-RUN/health` deve informar status e se a base documental foi carregada.
- Teste login, confirmação de e-mail e acesso negado sem e-mail verificado.
- Teste chat, fontes, download de PDF e exportação, além de uma resposta 429 em ambiente de teste com limites reduzidos.
- Confirme isolamento de conversas entre contas no Emulator Suite antes de validar com contas de teste controladas.
- Revise métricas agregadas Gemini e logs: nenhum prompt ou credencial deve aparecer.

Para documentação completa de regras, App Check, ADC, emuladores, TTL e políticas, consulte [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) e [docs/SECURITY.md](docs/SECURITY.md). Custos de Cloud Run, Vercel, Firestore, Firebase Authentication e Gemini dependem das cotas e tarifas vigentes; não há garantia de operação gratuita.
