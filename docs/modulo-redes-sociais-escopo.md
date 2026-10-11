# Central de Redes Sociais — escopo corrigido

## Objetivo

Criar dentro do app uma central onde o usuário cadastra as redes sociais do salão, acessa cada perfil por link e acompanha informações relevantes da própria conta sem precisar abrir vários painéis externos.

A central não será apenas uma página de divulgação de link de agendamento. Ela será um **painel de contas sociais conectadas**.

## Como o módulo deve funcionar

Cada rede cadastrada terá um cartão com:

- nome da rede;
- nome de usuário ou página;
- foto ou ícone;
- link para abrir o perfil;
- status da conexão;
- data e hora da última sincronização;
- principais indicadores disponíveis;
- botão para atualizar dados;
- botão para desconectar a conta.

O botão de acesso por link continuará disponível. Porém, quando a rede tiver integração oficial, os dados serão carregados dentro do app em cartões, gráficos e listas próprias.

## Dois tipos de cadastro

### Rede cadastrada apenas por link

Funciona para qualquer rede social. O usuário informa nome, plataforma, usuário e URL. O app mostra o cartão e permite abrir o perfil.

Esse modo não fornece automaticamente seguidores, alcance, publicações ou mensagens, porque o app não possui autorização para consultar os dados privados da rede.

### Rede conectada por integração oficial

O usuário clica em **Conectar**, autoriza o acesso na própria rede e volta para o app. A aplicação passa a consultar os indicadores permitidos pela API oficial.

Esse modo exige autenticação OAuth, tokens protegidos no backend, permissões aprovadas e rotina de sincronização. Não devemos pedir senha da rede social nem armazenar senha dentro do Supabase.

## Redes recomendadas para a primeira versão

### Instagram profissional

É a integração mais importante para um salão. A API oficial permite trabalhar com contas Business ou Creator. Dependendo do tipo de login e permissões, é possível obter dados da conta, mídia, métricas de alcance, impressões, visualizações, interações e visualizações de perfil. Também há recursos para publicar mídia, responder comentários, identificar menções e gerenciar mensagens [1] [2].

O painel deve mostrar, quando autorizado:

- seguidores ou informação equivalente disponível;
- alcance;
- impressões;
- visualizações do perfil;
- engajamento;
- publicações recentes;
- curtidas, comentários e visualizações por publicação;
- menções e comentários pendentes, quando a permissão permitir;
- evolução por dia, semana e mês.

A Meta informa que algumas métricas não estão disponíveis para contas com menos de 100 seguidores e que certos dados de usuário ficam disponíveis somente por até 90 dias [2]. O módulo deve mostrar “não disponível” quando a API não retornar uma métrica, sem transformar ausência de dado em zero.

### Facebook Página

A integração deve aceitar uma Página do Facebook, não um perfil pessoal. A API de Insights permite consultar métricas da Página, como alcance e impressões, mediante permissões como `pages_read_engagement` e `read_insights` e um Page Access Token [3].

O painel deve mostrar:

- curtidas ou seguidores, quando disponível;
- alcance;
- impressões;
- publicações recentes;
- reações e comentários;
- comparação do período atual com o anterior.

Como a Meta altera e descontinua métricas, o sistema deve manter uma camada de adaptação por versão da API e exibir a data da última sincronização [3].

### Google Business Profile

O Perfil da Empresa no Google deve ser uma opção de conexão separada. A Business Profile Performance API permite consultar séries diárias e mensais, além de palavras-chave usadas para encontrar o estabelecimento [4].

O painel pode mostrar:

- visualizações na Pesquisa;
- visualizações no Maps;
- ligações;
- solicitações de rota;
- cliques no site;
- palavras pesquisadas;
- evolução por período.

Essa integração depende de acesso à conta Google que administra o Perfil da Empresa e de autorização da API. A documentação também informa que pode ser necessário solicitar acesso quando a quota inicial for zero [4].

### WhatsApp Business

