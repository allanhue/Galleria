self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const fallbackIcon = '/favicon.ico'
  event.waitUntil(
    self.registration.showNotification(data.title || 'Galleria', {
      body: data.body || 'You have a new notification',
      icon: fallbackIcon,
      badge: fallbackIcon,
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})