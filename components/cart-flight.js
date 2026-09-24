export function animateProductToCart(image, trigger) {
  if (!image || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cart = window.matchMedia('(max-width: 640px)').matches
    ? document.querySelector('.mobile-nav a[href="/cart"]')
    : document.querySelector('.cart-link');
  if (!cart) return;

  const imageRect = image.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const cartRect = cart.getBoundingClientRect();
  const imageVisible = imageRect.bottom > 0 && imageRect.top < window.innerHeight;
  const startX = imageVisible ? imageRect.left + imageRect.width / 2 : triggerRect.left + triggerRect.width / 2;
  const startY = imageVisible ? Math.max(0, Math.min(window.innerHeight, imageRect.top + imageRect.height / 2)) : triggerRect.top + triggerRect.height / 2;
  const endX = cartRect.left + cartRect.width / 2;
  const endY = cartRect.top + cartRect.height / 2;
  const size = 72;
  const flyer = document.createElement('img');
  flyer.src = image.currentSrc || image.src;
  flyer.alt = '';
  flyer.setAttribute('aria-hidden', 'true');
  Object.assign(flyer.style, {
    position: 'fixed', left: `${startX - size / 2}px`, top: `${startY - size / 2}px`,
    width: `${size}px`, height: `${size}px`, objectFit: 'cover', borderRadius: '12px',
    boxShadow: '0 12px 30px rgba(36,39,30,.3)', pointerEvents: 'none', zIndex: '1000'
  });
  document.body.appendChild(flyer);

  const dx = endX - startX;
  const dy = endY - startY;
  const flight = flyer.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * .55}px, ${dy * .55 - 55}px) scale(.72)`, opacity: 1, offset: .55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: .3 }
  ], { duration: 760, easing: 'cubic-bezier(.25,.7,.25,1)', fill: 'forwards' });

  flight.finished.catch(() => {}).then(() => {
    flyer.remove();
    cart.classList.remove('cart-arrival');
    void cart.offsetWidth;
    cart.classList.add('cart-arrival');
    setTimeout(() => cart.classList.remove('cart-arrival'), 550);
  });
}
