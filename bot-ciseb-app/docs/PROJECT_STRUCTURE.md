# Estrutura do projeto

O repositório separa a aplicação ativa dos materiais de trabalho do mascote. A raiz do repositório contém `bot-ciseb-app/`, onde ficam o código e a configuração de execução; `design/mascote/` guarda os arquivos-fonte e rascunhos visuais.

```text
bot-ciseb/
├── .env.example                 # modelo de configuração da aplicação
├── README.md                    # entrada do repositório
├── design/
│   └── mascote/
│       ├── originais/           # imagens-fonte do mascote
│       ├── intermediarios/      # recortes e versões de trabalho
│       └── testes/              # imagens e script de teste manual
└── bot-ciseb-app/               # aplicação ativa; executar npm aqui
    ├── api/                     # rotas serverless da Vercel
    ├── backend/                 # servidor, autenticação e documentos
    ├── docs/                    # arquitetura, configuração e operação
    ├── frontend/
    │   ├── public/              # arquivos estáticos publicados
    │   │   └── assets/mascote/  # imagens do mascote usadas pelo site
    │   └── src/
    │       ├── auth/            # autenticação do Firebase no cliente
    │       ├── components/
    │       │   ├── auth/        # tela de entrada
    │       │   ├── branding/    # marca e editor de logotipo
    │       │   ├── chat/        # conversa, histórico e Markdown
    │       │   ├── curriculum/  # consulta curricular e planejamento
    │       │   ├── documents/   # consulta de documentos
    │       │   ├── export/      # impressão e exportação
    │       │   └── layout/      # navegação e estrutura visual
    │       ├── data/            # persistência e modelos do cliente
    │       ├── firebase/        # inicialização do Firebase Web
    │       ├── hooks/           # hooks reutilizáveis
    │       └── utils/           # utilitários compartilhados pelo frontend
    ├── scripts/                 # tarefas de build e manutenção
    ├── shared/                  # regras e dados usados por cliente e servidor
    ├── test/                    # testes automatizados
    ├── package.json             # comandos npm e dependências
    └── README.md                # instruções para executar a aplicação
```

## Onde fazer cada alteração

- **Interface:** comece em `frontend/src/App.tsx`; componentes ficam agrupados por área em `frontend/src/components/`.
- **Autenticação no navegador:** `frontend/src/auth/`. A tela de entrada está em `frontend/src/components/auth/`.
- **API e regras de servidor:** endpoints em `api/`; lógica e integrações em `backend/`.
- **Regras usadas nos dois lados:** `shared/`. Evite duplicar essas regras no frontend e no servidor.
- **Documentos oficiais:** PDFs em `backend/documents/`; o índice é gerado pelo script de build.
- **Imagens exibidas no site:** `frontend/public/assets/`; as do mascote ficam em `frontend/public/assets/mascote/`. Os arquivos em `design/mascote/` são materiais de origem e desenvolvimento, não publicados automaticamente.
- **Testes automatizados:** `test/`. O script de `design/mascote/testes/` é uma ferramenta manual e não faz parte da suíte npm.
- **Orientações e operações:** `docs/`, além de `DEPLOY.md` para publicação.

## Comandos

Execute os comandos npm dentro de `bot-ciseb-app/`. Consulte o [guia principal da aplicação](../README.md) para instalação, variáveis de ambiente, testes e build.
