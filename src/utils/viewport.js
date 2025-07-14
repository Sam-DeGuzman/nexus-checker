export function ensureMobileViewport() {
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
} 