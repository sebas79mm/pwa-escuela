/*Es el responsable de administrar los recursos almacenados en el cache */
const CACHE_NAME = 'mi-pwa-v1.0'
const APP_SHELL = './'
 
/*
Necesitamos 3 eventos:
* install -> prepara el cache.
* activate -> eliminar versiones antiguas.
* fetch -> interceptar las solicitudes y permitira recuperar los recursos almacenados.
*/
 
/* Instalacion -> install*/
 
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
});

/* Activacion -> activate*/
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(nombres.filter((nombre)=>{
        nombre.startsWith('mi-pwa-') && nombre !== CACHE_NAME;
      }).map((nombre)=> caches.delete(nombre))
    )
    await self.clients.claim();
    })()
  );
});

/* Interceptar las solicitudes -> fetch*/
self.addEventListener('fetch', (event) => {
  // Solo vamos a interceptar solicitudes web del mismo origen
    if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return

    event.respondWith(
      fetch(event.request).then((response) => {
        // Si la respuesta es correcta, la almacenamos en cache
        if (response.ok) {
          const copia = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copia)
          }).catch(console.error)
        }
        return response
      }).catch(async () => {
        const respuesta = await caches.match(event.request)
        if (respuesta) return respuesta
        return Response.error()
      }
    ))
})