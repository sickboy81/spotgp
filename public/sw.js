// Service Worker para PWA
// Versão do cache - incrementar quando houver mudanças significativas
const CACHE_NAME = 'acompanhantes-agora-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Recursos estáticos para cache inicial
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[Service Worker] Error caching static assets:', error);
      })
  );
  
  // Força a ativação imediata do novo service worker
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Verifica se está em localhost e se auto-desregistra
      self.clients.matchAll().then((clients) => {
        const isLocalhost = clients.some((client) => {
          try {
            const url = new URL(client.url);
            return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
          } catch (e) {
            return false;
          }
        });
        
        if (isLocalhost) {
          console.log('[Service Worker] Detectado localhost - auto-desregistrando...');
          return self.registration.unregister().then(() => {
            console.log('[Service Worker] Desregistrado com sucesso');
          });
        }
        return Promise.resolve();
      }),
      
      // Remove caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
    ])
  );
  
  // Assume controle imediato de todas as páginas
  return self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Em desenvolvimento (localhost), NÃO intercepta NENHUMA requisição
  // Deixa tudo passar direto para o servidor de desenvolvimento do Vite
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    // Não intercepta nada em desenvolvimento - deixa o Vite lidar com tudo
    return;
  }

  // Ignora requisições de extensões do Chrome e outros protocolos não suportados
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'chrome:' ||
      (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    // Não intercepta essas requisições
    return;
  }

  // Ignora requisições para APIs externas e Supabase
  if (url.origin.includes('supabase.co') || 
      url.origin.includes('nominatim') ||
      url.origin.includes('googleapis') ||
      url.origin.includes('fonts.gstatic')) {
    // Network only para APIs - não intercepta
    return;
  }

  // Estratégia: Cache First para assets estáticos, Network First para páginas
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Se é um asset estático (CSS, JS, imagens), usa cache primeiro
        if (request.destination === 'style' || 
            request.destination === 'script' ||
            request.destination === 'image' ||
            request.destination === 'font') {
          if (cachedResponse) {
            return cachedResponse;
          }
          
              return fetch(request)
            .then((response) => {
              // Verifica se a resposta é válida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clona a resposta para cache
              const responseToCache = response.clone();

              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  // Verifica se a request é válida antes de cachear
                  if (request.url && request.url.startsWith('http')) {
                    try {
                      cache.put(request, responseToCache);
                    } catch (error) {
                      console.warn('[Service Worker] Erro ao cachear:', error);
                    }
                  }
                })
                .catch((error) => {
                  console.warn('[Service Worker] Erro ao abrir cache:', error);
                });

              return response;
            })
            .catch((error) => {
              console.warn('[Service Worker] Erro ao buscar recurso:', error);
              // Se falhar e for uma imagem, retorna uma imagem placeholder
              if (request.destination === 'image') {
                return new Response('', { status: 404 });
              }
              // Para outros recursos, retorna erro
              throw error;
            });
        }

        // Para páginas HTML, usa Network First
        if (request.destination === 'document' || request.mode === 'navigate') {
          return fetch(request)
            .then((response) => {
              // Se a rede funcionou, atualiza o cache
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    // Verifica se a request é válida antes de cachear
                    if (request.url && request.url.startsWith('http')) {
                      try {
                        cache.put(request, responseToCache);
                      } catch (error) {
                        console.warn('[Service Worker] Erro ao cachear página:', error);
                      }
                    }
                  })
                  .catch((error) => {
                    console.warn('[Service Worker] Erro ao abrir cache:', error);
                  });
              }
              return response;
            })
            .catch(() => {
              // Se a rede falhar, tenta o cache
              if (cachedResponse) {
                return cachedResponse;
              }
              // Se não houver cache, retorna página offline
              return caches.match('/index.html');
            });
        }

        // Para outros recursos, tenta cache primeiro
        return cachedResponse || fetch(request);
      })
  );
});

// Mensagens do cliente (para atualizações)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


