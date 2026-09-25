// Settings help tooltips (help.* keys) — beginner-friendly explanations from the qBT docs.
import type { Dictionary } from "@/i18n/types";

export default {
  "help.scope_pause_resume":
    "Sin selección, actúa sobre todos los torrents que coinciden con el filtro actual; con selección, solo sobre los torrents seleccionados.",
  "help.create_subfolder":
    "Los torrents con varios archivos se guardan en una subcarpeta con el nombre del torrent, manteniendo ordenada tu carpeta. Los de un solo archivo no se ven afectados.",
  "help.auto_delete_mode":
    'Controla qué ocurre con el archivo .torrent original al eliminar un torrent: "No eliminar nunca" solo borra la tarea; "Eliminar si existe" también borra el .torrent.',
  "help.preallocate":
    "Reserva en disco el tamaño completo del archivo antes de descargar: reduce la fragmentación y detecta pronto la falta de espacio. No aporta en SSD; recomendado en HDD.",
  "help.incomplete_ext":
    "Los archivos incompletos reciben el sufijo .!qB para no confundirlos con los terminados. El sufijo se quita automáticamente al completarse.",
  "help.auto_tmm":
    "Gestión automática de torrents: las rutas de guardado siguen los ajustes de categoría y los archivos se mueven al cambiar la categoría. Desactívalo para controlar las rutas manualmente.",
  "help.save_path":
    "Carpeta por defecto para los torrents nuevos. Se puede cambiar al añadir o más tarde.",
  "help.add_stopped":
    "Los torrents nuevos se añaden en pausa y no descargan hasta que los reanudes. Útil para revisar primero la selección de archivos y prioridades.",
  "help.export_dir":
    "Guarda una copia del .torrent de cada tarea añadida en esta carpeta; práctico para copias de seguridad o migrar a otro cliente.",
  "help.temp_path":
    "Las descargas incompletas se guardan aquí y se mueven a la ruta de guardado al terminar. Mantenla en el mismo disco para evitar movimientos lentos.",
  "help.autorun":
    "Ejecuta un comando al completar un torrent. Variables: %N nombre, %F ruta de guardado, %R ruta raíz, %L categoría, %I hash. Se ejecuta en el servidor de qBittorrent.",
  "help.listen_port":
    'El puerto que usan los demás pares para conectarse a ti — tu "número de puerta". Redirígelo en tu router (o activa UPnP) para mejorar mucho la conectividad y velocidad.',
  "help.random_port":
    "Usa un puerto de escucha aleatorio en cada inicio. Desactívalo si configuraste una redirección fija en el router.",
  "help.upnp":
    "Pide al router que abra automáticamente el puerto de escucha mediante UPnP/NAT-PMP, sin redirección manual. Algunos routers antiguos no lo soportan bien.",
  "help.max_connec":
    "Conexiones totales máximas entre todos los torrents. Muy bajo limita la velocidad; muy alto satura el router. Entre 200 y 500 va bien en conexiones domésticas.",
  "help.max_connec_per_torrent":
    "Conexiones máximas de un solo torrent. Más alto para torrents populares; el valor por defecto basta para los raros.",
  "help.max_uploads":
    "Ranuras globales de subida: a cuántos pares puedes enviar datos a la vez. Súbelo si siembras mucho.",
  "help.proxy":
    "Enruta el tráfico por un servidor proxy. SOCKS5 es el más capaz (admite conexiones de pares); los proxy HTTP solo sirven en algunos escenarios.",
  "help.proxy_peers":
    "También enruta las conexiones entre pares por el proxy. Desactivado, solo los anuncios al tracker y las peticiones web usan el proxy.",
  "help.proxy_torrents_only":
    "Solo el tráfico de torrents usa el proxy; las peticiones al tracker y las comprobaciones de actualización conectan directamente.",
  "help.global_limit":
    'Límite global de descarga de todos los torrents. 0 significa ilimitado. Usa el interruptor de "velocidad alternativa" de la barra de estado para un límite temporal rápido.',
  "help.scheduler":
    "Activa automáticamente los límites alternativos durante la franja configurada, p. ej. reducir cada noche en horas punta.",
  "help.limit_utp":
    "Aplica los límites a las conexiones μTP. μTP ya cede automáticamente cuando la red está ocupada; normalmente no hace falta activarlo.",
  "help.limit_overhead":
    "Cuenta la sobrecarga del protocolo BitTorrent (negociaciones, etc.) dentro de los límites, haciéndolos más estrictos en la práctica.",
  "help.limit_lan_peers":
    "Aplica los límites a los pares de tu red local. Las transferencias LAN son rápidas; normalmente déjalo desactivado.",
  "help.dht":
    "Tabla hash distribuida: encuentra pares sin servidor tracker — la base de los enlaces magnet. Debe desactivarse en trackers privados (PT) o tu cuenta puede ser baneada.",
  "help.pex":
    "Intercambio de pares: descubre más pares a partir de los ya conectados. Los sitios de tracker privado (PT) también exigen desactivarlo.",
  "help.lsd":
    "Descubrimiento local de servicios: encuentra y conecta automáticamente con otros usuarios de qBittorrent de tu misma LAN sin pasar por internet.",
  "help.encryption":
    'El cifrado de protocolo ofusca el tráfico BitTorrent y puede sortear la limitación del proveedor. "Preferir" mantiene compatibilidad; "Exigir" puede fallar con pares sin soporte.',
  "help.anonymous_mode":
    "Desactiva las conexiones entrantes, oculta la huella del cliente y solo habla a través de un proxy. Reduce notablemente pares y velocidad — solo para casos especiales con un proxy de confianza.",
  "help.utp":
    "μTP cede automáticamente cuando tu red está congestionada, de modo que las descargas no molestan a la navegación o los juegos; TCP es más agresivo. Por defecto usa ambos.",
  "help.queueing":
    "Limita cuántas descargas/siembras corren a la vez; el resto espera en cola para no repartir el ancho de banda en exceso entre muchas tareas.",
  "help.max_active_downloads":
    "Cuántos torrents descargan a la vez; el resto queda en cola. 3–5 es un buen punto de partida salvo que tengas mucho ancho de banda.",
  "help.slow_torrents":
    "Los torrents lentos (por debajo de los umbrales de velocidad/actividad) no ocupan huecos activos, así que un torrent atascado no bloquea la cola.",
  "help.max_ratio":
    "Proporción = subido ÷ descargado; 1.0 significa que has subido tanto como descargaste. Al alcanzarla se aplica la acción de abajo. Usuarios de PT: sigue las reglas de tu sitio.",
  "help.max_seeding_time":
    "Detiene o elimina tras sembrar estos minutos. Se activa cuando se cumple la condición de proporción o de tiempo.",
  "help.add_trackers":
    "Añade esta lista de trackers públicos a cada torrent nuevo como fuentes extra cuando los integrados fallan. No afecta a torrents privados (PT). Una URL por línea.",
  "help.rss_processing":
    "Recupera todos los canales RSS periódicamente para refrescar los artículos. Desactívalo para detener la actualización automática.",
  "help.rss_auto":
    "Se usa con las reglas de descarga RSS: los torrents coincidentes se añaden automáticamente — genial para seguir series.",
  "help.repack":
    "También descarga relanzamientos REPACK/PROPER (versiones corregidas del mismo episodio). Desactivado, solo se obtiene el primer lanzamiento.",
  "help.session_timeout":
    "Segundos de inactividad antes de que la sesión expire y tengas que volver a iniciar sesión.",
  "help.csrf":
    "Evita la falsificación de peticiones entre sitios: impide que páginas maliciosas manejen qBittorrent con tu sesión. Los proxies inversos/dev pueden verse bloqueados — desactívalo temporalmente en ese caso.",
  "help.host_validation":
    "Comprueba la cabecera HTTP Host para que la interfaz web no sea accesible desde dominios inesperados. Si recibes 401 con credenciales correctas tras un proxy, prueba a desactivarlo.",
  "help.clickjacking":
    "Impide que esta página se incruste en iframes de otros sitios (protección clickjacking).",
  "help.secure_cookie":
    "Envía la cookie de sesión solo por HTTPS. No lo actives sin HTTPS o no podrás iniciar sesión.",
  "help.domain_list":
    "Lista blanca de dominios con acceso a la interfaz web, separados por comas. * permite todos. Se usa junto a la validación de cabecera Host.",
  "help.bypass_local": "Omite el inicio de sesión para peticiones desde localhost (127.0.0.1).",
  "help.bypass_subnet":
    "Omite el inicio de sesión para subredes de la lista blanca, p. ej. tu LAN doméstica. Cuidado: cualquier paquete que suplante esas direcciones también entra sin autenticar — evítalo en redes públicas.",
  "help.https":
    "HTTPS requiere un certificado y una clave (uno autofirmado con OpenSSL sirve). El navegador avisará de los certificados autofirmados — es lo esperado.",
  "help.announce_ip":
    "IP notificada a los trackers; vacío para autodetección. Solo hace falta cuando la detección falla tras una IP pública.",
  "help.async_io":
    "Hilos de E/S de disco asíncrona. 4 para HDD; súbelo en SSD/NVMe para mayor rendimiento.",
  "help.file_pool":
    "Cuántos archivos se mantienen abiertos a la vez. Súbelo con torrents grandes de muchos archivos para evitar abrir/cerrar constantemente.",
  "help.network_interface":
    "Vincula el tráfico de torrents a una tarjeta de red concreta. En redes multi-NIC/VPN evita que las descargas pasen por la VPN; vacío para automático.",
  "help.resolve_countries":
    "Consulta el país de cada par y muestra una bandera en la lista de pares. Aumenta ligeramente el tráfico.",
  "help.anonymous":
    "Modo anónimo: desactiva las conexiones entrantes, oculta la huella del cliente y solo habla a través de un proxy. Reduce notablemente pares y velocidad — solo para casos especiales con un proxy de confianza.",
  "help.limit_lan":
    "Aplica los límites a los pares de tu red local. Las transferencias LAN son rápidas; normalmente déjalo desactivado.",
} satisfies Dictionary;
