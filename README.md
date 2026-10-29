# Bot CISEB

Assistente de apoio à formação e às práticas pedagógicas da educação pública do Pará. Consulta documentos institucionais em PDF, ajuda a desenvolver propostas e habilidades curriculares sem apresentar o catálogo local como fonte normativa, mantém histórico por conta autenticada e permite revisar e exportar respostas em PDF.

## Organização

O projeto é organizado na raiz do repositório: `src/` contém a interface, `server/` contém a API, `documents/` reúne os PDFs institucionais, `public/` contém assets públicos, `test/` contém testes e `docs/` reúne a documentação.

## Arquitetura e tecnologias

- Frontend: React 19, TypeScript, Vite e Firebase Web SDK.
- API: Node.js, Express e `@google/genai`; a chave Gemini permanece exclusivamente no servidor.
- Identidade e persistência: Firebase Authentication e Cloud Firestore com regras restritivas.
- Documentos: PDFs locais indexados em trechos no início do servidor (RAG; não há retreinamento do modelo).
- PDF: conteúdo revisado no cliente é enviado à API para geração do arquivo.
- Deploy documentado: frontend Vercel e API Cloud Run; `firebase.json` também contém configuração de Firebase Hosting com rewrite para Cloud Run.

Detalhes: [arquitetura](docs/ARCHITECTURE.md), [Firebase](docs/FIREBASE_SETUP.md), [segurança](docs/SECURITY.md), [custos Gemini](docs/AI_COST_OPTIMIZATION.md) e [deploy](DEPLOY.md).

## Pré-requisitos e execução local

- Node.js 20 ou compatível com as versões do Vite instaladas.
- npm, Firebase project configurado para uso real ou Firebase CLI para os emuladores.

Na pasta `bot-ciseb`:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

O servidor integrado Express/Vite usa `http://localhost:3000`. Preencha `.env.local` com as variáveis públicas `VITE_FIREBASE_*`, `FIREBASE_PROJECT_ID` e, para chamadas Gemini, `GEMINI_API_KEY`. Nunca coloque credenciais administrativas ou a chave Gemini em variáveis `VITE_*`. A API requer sessão Firebase verificada; consulte [Firebase setup](docs/FIREBASE_SETUP.md) para emuladores e configuração real.

## Comandos

```powershell
npm run dev       # API e frontend de desenvolvimento
npm test          # testes unitários sem serviços reais
npm run lint      # verificação TypeScript
npm run build     # frontend de produção em dist/
npm start         # servidor Node (sem Vite em produção)
```

Os testes que dependem de Firebase podem ser executados com os emuladores conforme a documentação. `dist/` é gerado pelo build: mantenha-o local para deploy, não o trate como fonte. `node_modules/` é local e pode ser recriado por `npm ci` usando `package-lock.json`.

## Configuração de ambiente

`.env.example` inclui a configuração pública do app Firebase Web; mantenha credenciais administrativas e demais segredos fora do arquivo. Configurações administrativas pertencem ao ambiente seguro do servidor/Secret Manager; as configurações `VITE_FIREBASE_*` são lidas pelo bundle web e não substituem Authentication, Security Rules ou autorização do servidor. Configure a origem do site em `APP_ORIGINS` e não habilite App Check obrigatório antes de configurar e testar a chave do provedor em cada ambiente.

## Documentos e respostas

Os nove PDFs de `documents/` são indexados ao iniciar a API. A cada pergunta, a recuperação local seleciona até quatro trechos relevantes e remove duplicatas; somente contexto recente limitado é enviado ao Gemini. Referências informam o arquivo e a página física quando identificável. PDFs digitalizados precisam de OCR para busca textual. O status está em `/api/documents/status` (requer sessão autenticada).

O modelo configurado é `gemini-3.5-flash-lite`. A resposta pode ficar incompleta ao atingir o teto de geração; nesse caso, a interface informa isso explicitamente. Métricas agregadas de tokens e duração não incluem conteúdo das conversas. Consulte [otimização de custos](docs/AI_COST_OPTIMIZATION.md).

## Deploy e preservação de dados

Siga [DEPLOY.md](DEPLOY.md). Históricos no `localStorage` não são migrados automaticamente: a pessoa usuária inicia a importação e mantém a cópia local. O Firestore mantém conversas até exclusão pelo usuário; não há política de expiração automática de histórico configurada. PDFs e documentos institucionais existentes devem ser preservados.
