# Configuração do Firebase

## Projeto e app Web

1. Use o projeto Firebase institucional existente ou crie um projeto aprovado pela instituição. A política do aplicativo aceita somente `escola.seduc.pa.gov.br` e `seduc.pa.gov.br`.
2. Registre um app Web e configure no ambiente de build do frontend os valores de `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID`. São configurações públicas do SDK Web, não credenciais Admin.
3. Defina `FIREBASE_PROJECT_ID` no backend para o mesmo projeto. No Vercel, o backend aceita o JSON de uma service account aprovada exclusivamente pela variável secreta `FIREBASE_SERVICE_ACCOUNT_JSON`. Nunca coloque esse JSON no navegador, Git, logs ou imagem. Em ambientes Google Cloud com identidade anexada, ADC continua disponível.

## Authentication

1. No console Firebase, habilite Authentication e o provedor **Google**. O frontend usa popup em desktop e redirecionamento em telas estreitas, persistindo a sessão no Firebase Auth.
2. Em Authentication > Configurações, confirme que o domínio real do frontend está em **Domínios autorizados**. Não inclua domínios de e-mail adicionais nessa lista; ela controla origens de autenticação/redirecionamento, não a allowlist institucional do app.
3. A allowlist centralizada em `shared/authPolicy.ts` aceita exatamente `escola.seduc.pa.gov.br` e `seduc.pa.gov.br`, sem diferenciar maiúsculas e minúsculas. O cliente e o backend validam o domínio, `email_verified` e o provedor Google; o backend também verifica assinatura, validade e revogação do ID token.
4. O Google Workspace deve aplicar as políticas de acesso institucionais apropriadas. O provedor Google habilitado não restringe sozinho quais domínios podem iniciar o fluxo; o app recusa domínios não autorizados após receber a identidade.
5. O primeiro login Google pode criar o registro da conta no Firebase Authentication; não é necessário criar usuário manualmente nem criar uma coleção de perfil no Console. Contas antigas criadas com e-mail/senha não atendem à política Google-only; possíveis conflitos de conta precisam de análise e vinculação segura, sem excluir usuários automaticamente.

## Firestore

1. Crie o banco Cloud Firestore na localização aprovada para o serviço. Publique `firestore.rules` somente após revisar projeto e ambiente e concluir os testes; a regra exige o provedor Google.
2. Estrutura atual:

```text
users/{uid}                                      # perfil mínimo, sem privilégios
users/{uid}/conversations/{conversationId}       # título, contagem, timestamps
users/{uid}/conversations/{conversationId}/messages/{messageId}
rateLimitCounters/{counterId}                    # somente Firebase Admin
```

3. Regras exigem UID autenticado correspondente, domínio institucional e e-mail verificado; validam schema, tamanhos e timestamps. Operações do Admin SDK ignoram as regras; o backend usa Admin somente para autenticação, App Check e contadores, não para conversas.
4. Ative uma política TTL do Firestore para `rateLimitCounters.expireAt` no console para remover contadores expirados. Sem TTL, os limites continuam funcionando, mas os documentos podem acumular. Não aplique retenção automática às conversas sem aprovação institucional.
5. Antes de publicar regras, execute `npm run test:firestore-rules`. O teste usa o Firestore Emulator com o projeto fictício `demo-bot-ciseb-rules`; não acessa nem altera o banco real. Requer Firebase CLI e Java instalados. Não publique as regras até o login Google e a validação de domínio/provedor no frontend e backend estarem alinhados.

## Firebase App Check

1. Registre o app Web no App Check com o provedor reCAPTCHA v3 e obtenha a site key pública.
2. Configure `VITE_FIREBASE_APP_CHECK_ENABLED=true` e `VITE_FIREBASE_APP_CHECK_SITE_KEY` no frontend.
3. Observe métricas de solicitações legítimas no console antes de exigir tokens.
4. Valide o tráfego local/produção e somente então configure `APP_CHECK_REQUIRED=true` no backend. Por padrão a API não exige App Check para evitar bloquear um deploy ainda não configurado, mas rejeita tokens inválidos se enviados. App Check não substitui autenticação, regras ou rate limit.
5. Se desejar também proteger acesso direto ao Firestore, habilite a aplicação de App Check para o produto Firestore no console após observar tráfego legítimo. A exigência no servidor API não habilita automaticamente essa proteção do produto.

## Ambiente local e emuladores

`firebase.json` declara Authentication Emulator (`127.0.0.1:9099`) e Firestore Emulator (`127.0.0.1:8080`). Com Firebase CLI instalado, inicie-os com o mesmo project ID definido em `FIREBASE_PROJECT_ID` e `VITE_FIREBASE_PROJECT_ID`. Use `VITE_USE_FIREBASE_EMULATORS=true` para conectar o SDK Web e configure `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` e `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` no processo Node. Deixe App Check opcional no emulador.

Para um Firebase real local, use ADC no backend e nunca copie credenciais para `.env.example`. O servidor carrega `.env.local` e `.env`; `.gitignore`, `.dockerignore` e `.npmignore` excluem arquivos `.env` reais. Configure os valores sem mostrá-los em terminal compartilhado ou logs.

## Verificação funcional

- Entre com uma conta Google de cada domínio permitido e confirme que domínio incorreto, sessão não verificada e provedor diferente de Google são recusados pelo cliente, backend e regras.
- Teste login, logout, sessão restaurada e domínio de autenticação autorizado para o frontend.
- Crie conversas com dois usuários de teste e verifique listagem, leitura, gravação e exclusão entre contas; cada regra deve negar acesso cruzado.
- Teste importação legada somente com consentimento explícito e confirme que a cópia no navegador permanece.
- Use Firebase Emulator Suite para testes de regras; credenciais e conversas reais não devem ser usadas em testes automatizados.
