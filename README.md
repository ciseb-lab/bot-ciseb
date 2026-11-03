# Bot CISEB

O aplicativo ativo está em [`bot-ciseb-app/`](bot-ciseb-app/). Essa pasta contém o frontend, API, documentos, testes, dependências e configuração de deploy. O `server.ts` nesta raiz pertence a uma versão anterior; não use a raiz como diretório de deploy nem siga instruções antigas de Cloud Run/Firebase Hosting. O `.env.example` da raiz é o modelo de variáveis usado pela aplicação atual; copie-o para `bot-ciseb-app/.env.local` e nunca coloque segredos reais nesse modelo.

Para executar e validar a versão atual, siga [`bot-ciseb-app/README.md`](bot-ciseb-app/README.md). O deploy planejado para esta versão está documentado em [`bot-ciseb-app/DEPLOY.md`](bot-ciseb-app/DEPLOY.md).
