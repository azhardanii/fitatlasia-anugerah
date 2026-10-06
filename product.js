(() => {
  const root = document.querySelector('.product-stage');
  const products = window.FIT_ATLASIA_PRODUCTS || [];
  if (!root || !products.length) return;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const gsapReady = !!window.gsap;

  const imageBase = 'fitatlasia.untukmu.site/wp-content/uploads/2026/10/';
  const imageSrc = sku => {
    // Use HTTPS when this page is HTTPS to avoid mixed-content blocking.
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${imageBase}${sku}.webp`;
  };

  const seriesPalette = {
    IF:  ['#0c1014', '#171c21', 'rgba(227,6,19,.38)'],
    IFP: ['#0c0d0f', '#1a1516', 'rgba(227,6,19,.34)'],
    FE:  ['#111212', '#202224', 'rgba(255,255,255,.13)'],
    ECP: ['#0b1014', '#182025', 'rgba(227,6,19,.33)'],
    AC:  ['#090b0d', '#181b1e', 'rgba(220,223,226,.15)'],
    PS:  ['#110a0c', '#211114', 'rgba(227,6,19,.46)'],
    RE:  ['#0b1012', '#1b2328', 'rgba(213,221,226,.14)'],
    IT:  ['#0c0d10', '#1b1718', 'rgba(255,38,52,.34)']
  };

  const titleLines = [
    ['Equip the', 'movement.'],
    ['Build the', 'facility.'],
    ['Designed for', 'the room.'],
    ['Move with', 'purpose.']
  ];

  const els = {
    imageA: $('#productImageA'),
    imageB: $('#productImageB'),
    layerA: $('#productLayerA'),
    layerB: $('#productLayerB'),
    stack: $('#productStack'),
    title: $('.product-title'),
    skuTitle: $('#productTitleSku'),
    series: $('#productSeries'),
    description: $('#productDescription'),
    number: $('#productNumber'),
    stageSku: $('#stageSku'),
    stageSeries: $('#stageSeriesSmall'),
    waBtn: $('#productWaBtn'),
    quote: $('#requestQuote'),
    nextImg: $('#nextImage'),
    nextSku: $('#nextSku'),
    peek: $('#nextPeek'),
    peekBtn: $('#nextPeekButton'),
    scrollHint: $('#scrollHint'),
    status: $('#productStatus'),
    glowA: $('.product-glow-a'),
    glowB: $('.product-glow-b'),
    visual: $('#productVisual'),
    navIndex: $('.product-nav-index > span:nth-child(2)')
  };

  let current = 0;
  let activeLayer = 'A';
  let busy = false;
  let lastGestureAt = 0;
  let wheelAccum = 0;
  let touchStartY = 0;
  let touchActive = false;
  let introPlayed = false;

  function paletteFor(item) {
    return seriesPalette[item.series] || ['#090b0d', '#171a1d', 'rgba(227,6,19,.33)'];
  }

  function nextIndex(i) { return (i + 1) % products.length; }
  function prevIndex(i) { return (i - 1 + products.length) % products.length; }

  function getWaLink(item) {
    const text = `Halo Admin Fit Atlasia, saya tertarik dengan produk ${item.sku} (Seri ${item.series}). Mohon info detail spesifikasi, harga, dan ketersediaan stoknya. Terima kasih.`;
    return `https://wa.me/6287719790910?text=${encodeURIComponent(text)}`;
  }

  function setText(item, index) {
    const lines = titleLines[index % titleLines.length];
    if (els.series) els.series.textContent = `SERIES ${item.series}`;
    if (els.skuTitle) els.skuTitle.textContent = item.sku;
    if (els.number) els.number.textContent = `${String(index + 1).padStart(2, '0')} / ${String(products.length).padStart(2, '0')}`;
    if (els.stageSku) els.stageSku.textContent = item.sku;
    if (els.stageSeries) els.stageSeries.textContent = item.series;
    if (els.navIndex) els.navIndex.textContent = String(index + 1).padStart(2, '0');
    if (els.waBtn) els.waBtn.href = getWaLink(item);
    if (els.quote) els.quote.href = `contact.html?product=${encodeURIComponent(item.sku)}`;

    if (els.title) {
      els.title.innerHTML = `${lines[0]}<br><span>${lines[1]}</span>`;
    }

    if (els.description) {
      els.description.textContent = `Unit komersial ${item.sku} dari seri ${item.series} dirancang dengan ketahanan tinggi, material heavy-duty, dan biomekanika ergonomis untuk menunjang performa optimal fasilitas fitness Anda.`;
    }

    const nextItem = products[nextIndex(index)];
    if (els.nextImg) {
      setLayerImage(els.nextImg, nextItem.sku, true);
      els.nextImg.alt = `Next FIT ATLASIA equipment ${nextItem.sku}`;
    }
    if (els.nextSku) {
      els.nextSku.textContent = nextItem.sku;
    }

    document.title = `${item.sku} | FIT ATLASIA`;
    const params = new URLSearchParams(window.location.search);
    params.set('sku', item.sku);
    const query = params.toString();
    history.replaceState(null, '', `${window.location.pathname}?${query}`);
  }

  function setPalette(item, animate = true) {
    const [a, b, glow] = paletteFor(item);
    if (gsapReady && animate && !prefersReducedMotion) {
      gsap.to(root, {
        '--bg-a': a,
        '--bg-b': b,
        '--glow': glow,
        duration: .72,
        ease: 'power3.out'
      });
      gsap.to(els.glowA, {opacity: .5, duration: .45, ease: 'power2.out'});
    } else {
      root.style.setProperty('--bg-a', a);
      root.style.setProperty('--bg-b', b);
      root.style.setProperty('--glow', glow);
    }
  }

  function preload(src) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    return img;
  }

  function warmAround(index) {
    preload(imageSrc(products[nextIndex(index)].sku));
    preload(imageSrc(products[prevIndex(index)].sku));
  }

  function setLayerImage(img, sku, eager = false) {
    if (!img) return;
    const src = imageSrc(sku);
    img.alt = `FIT ATLASIA equipment ${sku}`;
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.src = src;
  }

  function animateContent(direction) {
    if (!gsapReady || prefersReducedMotion) return;
    const copyItems = [els.series, els.title, els.skuTitle, els.description, els.waBtn, els.quote].filter(Boolean);
    const metaItems = [els.number, els.stageSku, els.stageSeries].filter(Boolean);
    const sign = direction > 0 ? 1 : -1;

    gsap.timeline()
      .to(copyItems, {y: -14 * sign, opacity: 0, duration: .2, stagger: .015, ease: 'power2.in'}, 0)
      .to(metaItems, {y: -8 * sign, opacity: 0, duration: .14, stagger: .015, ease: 'power2.in'}, 0)
      .set(copyItems, {y: 14 * sign})
      .set(metaItems, {y: 8 * sign})
      .to(copyItems, {y: 0, opacity: 1, duration: .42, stagger: .04, ease: 'power3.out'}, .22)
      .to(metaItems, {y: 0, opacity: 1, duration: .34, stagger: .03, ease: 'power3.out'}, .26);
  }

  function animateProduct(direction, targetIndex) {
    if (busy) return;
    busy = true;
    root.classList.add('is-transitioning');

    const item = products[targetIndex];
    const oldLayer = activeLayer === 'A' ? els.layerA : els.layerB;
    const newLayer = activeLayer === 'A' ? els.layerB : els.layerA;
    const newImage = newLayer.querySelector('img');
    const oldImage = oldLayer.querySelector('img');
    const sign = direction > 0 ? 1 : -1;

    if (gsapReady) {
      gsap.killTweensOf([els.layerA, els.layerB, oldLayer, newLayer, oldImage, newImage]);
    }

    setLayerImage(newImage, item.sku, true);
    setPalette(item, true);
    setText(item, targetIndex);
    animateContent(direction);

    const finish = () => {
      oldLayer.classList.remove('active');
      oldLayer.style.opacity = '0';
      oldLayer.style.transform = 'translate3d(0,0,0)';
      newLayer.classList.add('active');
      newLayer.style.opacity = '1';
      newLayer.style.transform = 'translate3d(0,0,0)';
      if (newImage) newImage.style.transform = 'translate3d(0,0,0)';
      if (oldImage) oldImage.style.transform = 'translate3d(0,0,0)';
      activeLayer = activeLayer === 'A' ? 'B' : 'A';
      current = targetIndex;
      root.classList.remove('is-transitioning');
      busy = false;
      warmAround(current);
    };

    if (!gsapReady || prefersReducedMotion) {
      finish();
      return;
    }

    gsap.set(newLayer, {
      opacity: 0,
      xPercent: 12 * sign,
      scale: 0.96,
      clearProps: 'filter'
    });

    const tl = gsap.timeline({ onComplete: finish });

    tl.to(oldLayer, {
      opacity: 0,
      xPercent: -12 * sign,
      scale: 0.96,
      duration: 0.36,
      ease: 'power2.inOut'
    }, 0)
    .to(newLayer, {
      opacity: 1,
      xPercent: 0,
      scale: 1,
      duration: 0.46,
      ease: 'power3.out'
    }, 0.08);

    if (els.peek) {
      tl.to(els.peek, {
        x: direction > 0 ? 8 : -8,
        duration: 0.16,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out'
      }, 0.1);
    }
  }

  function navigate(direction) {
    if (busy) return;
    const next = direction > 0 ? nextIndex(current) : prevIndex(current);
    animateProduct(direction, next);
    if (!introPlayed) {
      introPlayed = true;
      if (els.scrollHint && gsapReady) gsap.to(els.scrollHint, {opacity: 0, duration: .25, y: 8});
    }
  }

  function getInitialIndex() {
    const sku = new URLSearchParams(window.location.search).get('sku');
    const idx = products.findIndex(item => item.sku.toLowerCase() === String(sku || '').toLowerCase());
    return idx >= 0 ? idx : 0;
  }

  function setInitial() {
    current = getInitialIndex();
    const item = products[current];
    const next = products[nextIndex(current)];

    setText(item, current);
    setPalette(item, false);
    setLayerImage(els.imageA, item.sku, true);
    setLayerImage(els.imageB, next.sku, true);
    if (els.nextImg) {
      setLayerImage(els.nextImg, next.sku, true);
      els.nextImg.alt = `Next FIT ATLASIA equipment ${next.sku}`;
    }
    if (els.nextSku) els.nextSku.textContent = next.sku;

    els.layerA.classList.add('active');
    els.layerA.style.opacity = '1';
    els.layerA.style.transform = 'translate3d(0,0,0)';
    els.layerB.classList.remove('active');
    els.layerB.style.opacity = '0';
    els.layerB.style.transform = 'translate3d(0,0,0)';

    if (gsapReady && !prefersReducedMotion) {
      const copyElements = [els.series, els.title, els.skuTitle, els.description, els.waBtn, els.quote].filter(Boolean);
      gsap.set([...copyElements, els.number, els.stageSku, els.stageSeries], {opacity: 0, y: 14});
      gsap.timeline({delay: .12})
        .to(copyElements, {opacity: 1, y: 0, duration: .65, stagger: .05, ease: 'power3.out'})
        .to([els.number, els.stageSku, els.stageSeries], {opacity: 1, y: 0, duration: .42, stagger: .04, ease: 'power3.out'}, .3)
        .fromTo(els.layerA, {opacity: 0, scale: .95}, {opacity: 1, scale: 1, duration: .75, ease: 'power3.out'}, .05)
        .fromTo(els.peek, {opacity: 0, x: 28}, {opacity: 1, x: 0, duration: .5, ease: 'power3.out'}, .5)
        .fromTo(els.scrollHint, {opacity: 0, y: 8}, {opacity: 1, y: 0, duration: .45, ease: 'power2.out'}, .65);
    }
    warmAround(current);
  }

  // Wheel: the page never scrolls. Each deliberate gesture advances one product.
  function onWheel(event) {
    event.preventDefault();
    if (busy) return;

    const now = performance.now();
    wheelAccum += event.deltaY;
    if (Math.abs(wheelAccum) < 28) return;
    if (now - lastGestureAt < 480) return;

    const direction = wheelAccum > 0 ? 1 : -1;
    wheelAccum = 0;
    lastGestureAt = now;
    navigate(direction);
  }

  function onTouchStart(event) {
    if (event.target.closest('a,button')) {
      touchActive = false;
      return;
    }
    touchActive = true;
    touchStartY = event.touches[0].clientY;
  }

  function onTouchMove(event) {
    if (!touchActive) return;
    event.preventDefault();
  }

  function onTouchEnd(event) {
    if (!touchActive) return;
    touchActive = false;
    const endY = event.changedTouches[0]?.clientY ?? touchStartY;
    const delta = touchStartY - endY;
    if (Math.abs(delta) < 45) return;
    navigate(delta > 0 ? 1 : -1);
  }

  // Subtle pointer-driven tilt centered on the stage
  let mouseX = 0, mouseY = 0;
  if (canHover && !prefersReducedMotion && els.visual && els.stack) {
    const setX = gsapReady ? gsap.quickTo(els.stack, 'rotationY', {duration: .6, ease: 'power3.out'}) : null;
    const setY = gsapReady ? gsap.quickTo(els.stack, 'rotationX', {duration: .6, ease: 'power3.out'}) : null;

    els.visual.addEventListener('pointermove', event => {
      const rect = els.visual.getBoundingClientRect();
      mouseX = (event.clientX - rect.left) / rect.width - .5;
      mouseY = (event.clientY - rect.top) / rect.height - .5;
      if (setX) {
        setX(mouseX * 3.5);
        setY(-mouseY * 3);
      }
    }, {passive: true});

    els.visual.addEventListener('pointerleave', () => {
      if (setX) { setX(0); setY(0); }
    }, {passive: true});
  }

  $('#productPrev')?.addEventListener('click', () => navigate(-1));
  $('#productNext')?.addEventListener('click', () => navigate(1));
  els.peekBtn?.addEventListener('click', () => navigate(1));

  window.addEventListener('wheel', onWheel, {passive: false});
  root.addEventListener('touchstart', onTouchStart, {passive: false});
  root.addEventListener('touchmove', onTouchMove, {passive: false});
  root.addEventListener('touchend', onTouchEnd, {passive: false});

  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') {
      event.preventDefault();
      navigate(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      navigate(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      if (!busy) animateProduct(-1, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      if (!busy) animateProduct(1, products.length - 1);
    }
  });

  // Keep the URL stable without adding history entries while the visitor explores.
  window.addEventListener('popstate', () => {
    if (busy) return;
    const idx = getInitialIndex();
    if (idx !== current) animateProduct(idx > current ? 1 : -1, idx);
  });

  setInitial();
})();
