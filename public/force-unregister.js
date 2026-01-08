// Script de emergência para desregistrar Service Workers
// Este arquivo força a remoção de todos os Service Workers imediatamente

console.log('%c🚨 DESREGISTRANDO SERVICE WORKERS...', 'color: red; font-size: 16px; font-weight: bold;');

if ('serviceWorker' in navigator) {
  // Desregistra todos os Service Workers imediatamente
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    if (registrations.length === 0) {
      console.log('%c✅ Nenhum Service Worker encontrado', 'color: green; font-size: 14px;');
      return;
    }
    
    console.log(`%c🔄 Encontrados ${registrations.length} Service Worker(s). Desregistrando...`, 'color: orange; font-size: 14px;');
    
    for(let registration of registrations) {
      registration.unregister().then(function(success) {
        if (success) {
          console.log('%c✅ Service Worker desregistrado: ' + registration.scope, 'color: green; font-size: 12px;');
        }
      });
    }
    
    // Limpa todo o cache também
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        if (cacheNames.length > 0) {
          console.log(`%c🗑️ Limpando ${cacheNames.length} cache(s)...`, 'color: orange; font-size: 14px;');
          return Promise.all(
            cacheNames.map(function(cacheName) {
              return caches.delete(cacheName).then(function() {
                console.log('%c✅ Cache removido: ' + cacheName, 'color: green; font-size: 12px;');
              });
            })
          );
        }
      }).then(function() {
        console.log('%c✅ LIMPEZA COMPLETA! Recarregando página em 1 segundo...', 'color: green; font-size: 16px; font-weight: bold;');
        setTimeout(function() {
          window.location.reload(true);
        }, 1000);
      });
    }
  }).catch(function(err) {
    console.error('❌ Erro ao desregistrar Service Workers:', err);
  });
} else {
  console.log('%c⚠️ Service Workers não são suportados neste navegador', 'color: orange; font-size: 14px;');
}







