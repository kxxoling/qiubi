// Settings help tooltips (help.* keys) — beginner-friendly explanations from the qBT docs.
import type { Dictionary } from "@/i18n/types";

export default {
  "help.scope_pause_resume":
    "Sem seleção, age sobre todos os torrents que correspondem ao filtro atual; com seleção, apenas sobre os torrents selecionados.",
  "help.create_subfolder":
    "Torrents com vários arquivos são colocados em uma subpasta com o nome do torrent, mantendo a pasta de destino organizada. Torrents de arquivo único não são afetados.",
  "help.auto_delete_mode":
    'Controla o que acontece com o arquivo .torrent original ao remover um torrent: "Nunca remover" exclui apenas a tarefa; "Remover se existir" também exclui o .torrent.',
  "help.preallocate":
    "Reserva em disco o tamanho completo do arquivo antes de baixar: reduz a fragmentação e detecta cedo a falta de espaço. Sem benefício em SSDs; recomendado em HDDs.",
  "help.incomplete_ext":
    "Arquivos incompletos recebem o sufixo .!qB para não serem confundidos com os concluídos. O sufixo é removido automaticamente ao finalizar.",
  "help.auto_tmm":
    "Gerenciamento automático de torrents: os caminhos seguem as configurações de categoria e os arquivos são movidos ao mudar a categoria. Desative para controlar manualmente por torrent.",
  "help.save_path": "Pasta padrão para novos torrents. Pode ser alterada ao adicionar ou depois.",
  "help.add_stopped":
    "Novos torrents são adicionados pausados e não baixam até você retomá-los. Útil para revisar antes a seleção de arquivos e prioridades.",
  "help.export_dir":
    "Mantém uma cópia do .torrent de cada tarefa adicionada nesta pasta — útil para backup ou migrar para outro cliente.",
  "help.temp_path":
    "Downloads incompletos ficam aqui e são movidos para o caminho de salvamento ao terminar. Mantenha no mesmo disco para evitar movimentações lentas.",
  "help.autorun":
    "Executa um comando quando um torrent termina. Variáveis: %N nome, %F caminho, %R caminho raiz, %L categoria, %I hash. Roda no servidor do qBittorrent.",
  "help.listen_port":
    'A porta que os demais pares usam para te alcançar — seu "número da porta". Redirecione-a no roteador (ou ative UPnP) para conectividade e velocidade muito melhores.',
  "help.random_port":
    "Usa uma porta de escuta aleatória a cada inicialização. Desative se configurou um redirecionamento fixo no roteador.",
  "help.upnp":
    "Pede ao roteador para abrir a porta de escuta automaticamente via UPnP/NAT-PMP, sem redirecionamento manual. Alguns roteadores antigos não suportam bem.",
  "help.max_connec":
    "Conexões totais máximas somando todos os torrents. Muito baixo limita a velocidade; muito alto sobrecarrega o roteador. 200–500 funciona bem em redes domésticas.",
  "help.max_connec_per_torrent":
    "Conexões máximas de um único torrent. Maior para torrents populares; o padrão basta para os raros.",
  "help.max_uploads":
    "Vagas globais de envio — para quantos pares você pode enviar dados ao mesmo tempo. Aumente se semeia muito.",
  "help.proxy":
    "Roteia o tráfego por um servidor proxy. SOCKS5 é o mais completo (suporta conexões de pares); proxies HTTP servem apenas em alguns cenários.",
  "help.proxy_peers":
    "Também roteia as conexões entre pares pelo proxy. Desativado, apenas os anúncios ao tracker e requisições web usam o proxy.",
  "help.proxy_torrents_only":
    "Apenas o tráfego de torrents usa o proxy; requisições ao tracker e verificações de atualização conectam diretamente.",
  "help.global_limit":
    'Limite global de download de todos os torrents. 0 significa ilimitado. Use o interruptor de "velocidade alternativa" da barra de status para um limite temporário rápido.',
  "help.scheduler":
    "Ativa automaticamente os limites alternativos acima na janela de horário configurada, ex.: reduzir a velocidade todo fim de noite no pico.",
  "help.limit_utp":
    "Aplica os limites às conexões μTP. O μTP já cede automaticamente quando a rede está ocupada — normalmente não precisa ativar.",
  "help.limit_overhead":
    "Conta a sobrecarga do protocolo BitTorrent (handshakes etc.) nos limites, tornando-os mais rígidos na prática.",
  "help.limit_lan_peers":
    "Aplica os limites a pares da sua rede local. Transferências LAN são rápidas; normalmente deixe desativado.",
  "help.dht":
    "Tabela hash distribuída: encontra pares sem servidor tracker — a base dos links magnet. Deve ser desativada em trackers privados (PT), ou sua conta pode ser banida.",
  "help.pex":
    "Troca de pares: descobre mais pares a partir dos já conectados. Sites de tracker privado (PT) também exigem isso desativado.",
  "help.lsd":
    "Descoberta de serviço local: encontra e conecta automaticamente outros usuários do qBittorrent na mesma LAN, sem passar pela internet.",
  "help.encryption":
    'A criptografia de protocolo ofusca o tráfego BitTorrent e pode contornar limitações do provedor. "Preferir" mantém compatibilidade; "Exigir" pode falhar com pares sem suporte.',
  "help.anonymous_mode":
    "Desativa conexões de entrada, oculta a impressão do cliente e só comunica via proxy. Reduz muito os pares e a velocidade — apenas para necessidades especiais com um proxy confiável.",
  "help.utp":
    "O μTP cede automaticamente quando sua rede está congestionada, então os downloads não atrapalham navegação ou jogos; TCP é mais agressivo. O padrão usa ambos.",
  "help.queueing":
    "Limita quantos downloads/semeaduras rodam ao mesmo tempo; o resto espera na fila para não dividir a banda entre tarefas demais.",
  "help.max_active_downloads":
    "Quantos torrents baixam ao mesmo tempo; o resto fica na fila. 3–5 é um bom começo, salvo com bastante banda disponível.",
  "help.slow_torrents":
    "Torrents lentos (abaixo dos limiares de velocidade/atividade) não ocupam vagas ativas, então um torrent travado não bloqueia a fila.",
  "help.max_ratio":
    "Proporção = enviado ÷ baixado; 1.0 significa que você enviou tanto quanto baixou. Ao atingir, a ação abaixo é aplicada. Usuários de PT: siga as regras do seu site.",
  "help.max_seeding_time":
    "Para ou remove após semear por estes minutos. Dispara quando a condição de proporção ou de tempo for atingida.",
  "help.add_trackers":
    "Acrescenta esta lista de trackers públicos a cada novo torrent como fontes extra quando os embutidos falham. Sem efeito em torrents privados (PT). Uma URL por linha.",
  "help.rss_processing":
    "Busca todos os feeds RSS periodicamente para atualizar os artigos. Desative para parar a atualização automática.",
  "help.rss_auto":
    "Usado com as regras de download RSS: torrents correspondentes são adicionados automaticamente — ótimo para acompanhar séries.",
  "help.repack":
    "Também baixa relançamentos REPACK/PROPER (versões corrigidas do mesmo episódio). Desativado, apenas o primeiro lançamento é obtido.",
  "help.session_timeout":
    "Segundos de inatividade antes de a sessão expirar e você precisar entrar novamente.",
  "help.csrf":
    "Evita falsificação de requisição entre sites: impede que páginas maliciosas controlem o qBittorrent com seu login. Proxies reversos/dev podem ser bloqueados — desative temporariamente nesse caso.",
  "help.host_validation":
    "Verifica o cabeçalho HTTP Host para que a interface web não seja acessada de domínios inesperados. Se receber 401 com credenciais corretas atrás de proxy, tente desativar.",
  "help.clickjacking":
    "Impede que esta página seja incorporada em iframes de outros sites (proteção clickjacking).",
  "help.secure_cookie":
    "Envia o cookie de sessão apenas por HTTPS. Não ative sem HTTPS ou não conseguirá entrar.",
  "help.domain_list":
    "Lista branca de domínios com permissão para acessar a interface web, separados por vírgula. * permite todos. Usada com a validação do cabeçalho Host.",
  "help.bypass_local": "Pula o login para requisições de localhost (127.0.0.1).",
  "help.bypass_subnet":
    "Pula o login para sub-redes na lista branca, ex.: sua LAN doméstica. Cuidado: qualquer pacquete que falsifique esses endereços também entra sem autenticação — evite em redes públicas.",
  "help.https":
    "HTTPS requer arquivos de certificado e chave (autossinificado via OpenSSL serve). O navegador avisará sobre certificados autossinificados — é esperado.",
  "help.announce_ip":
    "IP reportado aos trackers; vazio para detecção automática. Necessário apenas quando a detecção falha atrás de um IP público.",
  "help.async_io":
    "Threads de E/S de disco assíncrona. 4 para HDDs; aumente em SSD/NVMe para maior throughput.",
  "help.file_pool":
    "Quantos arquivos ficam abertos ao mesmo tempo. Aumente em torrents grandes de muitos arquivos para evitar abrir/fechar repetidamente.",
  "help.network_interface":
    "Vincula o tráfego de torrents a uma placa de rede específica. Em redes multi-NIC/VPN evita que os downloads passem pela VPN; vazio para automático.",
  "help.resolve_countries":
    "Consulta o país de cada par e mostra uma bandeira na lista de pares. Aumenta levemente o tráfego.",
  "help.anonymous":
    "Modo anônimo: desativa conexões de entrada, oculta a impressão do cliente e só comunica via proxy. Reduz muito os pares e a velocidade — apenas para necessidades especiais com um proxy confiável.",
  "help.limit_lan":
    "Aplica os limites a pares da sua rede local. Transferências LAN são rápidas; normalmente deixe desativado.",
} satisfies Dictionary;