O WhatsApp deve ser tratado como canal de atendimento e não como uma rede de métricas públicas. A integração oficial permite mensagens e dados de conta, mas exige configuração empresarial, permissões, modelos de mensagem e regras de consentimento [5].

Dentro do app, a primeira visualização pode mostrar:

- botão para abrir a conversa;
- número empresarial conectado;
- mensagens enviadas;
- mensagens entregues;
- mensagens lidas;
- respostas;
- modelos aprovados;
- status de consentimento dos clientes.

O painel não deve prometer número de seguidores ou alcance no WhatsApp, porque esses indicadores não são equivalentes aos do Instagram e Facebook.

## Estrutura visual sugerida

### Tela “Redes sociais”

No topo:

- título “Redes sociais”;
- botão “Adicionar rede”;
- filtro por todas, conectadas e somente link;
- botão “Atualizar todas”.

Na primeira área:

- total de redes cadastradas;
- redes conectadas;
- redes pendentes de autorização;
- última sincronização geral.

Na área principal:

- um cartão para cada rede;
- indicador principal em destaque;
- comparação com período anterior;
- mini gráfico de evolução;
- botão “Ver detalhes”;
- botão “Abrir perfil”.

### Tela de detalhes da rede

Cada rede deve possuir abas próprias, conforme os dados disponíveis:

- Visão geral;
- Publicações;
- Engajamento;
- Público ou alcance;
- Mensagens;
- Comentários e menções;
- Configuração da conexão.

A aplicação deve ocultar abas que não sejam suportadas pela rede conectada.

## Regras de segurança

- Nunca armazenar senha de Instagram, Facebook, Google ou WhatsApp.
- Tokens devem ficar no backend ou em armazenamento seguro de secrets, não em `localStorage`.
- Cada usuário deve conectar somente as contas que tem autorização para administrar.
- Mostrar claramente quais permissões serão concedidas.
- Permitir desconectar uma rede e revogar os tokens.
- Armazenar somente os dados necessários para o painel.
- Registrar data da sincronização e erros de autorização.
- Não misturar dados sociais com os dados financeiros e de agenda sem uma relação explícita.
- Manter o modo “somente link” para redes que não possuam integração oficial.

## Ordem de implementação recomendada

### Fase 1 — Cadastro e acesso

Criar o módulo, permitir cadastrar qualquer rede, mostrar cartões, abrir perfis por link e editar ou remover cadastros. Essa fase funciona sem API e já atende ao requisito de centralizar as redes do salão.

### Fase 2 — Instagram

Implementar login oficial, conexão de conta Business ou Creator, sincronização de perfil, publicações e insights. Criar uma tabela de contas conectadas e uma tabela de snapshots de métricas.

### Fase 3 — Facebook e Google

Adicionar conexão de Página do Facebook e Perfil da Empresa no Google. Reutilizar o mesmo painel de indicadores, com adaptadores específicos para as métricas de cada plataforma.

### Fase 4 — WhatsApp Business

Adicionar canal de atendimento, status de mensagens e consentimento. O envio automático só deve ser ativado depois de validar as credenciais e os modelos oficiais.

## Decisão de produto

O módulo deve combinar três experiências:

1. **Acesso rápido:** o usuário abre qualquer rede cadastrada por link.
2. **Visão consolidada:** o usuário vê os principais indicadores dentro do app.
3. **Detalhamento oficial:** cada rede mostra apenas os dados que sua API realmente disponibiliza.

Isso evita criar uma promessa impossível de cumprir para redes sem API e, ao mesmo tempo, permite uma integração real com Instagram, Facebook, Google e WhatsApp.

## Referências

[1]: https://developers.facebook.com/documentation/instagram-platform "Meta — Instagram Platform"
[2]: https://developers.facebook.com/documentation/instagram-platform/insights "Meta — Instagram Platform insights"
[3]: https://developers.facebook.com/documentation/pages-api/platforminsights/page "Meta — Get Page Insights"
[4]: https://developers.google.com/my-business/reference/performance/rest "Google — Business Profile Performance API"
[5]: https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform "Meta — About the WhatsApp Business Platform"
