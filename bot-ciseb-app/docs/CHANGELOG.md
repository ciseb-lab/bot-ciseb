# Changelog

## 2026-11-03 — Backend Cloud Run e Supabase

- Migrados login e persistência para Supabase Auth/Postgres, com login Google institucional e isolamento do histórico por RLS.
- Separado o deploy: Vercel publica o frontend estático; Cloud Run executa a API e empacota os PDFs institucionais.
- Removidas as antigas funções Vercel e inicializações obrigatórias de documentos; health pode responder sem credenciais de serviço ou PDFs.
- Adicionadas migrations para conversas, autorização institucional no banco, limites de uso e concorrência distribuídos.
- Atualizados os guias de deploy, arquitetura, segurança e configuração local.
