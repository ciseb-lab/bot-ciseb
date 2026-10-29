# Segurança e privacidade

## Identidade e autorização

Firebase Authentication gerencia o login Google e as sessões; o Bot CISEB não recebe nem armazena senhas. A política institucional centralizada permite somente `escola.seduc.pa.gov.br` e `seduc.pa.gov.br`, comparados como domínios completos. Cliente, backend e regras do Firestore exigem e-mail verificado e provedor `google.com`. A API verifica ID token e revogação com Firebase Admin. O cliente não é autoridade para UID. Regras do Firestore isolam cada conta; não existe campo de privilégio editável pelo usuário.

Todos os endpoints `/api/**` requerem identidade Google institucional. App Check é complementar e opcional até que o provedor esteja configurado e validado em todos os ambientes; depois, pode ser exigido por `APP_CHECK_REQUIRED=true`. Aplicar App Check ao produto Firestore é uma configuração separada no console. A primeira autenticação Google pode criar o registro da conta no Firebase Authentication; não há cadastro de senha no Bot CISEB.

Contas Firebase antigas autenticadas somente por senha serão recusadas pela política Google-only. O aplicativo não exclui nem vincula contas automaticamente; conflitos de credenciais devem ser avaliados antes de migrar usuários.

## Rate limiting e abuso

| Operação | Por UID | Por IP |
|---|---:|---:|
| Chat | 10/min e 100/dia | 30/min |
| PDF | 5/min | 10/min |
| Chat simultâneo | máximo 2 | — |

Valores são iniciais e configuráveis pelo `.env.example`. A janela diária é UTC. O backend valida campos e limites de tamanho antes de consumir a cota; corpo JSON padrão até 200 KB, mensagem até 4.000 caracteres, título de PDF até 180 caracteres e conteúdo até 150.000 bytes. Os limitadores usam transações Firestore compartilhadas entre instâncias e retornam HTTP 429 com `Retry-After`. Falha do controle distribuído bloqueia a operação (503), não libera a chamada cara.

O Express confia em zero proxies por padrão e usa um salto em Cloud Run (`K_SERVICE`), configurável por `TRUST_PROXY_HOPS`. Revise a topologia real antes de mudar esse valor: confiar em cabeçalhos encaminhados por clientes não confiáveis enfraquece o limite por IP. Os documentos de cota contêm UID e digest SHA-256 do IP, nunca o corpo da conversa. Restrinja IAM do Firestore e habilite TTL em `expireAt`.

## API, CORS e segredos

- `APP_ORIGINS` é uma lista explícita de origens completas; produção falha ao iniciar sem origem configurada.
- Validação de entrada e limite do parser Express precedem Gemini/PDF. Há timeout configurável de 45 s para Gemini.
- `GEMINI_API_KEY` e credenciais Firebase Admin pertencem exclusivamente ao ambiente de servidor/secret manager. No Vercel, `FIREBASE_SERVICE_ACCOUNT_JSON` é um segredo de servidor; nunca use prefixo `VITE_`, nem exponha o valor em código, arquivos públicos, Git ou logs.
- Não registre conteúdo, tokens, e-mails, senhas, chaves nem prompts. Logs atuais registram eventos, códigos, tempos e uso de tokens sem corpo.
- Arquivos `.env*` reais são excluídos dos controles de fonte/pacotes; o `.env.example` pode conter apenas configurações públicas do Firebase Web, nunca segredos ou credenciais administrativas. `node_modules/`, `dist/`, `.aistudio/` e ferramentas locais são artefatos, não fonte.
- O diretório `dist/` é gerado e necessário ao deploy estático; não remova arquivos de deploy como limpeza local automática.

## Dados, retenção e incidentes

Conversas podem conter informações pessoais fornecidas pelo usuário. O app salva somente conteúdo e metadados necessários (papel, sequência, timestamp e referências documentais), não credenciais. A pessoa pode excluir cada conversa; a exclusão apaga mensagens em lotes. Não há expiração automática de conversas definida. O histórico local permanece como cópia depois da importação. Desinstalar/excluir uma conta Firebase não apaga automaticamente subcoleções Firestore; exclusão completa da conta requer procedimento administrativo próprio e verificação de backups/retention.

Em incidente ou exposição de credencial: revogue/rotacione a chave no respectivo provedor/Secret Manager, audite logs sem compartilhar valores, invalide sessões quando aplicável e siga o processo institucional de resposta. Não há repositório Git neste snapshot, portanto o histórico de commits não pôde ser auditado; não foi possível confirmar nem descartar exposição histórica. Faça essa revisão em um clone com histórico antes da publicação.
