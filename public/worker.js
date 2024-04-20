const cacheName = 'v2'

const cacheClone = async (e) => {
  const res = await fetch(e.request)

  // Make a clone of the response if it's from the same origin
  if (e.request.url.startsWith(window.location.origin)) {
    const resClone = res.clone()

    const cache = await caches.open(cacheName)
    await cache.put(e.request, resClone)
  }
  return res
}

const fetchEvent = () => {
  self.addEventListener('fetch', (e) => {
    e.respondWith(
      cacheClone(e)
        .catch((err) => {
          console.debug(err)
          caches.match(e.request)
        })
        .then((res) => res),
    )
  })
}

fetchEvent()
