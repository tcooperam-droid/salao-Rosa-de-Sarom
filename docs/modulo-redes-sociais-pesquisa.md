# Módulo de Redes Sociais — Pesquisa e proposta para o Rosa de Sarom

## Recomendação principal

O módulo deve começar como uma **central de captação e relacionamento**, não como um painel para publicar automaticamente em todas as redes. O maior ganho prático para o Rosa de Sarom é levar a pessoa interessada diretamente da rede social para um fluxo de agendamento, registrar de onde ela veio e permitir comunicação organizada depois.

A arquitetura recomendada respeita a regra atual do aplicativo: **a agenda continua sendo a fonte da verdade**. O módulo não deve criar uma agenda paralela nem confirmar atendimentos fora do fluxo principal.

## O que aparece com mais frequência nos sistemas de salão

As plataformas analisadas convergem em alguns recursos:

- agendamento online 24 horas por página, link ou botão;
- botão de agendamento no Instagram, Facebook e Perfil da Empresa no Google;
- confirmações e lembretes automáticos;
- cadastro de cliente com histórico, preferências e observações;
- campanhas de retorno, promoções e indicações;
- avaliações e depoimentos exibidos na página de reservas;
- análise de origem dos clientes, conversão e retenção;
- proteção contra faltas por confirmação, sinal ou pagamento antecipado;
- lista de espera e reaproveitamento de horários cancelados.

A Setmore, por exemplo, destaca o botão de reserva no Instagram e Facebook, uma página de reserva com serviços e profissionais, lembretes, avaliações e reabertura automática de horários cancelados [1]. A Fresha combina descoberta, reservas online, lembretes, marketing, análises e ferramentas de retenção [2]. A comparação da Reservio também coloca página de reserva, lembretes, histórico do cliente, análises, fidelidade e integração social entre os recursos centrais [3].

## Recursos recomendados para o Rosa de Sarom

### 1. Link único de agendamento para todas as redes — prioridade máxima

Criar uma página pública de reserva ligada diretamente à disponibilidade da Agenda. O módulo deve gerar:

- um link principal para a bio do Instagram;
- links específicos por serviço;
- links específicos por profissional;
- um botão de copiar link;
- QR Code para cartão, balcão e materiais impressos;
- botões prontos para compartilhar no Instagram, Facebook e WhatsApp.

Cada link deve carregar uma origem, por exemplo `instagram_bio`, `instagram_story`, `facebook`, `google` ou `whatsapp`. Assim, o relatório poderá mostrar quais canais realmente geram agendamentos.

**Por que é eficaz:** reduz a conversa manual, evita erros de disponibilidade e leva o cliente para o mesmo calendário usado pela equipe.

### 2. Botão de agendamento no Instagram e Facebook — prioridade máxima

O Instagram permite adicionar um botão de ação **“Reservar agora”** ao perfil empresarial, mas a própria Meta informa que existe uma lista limitada de provedores e que apenas um botão de ação pode ser exibido por vez [4]. Portanto, a primeira versão deve gerar e orientar a configuração do link de reserva, sem prometer uma integração irrestrita com a API do Instagram.

A aplicação pode oferecer uma tela com:

- link de reserva pronto para copiar;
- instruções curtas para colar o link na bio;
- texto sugerido para a bio;
- links com rastreamento de origem;
- botão de teste para verificar se o link abre corretamente.

### 3. WhatsApp para confirmação, lembrete e retorno — prioridade máxima

O WhatsApp tende a ser o canal mais útil para o relacionamento local, mas deve ser implementado com cuidado. A WhatsApp Business Platform permite enviar mensagens, mídia e mensagens interativas, compartilhar disponibilidade e enviar lembretes de compromissos [5]. Fora da janela de atendimento, mensagens iniciadas pela empresa exigem modelos aprovados; a Meta também exige consentimento prévio do cliente para mensagens de modelo [5].

A primeira versão deve incluir:

- botão “Conversar no WhatsApp” no perfil do cliente;
- mensagem pronta com nome, data, horário e serviço;
- confirmação manual pelo profissional, se desejado;
- lembrete configurável, por exemplo 24 horas antes;
- mensagem de retorno após o atendimento;
- registro de consentimento para receber mensagens;
- fila e histórico de mensagens enviadas;
- bloqueio de envio quando o cliente não autorizou.

Para a primeira fase, é mais seguro começar com **links click-to-chat e mensagens prontas**. O envio automático via Cloud API deve entrar depois, quando houver número empresarial, configuração Meta, modelos aprovados, consentimento e controle de custos.

### 4. Google como canal de descoberta — prioridade alta

O Perfil da Empresa no Google pode encaminhar clientes para reservas por meio de um provedor de agendamento. A documentação do Google informa que o cliente pode receber lembretes e usar serviços integrados ao Google Calendar, quando o negócio trabalha com um provedor elegível [6].

O módulo deve fornecer:

- link de reserva para cadastrar no Perfil da Empresa;
- checklist de configuração do Google;
- origem `google` nos links;
- instrução para conferir se o botão está abrindo a página correta;
- relatório de agendamentos originados pelo Google.

Essa é uma integração simples e de alto valor porque captura pessoas que já estão procurando salão, serviço ou localização.

### 5. Rastreamento de origem dos agendamentos — prioridade máxima

Adicionar ao agendamento uma origem de captação, sem modificar a lógica principal da Agenda. Exemplos:

- Instagram;
- Facebook;
- Google;
- WhatsApp;
- indicação;
- link direto;
- QR Code;
- campanha específica.

