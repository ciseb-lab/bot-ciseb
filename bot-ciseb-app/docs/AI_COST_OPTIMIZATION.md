# Otimização de tokens e custo Gemini

## Modelo e parâmetros

O servidor mantém `gemini-3.5-flash-lite` em `backend/index.ts`; a documentação oficial consultada em 27/10/2026 o lista como modelo estável para Gemini API, com entrada máxima de 1.048.576 tokens e saída máxima de 65.536 tokens. A configuração da geração usa temperatura `0.4` (campo documentado para geração) e `maxOutputTokens: 2048`, deliberadamente bem abaixo do teto do modelo. Nenhum modelo alternativo foi introduzido. Se a API retornar `MAX_TOKENS`, a resposta avisa que pode estar incompleta e orienta pedir continuação, em vez de truncar silenciosamente.

Fontes: [modelo Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [referência do recurso Model](https://ai.google.dev/api/models), [geração de conteúdo](https://ai.google.dev/gemini-api/docs/generate-content).

## Contexto enviado

- Instrução do sistema curta, sem exemplos repetidos; mantém limites documentais, pedagógicos e de citação.
- PDFs indexados uma vez na inicialização; recupera até quatro trechos por relevância, no máximo dois por documento e descarta duplicatas exatas.
- A solicitação inclui no máximo quatro mensagens recentes, cada uma limitada a 1.200 caracteres pelo servidor. Não envia o histórico todo nem gera resumos artificiais.
- A pergunta atual tem limite de 4.000 caracteres. Habilidades curriculares só entram como evidência se a conferência local for bem-sucedida.
- Cumprimentos iniciais não chamam Gemini. Não há cache de respostas personalizadas entre usuários nem chamada duplicada deliberada.
- Exportação PDF só ocorre após ação explícita e usa texto já revisado; não refaz busca nem chama Gemini.

Antes da redução de contexto no código, o frontend enviava até seis mensagens de 1.800 caracteres; agora são até quatro de 1.200 (redução máxima de texto de histórico enviado de 10.800 para 4.800 caracteres, cerca de 56%). Esse cálculo é um limite de caracteres, não uma contagem de tokens. A recuperação permanece em quatro trechos para preservar fundamentação.

## Métricas

Após cada geração, o backend registra duração, tokens de entrada, tokens de saída (incluindo tokens de pensamento quando reportados), total e uma estimativa de custo para o tier pago padrão. Não registra pergunta, resposta, e-mail, UID ou documento consultado. Falhas registram somente evento, código de status do provedor e duração. Se a API não fornecer contagens, custo estimado fica `null`.

A estimativa atual usa a tabela oficial consultada em 27/10/2026 para tier pago Standard: USD 0,30 por milhão de tokens de entrada e USD 2,50 por milhão de tokens de saída, incluindo pensamento. Fórmula: `(inputTokens × 0,30 + outputTokens × 2,50) / 1.000.000`. Isso não é valor faturado: não cobre diferenças de tier, cache, modalidade, créditos gratuitos, impostos ou alterações de preço. Revise a tabela oficial antes de usar em orçamento: [preços da Gemini API](https://ai.google.dev/gemini-api/docs/pricing).

Não há medição comparativa de uso real anterior disponível neste workspace; portanto, a redução percentual de custo não foi medida. Após deploy, compare métricas agregadas por solicitação e qualidade das respostas com uma amostra pedagógica revisada por formadores. Não logue prompts para fazer essa avaliação.

## Qualidade e ajustes

Preserve arquivo/página, códigos e texto curricular verificados ao ajustar limites. Para respostas longas, a UI sinaliza o teto de saída; pode-se ajustar o máximo após validar qualidade e custo. Não aumente o contexto por padrão nem ative cache compartilhado. O cache só deve ser avaliado para conteúdo estático comum e não personalizado, com análise de custo/TTL da API e revisão de privacidade.
