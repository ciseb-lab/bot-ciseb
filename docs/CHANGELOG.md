# Changelog

## 2026-10-27 — Segurança, histórico e eficiência

- Validadores de chat e PDF agora executam antes de consumir as cotas do limitador.
- Limite de contexto recente reduzido a quatro mensagens de até 1.200 caracteres pelo frontend e backend; trechos documentais duplicados são removidos.
- Saída Gemini limitada a 2.048 tokens e limite informado explicitamente quando a API retorna `MAX_TOKENS`; temperatura ajustada para 0.4 após consulta à documentação oficial do parâmetro.
- Limite de concorrência distribuído agora identifica cada lease, evitando que a finalização de uma chamada libere o slot de outra.
- App Check obrigatório tornou-se opt-in via `APP_CHECK_REQUIRED=true`; permite preparar e validar o cliente antes de ativar a exigência.
- Perfil mínimo por usuário, emuladores Firebase opcionais e importação do histórico local idempotente foram adicionados.
- Domínio institucional rejeita formatos com múltiplos `@`; testes de domínio, validação, 429 e regressão documentados.
- `.env.example`, ignores, README, deploy e documentação técnica foram alinhados à arquitetura existente.

## Pendências de ambiente

- Configurar projeto Firebase, provedor de e-mail, regras, ADC e domínios de publicação em cada ambiente.
- Habilitar TTL do Firestore para `rateLimitCounters.expireAt`.
- Configurar App Check e só então habilitar `APP_CHECK_REQUIRED=true` após teste de ponta a ponta.
- Revisar histórico Git em clone de repositório real; este snapshot não contém `.git`.
- Executar teste de regras e fluxos reais com emuladores/credenciais de teste institucionais.
