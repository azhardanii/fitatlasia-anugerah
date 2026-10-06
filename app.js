(() => {
  document.documentElement.classList.add('js-enabled');

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- global UI ---
  const progress = $('.progress');
  const onScroll = () => {
    if (!progress) return;
    const h = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = `${Math.min(100, (window.scrollY / h) * 100)}%`;
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  const cursor = $('#cursor');
  if (cursor && !prefersReducedMotion && matchMedia('(pointer:fine)').matches) {
    let x = innerWidth / 2, y = innerHeight / 2;
    window.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; });
    const tickCursor = () => {
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      requestAnimationFrame(tickCursor);
    };
    tickCursor();
    $$('a,button,.product-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  }

  const menuToggle = $('.menu-toggle');
  const mobilePanel = $('.mobile-panel');
  menuToggle?.addEventListener('click', () => {
    const open = mobilePanel?.classList.toggle('open');
    document.body.classList.toggle('no-scroll', !!open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('.mobile-panel a').forEach(a => a.addEventListener('click', () => {
    mobilePanel?.classList.remove('open');
    document.body.classList.remove('no-scroll');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('.site-menu a,.mobile-panel a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('?')[0].split('#')[0].toLowerCase();
    const active = href === current || (current === '' && href === 'index.html');
    if (active) a.classList.add('active');
  });

  // --- GSAP helpers ---
  const hasGSAP = !!window.gsap;
  if (hasGSAP) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    if (!prefersReducedMotion) {
      gsap.utils.toArray('.reveal').forEach(el => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: window.ScrollTrigger ? {trigger: el, start: 'top 86%', once: true} : undefined
        });
      });

      gsap.utils.toArray('.home-image img').forEach(img => {
        gsap.fromTo(img, {yPercent:-7, scale:1.08}, {
          yPercent:7, scale:1,
          ease:'none',
          scrollTrigger: {trigger: img.closest('.home-image'), start:'top bottom', end:'bottom top', scrub:1}
        });
      });

      const heroCopy = $('.home-hero .copy');
      if (heroCopy && window.ScrollTrigger) {
        gsap.to(heroCopy, {
          y:-100,
          opacity:.28,
          ease:'none',
          scrollTrigger:{trigger:'.home-hero',start:'top top',end:'bottom top',scrub:1}
        });
      }

      const orbit = $('.orbit');
      if (orbit) gsap.to(orbit, {rotation:360, duration:45, ease:'none', repeat:-1});

      const heroContent = $('.page-hero .page-grid');
      if (heroContent) gsap.from(heroContent.children,{y:50,opacity:0,stagger:.12,duration:1,ease:'power3.out'});
    }
  }

  // --- Home Three.js scene: lightweight + paused outside viewport ---
  const mount = document.getElementById('machineScene');
  if (mount && window.THREE && !prefersReducedMotion) {
    let active = false;
    const observer = new IntersectionObserver(entries => {
      active = entries[0]?.isIntersecting ?? false;
    }, {threshold:0.05});
    observer.observe(mount);

    const width = () => mount.clientWidth || 800;
    const height = () => mount.clientHeight || 600;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width()/height(), .1, 100);
    camera.position.set(6.3, 3.5, 9.4);
    const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width(),height(),false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff,0x26282b,2.0));
    const key = new THREE.DirectionalLight(0xffffff,4.0); key.position.set(5,8,6); scene.add(key);
    const red = new THREE.PointLight(0xe30613,18,18); red.position.set(-4,3,4); scene.add(red);

    const matBlack = new THREE.MeshStandardMaterial({color:0x111315,metalness:.88,roughness:.2});
    const matRed = new THREE.MeshStandardMaterial({color:0xe30613,metalness:.58,roughness:.24});
    const matSteel = new THREE.MeshStandardMaterial({color:0x9da3aa,metalness:.94,roughness:.18});
    const matPad = new THREE.MeshStandardMaterial({color:0x22262a,metalness:.2,roughness:.72});

    const group = new THREE.Group();
    scene.add(group);
    const box = (sx,sy,sz,x,y,z,mat) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat); o.position.set(x,y,z); group.add(o); return o; };
    const cyl = (r,h,x,y,z,mat) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,28),mat); o.position.set(x,y,z); o.rotation.z=Math.PI/2; group.add(o); return o; };

    box(.28,4.5,.28,-2.2,.05,0,matBlack); box(.28,4.5,.28,2.2,.05,0,matBlack);
    box(4.6,.28,.28,0,2.05,0,matBlack); box(3.5,.22,.45,0,-1.35,0,matRed);
    box(3.1,.34,1.05,0,-2.15,0,matPad); box(1.1,.15,1.6,0,.78,.1,matPad);
    box(1.15,.18,.18,0,1.05,.92,matRed); box(.5,1.7,.5,-1.1,-.4,0,matBlack); box(.5,1.7,.5,1.1,-.4,0,matBlack);
    cyl(.62,.28,0,.35,-.48,matRed); cyl(.36,.52,0,.35,-.74,matSteel);
    for(let i=0;i<6;i++) box(.14,.14,.8,-.7+i*.28,0.85,.55,matSteel);
    group.position.y = .1;

    let tx=0,ty=0;
    mount.addEventListener('pointermove', e => {
      const r = mount.getBoundingClientRect();
      tx = (e.clientX-r.left)/r.width-.5;
      ty = (e.clientY-r.top)/r.height-.5;
    });
    mount.addEventListener('pointerleave',()=>{tx=0;ty=0});

    const resize = () => {
      camera.aspect = width()/height(); camera.updateProjectionMatrix(); renderer.setSize(width(),height(),false);
    };
    window.addEventListener('resize',resize,{passive:true});

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      if (!active) return;
      time += .012;
      group.rotation.y = time * .28;
      group.rotation.x += (ty*.18 - group.rotation.x)*.035;
      group.rotation.z += (-tx*.08 - group.rotation.z)*.035;
      renderer.render(scene,camera);
    };
    animate();
  }

  // --- Contact form UX: Auto-format to WhatsApp Admin ---
  const form = $('#contactForm');
  if (form) {
    const params = new URLSearchParams(location.search);
    const product = params.get('product');
    if (product) {
      const brief = $('textarea[name="brief"]', form);
      if (brief && !brief.value) brief.value = `Saya ingin berkonsultasi mengenai pengadaan unit ${product}.`;
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const status = $('#formStatus');
      const submit = $('.submit-btn', form);

      const name = (form.name?.value || '').trim();
      const email = (form.email?.value || '').trim();
      const company = (form.company?.value || '').trim();
      const projectSelect = form.project;
      const facilityType = projectSelect ? (projectSelect.options[projectSelect.selectedIndex]?.text || projectSelect.value) : '-';
      const locationVal = (form.location?.value || '').trim();
      const brief = (form.brief?.value || '').trim();

      const lines = [
        'Halo Admin Fit Atlasia, saya ingin berkonsultasi mengenai project fasilitas fitness:',
        '',
        '*DETAIL PROJECT CONSULTATION*',
        `• Nama: ${name}`,
        `• Email: ${email}`,
        `• Perusahaan / Fasilitas: ${company || '-'}`,
        `• Tipe Fasilitas: ${facilityType}`,
        `• Lokasi Project: ${locationVal || '-'}`,
        '',
        '*PROJECT BRIEF & KEBUTUHAN*',
        brief,
        '',
        'Mohon informasi dan estimasi pengadaan alat dari tim konsultan Fit Atlasia. Terima kasih!'
      ];

      const messageText = lines.join('\n');
      const waNumber = '6287719790910';
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(messageText)}`;

      if (status) {
        status.textContent = 'Membuka WhatsApp untuk mengirim rincian konsultasi ke Admin Fit Atlasia...';
        status.classList.add('show');
      }

      if (submit) {
        const originalText = submit.textContent;
        submit.textContent = 'Membuka WhatsApp... ↗';
        setTimeout(() => {
          submit.textContent = originalText;
        }, 3500);
      }

      const opened = window.open(waUrl, '_blank');
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        window.location.href = waUrl;
      }
    });
  }

  // --- Smart Section Scroll Controller (Immersive 100vh transitions) ---
  if (!document.body.classList.contains('product-immersive')) {
    const sections = Array.from(document.querySelectorAll('.page-section'));
    if (sections.length > 0) {
      let isAnimating = false;
      let currentIndex = 0;
      let animTimeout = null;

      // Build floating dot navigation
      const nav = document.createElement('nav');
      nav.className = 'section-nav';
      nav.setAttribute('aria-label', 'Section navigation');
      sections.forEach((sec, idx) => {
        const btn = document.createElement('button');
        btn.className = 'section-nav-dot' + (idx === 0 ? ' active' : '');
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-label', `Navigate to section ${idx + 1}`);
        btn.addEventListener('click', () => {
          goToSection(idx);
        });
        nav.appendChild(btn);
      });
      document.body.appendChild(nav);

      const dots = Array.from(nav.querySelectorAll('.section-nav-dot'));

      const updateActiveDot = (idx) => {
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === idx);
        });
      };

      const getSectionIndex = () => {
        const scrollY = window.scrollY;
        const vh = window.innerHeight;
        const center = scrollY + vh * 0.45;
        for (let i = 0; i < sections.length; i++) {
          const top = sections[i].offsetTop;
          const bottom = top + sections[i].offsetHeight;
          if (center >= top && center < bottom) return i;
        }
        let closest = 0, minDist = Infinity;
        sections.forEach((sec, i) => {
          const dist = Math.abs(sec.offsetTop - scrollY);
          if (dist < minDist) { minDist = dist; closest = i; }
        });
        return closest;
      };

      const syncActiveDotOnScroll = () => {
        if (!isAnimating) {
          const idx = getSectionIndex();
          if (idx !== currentIndex) {
            currentIndex = idx;
            updateActiveDot(currentIndex);
          }
        }
      };
      window.addEventListener('scroll', syncActiveDotOnScroll, { passive: true });

      const goToSection = (targetIdx, direction = 1) => {
        if (targetIdx < 0 || targetIdx >= sections.length) return;
        isAnimating = true;
        currentIndex = targetIdx;
        updateActiveDot(currentIndex);

        const targetSec = sections[targetIdx];
        const vh = window.innerHeight;
        const isTall = (targetSec.offsetHeight - vh) > 15;

        let targetY = targetSec.offsetTop;
        if (direction < 0 && isTall) {
          targetY = targetSec.offsetTop + targetSec.offsetHeight - vh;
        }

        const startY = window.scrollY;
        const dist = Math.abs(targetY - startY);
        const duration = Math.min(1.05, Math.max(0.6, dist / 1400));

        if (window.gsap) {
          const obj = { y: startY };
          gsap.to(obj, {
            y: targetY,
            duration: duration,
            ease: 'power3.out',
            onUpdate: () => {
              window.scrollTo(0, obj.y);
            },
            onComplete: () => {
              clearTimeout(animTimeout);
              animTimeout = setTimeout(() => {
                isAnimating = false;
                syncActiveDotOnScroll();
              }, 120);
            }
          });
        } else {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          clearTimeout(animTimeout);
          animTimeout = setTimeout(() => {
            isAnimating = false;
            syncActiveDotOnScroll();
          }, 750);
        }
      };

      // Support anchor link clicks
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
          const hash = a.getAttribute('href');
          if (!hash || hash === '#') return;
          const targetEl = document.querySelector(hash);
          if (!targetEl) return;
          const targetSectionIdx = sections.findIndex(s => s === targetEl || s.contains(targetEl));
          if (targetSectionIdx !== -1) {
            e.preventDefault();
            goToSection(targetSectionIdx);
          }
        });
      });

      // Wheel handling
      window.addEventListener('wheel', (e) => {
        if (document.body.classList.contains('no-scroll')) return;
        if (prefersReducedMotion) return;

        const currentIdx = getSectionIndex();
        const currentSec = sections[currentIdx];
        if (!currentSec) return;

        const vh = window.innerHeight;
        const scrollY = window.scrollY;
        const secTop = currentSec.offsetTop;
        const secHeight = currentSec.offsetHeight;
        const secBottom = secTop + secHeight;
        const isTall = (secHeight - vh) > 15;

        const deltaY = e.deltaY;
        if (Math.abs(deltaY) < 6) return;

        if (isAnimating) {
          e.preventDefault();
          return;
        }

        if (deltaY > 0) {
          // Scrolling down
          if (isTall) {
            const atBottom = (scrollY + vh) >= (secBottom - 12);
            if (!atBottom) return; // Natural scroll within tall section
          }
          if (currentIdx < sections.length - 1) {
            e.preventDefault();
            goToSection(currentIdx + 1, 1);
          }
        } else if (deltaY < 0) {
          // Scrolling up
          if (isTall) {
            const atTop = scrollY <= (secTop + 12);
            if (!atTop) return; // Natural scroll within tall section
          }
          if (currentIdx > 0) {
            e.preventDefault();
            goToSection(currentIdx - 1, -1);
          }
        }
      }, { passive: false });

      // Touch / mobile swipe handling
      let touchStartY = 0, touchStartX = 0, touchStartTime = 0;
      window.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
      }, { passive: true });

      window.addEventListener('touchend', (e) => {
        if (document.body.classList.contains('no-scroll')) return;
        if (isAnimating) return;

        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const diffY = touchStartY - touchEndY;
        const diffX = touchStartX - touchEndX;
        const duration = Date.now() - touchStartTime;

        if (Math.abs(diffY) < 45 || Math.abs(diffY) <= Math.abs(diffX) * 1.2 || duration > 650) return;

        const currentIdx = getSectionIndex();
        const currentSec = sections[currentIdx];
        if (!currentSec) return;

        const vh = window.innerHeight;
        const scrollY = window.scrollY;
        const secTop = currentSec.offsetTop;
        const secHeight = currentSec.offsetHeight;
        const secBottom = secTop + secHeight;
        const isTall = (secHeight - vh) > 15;

        if (diffY > 0) {
          // Swipe up (user moving downward)
          if (isTall) {
            const atBottom = (scrollY + vh) >= (secBottom - 25);
            if (!atBottom) return;
          }
          if (currentIdx < sections.length - 1) {
            goToSection(currentIdx + 1, 1);
          }
        } else {
          // Swipe down (user moving upward)
          if (isTall) {
            const atTop = scrollY <= (secTop + 25);
            if (!atTop) return;
          }
          if (currentIdx > 0) {
            goToSection(currentIdx - 1, -1);
          }
        }
      }, { passive: true });

      // Keyboard handling
      window.addEventListener('keydown', (e) => {
        if (['input', 'textarea', 'select'].includes(document.activeElement?.tagName?.toLowerCase())) return;
        if (isAnimating) return;

        const currentIdx = getSectionIndex();
        const currentSec = sections[currentIdx];
        if (!currentSec) return;

        const vh = window.innerHeight;
        const scrollY = window.scrollY;
        const secTop = currentSec.offsetTop;
        const secHeight = currentSec.offsetHeight;
        const secBottom = secTop + secHeight;
        const isTall = (secHeight - vh) > 15;

        if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
          if (isTall) {
            const atBottom = (scrollY + vh) >= (secBottom - 16);
            if (!atBottom) return;
          }
          if (currentIdx < sections.length - 1) {
            e.preventDefault();
            goToSection(currentIdx + 1, 1);
          }
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
          if (isTall) {
            const atTop = scrollY <= (secTop + 16);
            if (!atTop) return;
          }
          if (currentIdx > 0) {
            e.preventDefault();
            goToSection(currentIdx - 1, -1);
          }
        } else if (e.key === 'Home') {
          e.preventDefault();
          goToSection(0, -1);
        } else if (e.key === 'End') {
          e.preventDefault();
          goToSection(sections.length - 1, 1);
        }
      });
    }
  }
})();
