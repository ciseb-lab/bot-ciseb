# Configuração do Firebase

## Projeto e app Web

1. Use o projeto Firebase institucional existente ou crie um projeto aprovado pela instituição. Não habilite domínios extras sem autorização.
2. Registre um app Web e configure no frontend os valores de `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID`. São configurações públicas do SDK Web, não credenciais Admin.
3. Defina `FIREBASE_PROJECT_ID` no backend para o mesmo projeto. Em produção, use a identidade de serviço do Cloud Run e Application Default Credentials; não envie JSON de service account ao navegador, repositório, logs ou imagem.

## Authentication

1. No console Firebase, habilite Authentication e o provedor **E-mail/senha**.
2. Cadastros pelo aplicativo ficam desligados por padrão. Para habilitá-los deliberadamente, configure `VITE_ALLOW_INSTITUTIONAL_SIGNUP=true` no build frontend; o fluxo envia verificação de e-mail.
3. Configure modelos de e-mail em português, a URL de ação e os domínios autorizados para redirecionamentos conforme o domínio real de publicação.
4. A política do app está centralizada em `shared/authPolicy.ts` e autoriza apenas `escola.seduc.pa.gov.br`. Ela compara o domínio completo sem diferenciar caixa. O backend valida novamente ID token, revogação, domínio e `email_verified`.
5. Ative a proteção de enumeração de e-mails recomendada pelo Firebase. Recuperação e reenvio seguem as proteções e limites do provedor.

## Firestore

1. Crie o banco Cloud Firestore na localização aprovada para o serviço. Publique `firestore.rules` com `firebase deploy --only firestore:rules` após revisar projeto e ambiente.
2. Estrutura atual:

```text
users/{uid}                                      # perfil mínimo, sem privilégios
users/{uid}/conversations/{conversationId}       # título, contagem, timestamps
users/{uid}/conversations/{conversationId}/messages/{messageId}
rateLimitCounters/{counterId}                    # somente Firebase Admin
```

3. Regras exigem UID autenticado correspondente, domínio institucional e e-mail verificado; validam schema, tamanhos e timestamps. Operações do Admin SDK ignoram as regras; o backend usa Admin somente para autenticação, App Check e contadores, não para conversas.
4. Ative uma política TTL do Firestore para `rateLimitCounters.expireAt` no console para remover contadores expirados. Sem TTL, os limites continuam funcionando, mas os documentos podem acumular. Não aplique retenção automática às conversas sem aprovação institucional.

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

- Crie uma conta autorizada em ambiente de teste, confirme a mensagem recebida e confira que uma conta não verificada não acessa a aplicação/API.
- Teste domínio incorreto, credenciais inválidas, logout e redefinição de senha.
- Crie conversas com dois usuários de teste e verifique listagem, leitura, gravação e exclusão entre contas; cada regra deve negar acesso cruzado.
- Teste importação legada somente com consentimento explícito e confirme que a cópia no navegador permanece.
- Use Firebase Emulator Suite para testes de regras; credenciais e conversas reais não devem ser usadas em testes automatizados.