O relatório deve mostrar quantidade de visitas, reservas e receita estimada por origem. Para manter compatibilidade, a origem pode começar como metadado do agendamento ou campo complementar, sem alterar os cálculos financeiros já existentes.

### 6. Campanhas de retorno e reativação — prioridade alta

O app já possui histórico de clientes e regra de ausência. O módulo pode transformar isso em ações práticas:

- clientes sem agendamento há 60, 90 ou 120 dias;
- aniversariantes do mês;
- clientes que costumam repetir determinado serviço;
- clientes que cancelaram;
- clientes que fizeram um serviço e podem receber sugestão de retorno;
- clientes que autorizaram ou não autorizaram comunicação.

O sistema deve gerar uma lista e uma mensagem personalizada, mas não disparar campanhas em massa automaticamente na primeira versão. Isso reduz risco de spam e permite revisar o público antes do envio.

### 7. Avaliações e depoimentos — prioridade média/alta

Sistemas de salão usam avaliações para aumentar confiança na página de reserva. A página pública pode exibir depoimentos aprovados pela administração. O módulo deve permitir:

- pedir avaliação após o atendimento;
- separar avaliação interna de publicação pública;
- aprovar ou ocultar depoimentos;
- gerar um link para avaliação no Google;
- acompanhar a quantidade de solicitações e respostas.

A avaliação não deve ser usada para alterar a Agenda, o financeiro ou o cadastro sem revisão.

### 8. Conteúdo social com foco em conversão — prioridade média

Em vez de construir um editor complexo de posts, o app pode gerar materiais simples a partir dos dados existentes:

- card de horário disponível;
- card de serviço ou pacote;
- card de profissional;
- card de promoção com validade;
- card “últimos horários da semana”;
- legenda pronta com link de reserva.

A publicação pode continuar manual no começo. O app entrega a imagem, a legenda e o link rastreável. Isso evita depender imediatamente das permissões e APIs de cada rede.

### 9. Lista de espera e recuperação de cancelamentos — prioridade média

Quando um horário for liberado, o módulo pode listar clientes interessados ou que costumam usar aquele serviço. A equipe envia um convite individual pelo WhatsApp. Esse recurso aproveita a Agenda como fonte da verdade e não cria conflito entre reservas.

### 10. Painel de resultados — prioridade alta

O painel deve responder perguntas de negócio simples:

- de qual rede vieram os agendamentos?
- qual rede trouxe mais receita estimada?
- quantos clientes novos vieram de cada canal?
- qual campanha gerou retorno?
- quantos lembretes foram enviados e respondidos?
- quantos clientes voltaram após uma campanha?
- qual serviço é mais procurado por cada origem?

## O que não recomendo na primeira versão

Não recomendo começar com publicação automática em Instagram, Facebook e TikTok. Cada plataforma tem permissões, formatos, tokens, revisões e limites diferentes. Isso aumentaria a complexidade sem garantir mais agendamentos.

Também não recomendo criar um chatbot de WhatsApp antes de organizar consentimento, modelos aprovados, fila de mensagens e histórico. A API oficial exige atenção a modelos, janela de atendimento, opt-in, qualidade e limites de envio [5].

Não recomendo importar conversas antigas das redes para o cadastro automaticamente. Uma importação mal identificada pode criar clientes duplicados ou associar conversas ao cliente errado.

## Construção sugerida em etapas

### Etapa 1 — Central de links e rastreamento

- criar o módulo Redes Sociais;
- cadastrar links do Instagram, Facebook, Google e WhatsApp;
- gerar link público de reserva;
- gerar QR Code;
- registrar a origem dos acessos e reservas;
- fornecer textos prontos para bio e posts;
- manter tudo ligado à Agenda existente.

### Etapa 2 — WhatsApp assistido

- botão de conversa por cliente;
- mensagens prontas de confirmação, lembrete e retorno;
- consentimento de comunicação;
- histórico de mensagens manuais;
- listas de reativação com revisão antes do envio.

### Etapa 3 — Página pública de reserva

- serviços e pacotes disponíveis;
- escolha de profissional, quando aplicável;
- horários realmente livres na Agenda;
- formulário de nome, telefone e CPF quando necessário;
- criação do agendamento no fluxo existente;
- origem preservada no agendamento.

### Etapa 4 — Integrações oficiais e automações

- configuração do botão de ação do Instagram;
- link do Perfil da Empresa no Google;
- WhatsApp Business Platform com modelos aprovados;
- lembretes automáticos com opt-in;
- painel de conversão e retenção.

## Decisão recomendada

Para o Rosa de Sarom, eu começaria por **três recursos**: link público de agendamento com origem, central de WhatsApp com mensagens prontas e painel de resultados por canal. Eles são os mais práticos porque usam a estrutura que o app já possui, mantêm a Agenda como verdade e podem ser testados sem depender de aprovação complexa das APIs.

A publicação automática de conteúdo e o chatbot devem ficar para depois. O objetivo inicial deve ser converter melhor o interesse que já chega pelas redes em agendamentos reais, sem criar uma segunda agenda nem aumentar o risco operacional.

## Referências

[1]: https://www.setmore.com/industries/salon "Setmore — Free salon booking system"
[2]: https://www.fresha.com/for-business "Fresha — Software para empresas de beleza e bem-estar"
[3]: https://www.reservio.com/blog/tips/choosing-the-best-salon-booking-software "Reservio — comparação de software de agendamento para salões"
[4]: https://help.instagram.com/122793804938499/ "Instagram — Sobre os botões de ação para os perfis empresariais"
[5]: https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform "Meta — About the WhatsApp Business Platform"
[6]: https://support.google.com/business/answer/7475773?hl=en "Google Business Profile — Set up bookings through a provider"
