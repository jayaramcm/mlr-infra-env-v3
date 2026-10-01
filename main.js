/* ==========================================================================
   MLR BUILDING MATERIALS - MAIN INTERACTION SCRIPT (STANDALONE)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initLenisScroll();
  initNavbarScrollAnimation();
  initMobileMenu();
  initProductsToggle();
  initTestimonialSlider();
  initEstimator();
  initContactForm();
});

/* 0. Navbar Scroll Collapse & 75% Section Indicator Animation */
function initNavbarScrollAnimation() {
  const navbar = document.getElementById('navbar');
  const roller = document.getElementById('navIndicatorRoller');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const drawerLinks = document.querySelectorAll('.drawer-nav-link');
  if (!navbar || !roller) return;

  const sections = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'products', label: 'Products' },
    { id: 'projects', label: 'Projects' },
    { id: 'estimator', label: 'Estimator' },
    { id: 'contact', label: 'Contact' }
  ];

  function calculateActiveIndex() {
    const scrollY = window.scrollY;
    const scrollBottom = window.innerHeight + scrollY;
    const docHeight = document.documentElement.scrollHeight;

    // If reached bottom of page, highlight Contact
    if (scrollBottom >= docHeight - 80) {
      return sections.length - 1;
    }

    // "as the user scrolls past 75% of a section the next section has to display at the center of the navbar"
    for (let i = sections.length - 2; i >= 0; i--) {
      const secEl = document.getElementById(sections[i].id);
      if (!secEl) continue;
      const rect = secEl.getBoundingClientRect();
      const top = scrollY + rect.top;
      const height = secEl.offsetHeight;
      const threshold = top + height * 0.75;

      // When scroll reaches or passes 75% of section i, section i+1 displays
      if (scrollY + 80 >= threshold) {
        return i + 1;
      }
    }

    return 0; // Default to Home
  }

  function saveNavState(isScrolled, label, idx) {
    try {
      sessionStorage.setItem('mlr_nav_scrolled', isScrolled ? '1' : '0');
      if (label) sessionStorage.setItem('mlr_nav_section_label', label);
      if (idx !== undefined) sessionStorage.setItem('mlr_nav_section_idx', String(idx));
    } catch (e) {}
  }

  // 1. Immediately determine current section on load/refresh
  const currentScrollY = window.scrollY || window.pageYOffset || 0;
  const isActuallyScrolled = currentScrollY > 60;
  const initialIndex = isActuallyScrolled ? calculateActiveIndex() : 0;
  let currentIndex = initialIndex;
  let isTransitioning = false;
  let pendingIndex = null;

  // 2. Set the initial text directly without slide animation
  const initialSpan = roller.querySelector('.nav-indicator-text.current') || roller.querySelector('.nav-indicator-text');
  if (initialSpan) {
    initialSpan.className = 'nav-indicator-text current';
    initialSpan.textContent = sections[initialIndex].label;
  } else {
    roller.innerHTML = `<span class="nav-indicator-text current">${sections[initialIndex].label}</span>`;
  }

  // 3. Immediately sync active link highlight
  navLinks.forEach((link, idx) => {
    link.classList.toggle('active', idx === initialIndex);
  });
  drawerLinks.forEach((link, idx) => {
    link.classList.toggle('active', idx === initialIndex);
  });

  // 4. Set initial scrolled/collapsed state immediately
  let isInitiallyScrolled = isActuallyScrolled;

  if (isInitiallyScrolled) {
    navbar.classList.add('is-scrolled');
  } else {
    navbar.classList.remove('is-scrolled');
  }

  saveNavState(isInitiallyScrolled, sections[initialIndex].label, initialIndex);

  function updateNavbar(options) {
    const immediate = Boolean(options && options.immediate) || !navbar.classList.contains('is-ready');
    const scrollY = window.scrollY || window.pageYOffset;
    const isScrolled = scrollY > 60;

    // 1. Navbar collapses into pill when user starts scrolling (> 60px)
    // Expands only when hovered or when reaching top of page (window.scrollY <= 60)
    if (isScrolled) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
      navbar.classList.remove('is-expanded');
    }

    // 2. Calculate active section by 75% threshold
    const targetIndex = calculateActiveIndex();
    saveNavState(isScrolled, sections[targetIndex].label, targetIndex);

    if (targetIndex !== currentIndex) {
      if (immediate) {
        currentIndex = targetIndex;
        const span = roller.querySelector('.nav-indicator-text.current') || roller.querySelector('.nav-indicator-text');
        if (span) {
          span.className = 'nav-indicator-text current';
          span.textContent = sections[targetIndex].label;
        } else {
          roller.innerHTML = `<span class="nav-indicator-text current">${sections[targetIndex].label}</span>`;
        }
        navLinks.forEach((link, idx) => {
          link.classList.toggle('active', idx === targetIndex);
        });
        drawerLinks.forEach((link, idx) => {
          link.classList.toggle('active', idx === targetIndex);
        });
      } else if (isTransitioning) {
        pendingIndex = targetIndex;
      } else {
        performTransition(currentIndex, targetIndex);
      }
    }
  }

  function performTransition(fromIdx, toIdx) {
    isTransitioning = true;
    const direction = toIdx > fromIdx ? 'down' : 'up';

    const oldSpan = roller.querySelector('.nav-indicator-text.current') || roller.querySelector('.nav-indicator-text');
    const newSpan = document.createElement('span');
    newSpan.className = 'nav-indicator-text';
    newSpan.textContent = sections[toIdx].label;

    if (direction === 'down') {
      // Scrolling down: current text slides UP and fades out (400ms ease-in), new text comes from BOTTOM (400ms ease-out)
      if (oldSpan) {
        oldSpan.className = 'nav-indicator-text nav-slide-out-up';
      }
      newSpan.classList.add('nav-slide-in-up');
    } else {
      // Scrolling up: current text slides DOWN and fades out (400ms ease-in), new text comes from TOP (400ms ease-out)
      if (oldSpan) {
        oldSpan.className = 'nav-indicator-text nav-slide-out-down';
      }
      newSpan.classList.add('nav-slide-in-down');
    }

    roller.appendChild(newSpan);

    // Sync active highlight on expanded desktop nav links
    navLinks.forEach((link, idx) => {
      link.classList.toggle('active', idx === toIdx);
    });
    drawerLinks.forEach((link, idx) => {
      link.classList.toggle('active', idx === toIdx);
    });

    currentIndex = toIdx;

    // 240ms transition duration matching CSS timing
    setTimeout(() => {
      if (oldSpan && oldSpan.parentNode === roller) {
        roller.removeChild(oldSpan);
      }
      newSpan.className = 'nav-indicator-text current';
      isTransitioning = false;

      // Handle any pending section change that occurred during the 240ms transition
      if (pendingIndex !== null && pendingIndex !== currentIndex) {
        const nextTarget = pendingIndex;
        pendingIndex = null;
        performTransition(currentIndex, nextTarget);
      }
    }, 240);
  }

  // Expand ONLY when user hovers on the center page name indicator
  const centerIndicator = document.getElementById('navCenterIndicator');
  if (centerIndicator) {
    centerIndicator.addEventListener('mouseenter', () => {
      if (navbar.classList.contains('is-scrolled')) {
        navbar.classList.add('is-expanded');
      }
    });

    navbar.addEventListener('mouseleave', () => {
      navbar.classList.remove('is-expanded');
    });

    // Collapse immediately when clicking any navigation link or action
    navbar.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        navbar.classList.remove('is-expanded');
      });
    });
  }

  window.addEventListener('scroll', () => updateNavbar(), { passive: true });
  window.addEventListener('resize', () => updateNavbar(), { passive: true });
  window.addEventListener('pageshow', () => updateNavbar({ immediate: true }));
  if (window.lenis) {
    window.lenis.on('scroll', () => updateNavbar());
  }

  // Re-enable smooth transitions for future scrolling and hover after the initial paint and scroll restoration
  function enableTransitions() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          navbar.classList.add('is-ready');
          navbar.classList.remove('no-transition');
        }, 120);
      });
    });
  }

  if (document.readyState === 'complete') {
    enableTransitions();
  } else {
    window.addEventListener('load', enableTransitions, { once: true });
  }
}

/* 1. Mobile Menu */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const closeBtn = document.getElementById('drawerCloseBtn');
  const drawerLinks = document.querySelectorAll('.drawer-nav-link, #mobileDrawerQuoteBtn');

  if (!toggleBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (window.lenis) {
      window.lenis.stop();
    }
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
    if (window.lenis) {
      window.lenis.start();
    }
  }

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* 2. Products Tab Toggle, Dynamic Product Cards & Showcase Image */
function initProductsToggle() {
  const tabBricks = document.getElementById('tabBricks');
  const tabFencing = document.getElementById('tabFencing');
  const productsGrid = document.getElementById('productsGrid');
  const showcaseImg = document.getElementById('productShowcaseImg');
  const sizesSubtitle = document.getElementById('productSizesSubtitle');
  const sizesGrid = document.getElementById('productSizesGrid');

  if (!productsGrid) return;

  const PRODUCTS_DATA = {
    bricks: {
      categoryLabel: 'CC Bricks',
      items: [
        {
          id: 'solid-cc-bricks',
          title: 'Solid CC<br>Bricks',
          plainTitle: 'Solid CC Bricks',
          desc: "Dense, high-strength bricks for the load it needs to carry - load-bearing walls, foundations, and structures that can't afford to flex.",
          image: 'assets/solid-cc-bricks.jpg',
          sizesSubtitle: 'Moulds Ready, Available Right Now',
          sizes: [
            { label: '300×200×200mm', val: '300x200x200' },
            { label: '300×200×150mm', val: '300x200x150' },
            { label: '300×200×100mm', val: '300x200x100' },
            { label: '290×225×140mm', val: '290x225x140' }
          ]
        },
        {
          id: 'fly-ash-bricks',
          title: 'Fly Ash CC<br>Bricks',
          plainTitle: 'Fly Ash CC Bricks',
          desc: 'The sustainable choice, without sacrificing strength. Made with fly ash, keeping kilns and clay pits out, so you build greener without compromising performance.',
          image: 'assets/fly-ash-bricks.jpg',
          sizesSubtitle: 'Eco-Engineered Standard Moulds',
          sizes: [
            { label: '230×110×75mm', val: '230x110x75' },
            { label: '230×150×75mm', val: '230x150x75' },
            { label: '230×110×70mm', val: '230x110x70' },
            { label: '200×100×100mm', val: '200x100x100' }
          ]
        },
        {
          id: 'interlocking-bricks',
          title: 'Interlocking<br>CC Bricks',
          plainTitle: 'Interlocking CC Bricks',
          desc: 'No mortar, no wasted days. The blocks lock into each other on-site, cutting both labour time and material cost versus a conventional mortared wall.',
          image: 'assets/interlocking-bricks.jpg',
          sizesSubtitle: 'Precision Interlock Dimensions',
          sizes: [
            { label: '300×150×150mm', val: '300x150x150' },
            { label: '300×200×150mm', val: '300x200x150' },
            { label: '400×200×150mm', val: '400x200x150' },
            { label: '400×200×200mm', val: '400x200x200' }
          ]
        },
        {
          id: 'paver-blocks',
          title: 'Paver CC<br>Blocks',
          plainTitle: 'Paver CC Blocks',
          desc: 'For driveways, walkways, and outdoor flooring that needs to take traffic. Built to handle vehicle load and foot traffic without cracking or shifting over time.',
          image: 'assets/paver-blocks.jpg',
          sizesSubtitle: 'Heavy-Duty Traffic Grades',
          sizes: [
            { label: '60mm Thickness', val: '60mm' },
            { label: '80mm Thickness', val: '80mm' },
            { label: '100mm Industrial', val: '100mm' },
            { label: 'Zig-Zag / I-Shape', val: 'zigzag' }
          ]
        }
      ]
    },
    fencing: {
      categoryLabel: 'Precast Fencing',
      items: [
        {
          id: 'compound-walls',
          title: 'Compound<br>Walls',
          plainTitle: 'Compound Walls',
          desc: 'Precast fencing, waterproof by default. High-strength perimeter compound walls engineered for zero plastering and immediate boundary security.',
          image: 'assets/precast-concrete-wall.webp',
          sizesSubtitle: 'Precast Fencing: Waterproof by Default',
          sizes: [
            { label: 'Up to 6.6 ft', val: '6.6ft' },
            { label: '7 ft Standard', val: '7ft' },
            { label: '8 ft Boundary', val: '8ft' },
            { label: 'Heavy Base', val: 'base' }
          ]
        },
        {
          id: 'cement-fencing-wall',
          title: 'Cement Fencing<br>Wall',
          plainTitle: 'Cement Fencing Wall',
          desc: 'Modular cement fencing panels built to withstand harsh weathering. Fast interlocking installation cutting boundary construction time in half.',
          image: 'assets/precast-compound-wall.jpg',
          sizesSubtitle: 'High-Durability Modular Cement Planks',
          sizes: [
            { label: '5 ft Height', val: '5ft' },
            { label: '6 ft Height', val: '6ft' },
            { label: '6.6 ft Standard', val: '6.6ft' },
            { label: 'Custom Span', val: 'custom' }
          ]
        },
        {
          id: 'rcc-fencing-wall',
          title: 'RCC Fencing<br>Wall',
          plainTitle: 'RCC Fencing Wall',
          desc: 'Heavy-duty steel-reinforced concrete fencing panels and anchored posts engineered for high wind loads, structural rigidity, and zero cracks.',
          image: 'assets/precast-h-posts.jpg',
          sizesSubtitle: 'Steel-Reinforced Concrete & Anchored Posts',
          sizes: [
            { label: 'H-Column 150×150', val: 'h150' },
            { label: 'Panel 2100×300', val: 'p2100' },
            { label: 'Reinforced Core', val: 'core' },
            { label: 'High Wind Load', val: 'wind' }
          ]
        },
        {
          id: 'precast-compound-wall',
          title: 'Precast Compound<br>Wall',
          plainTitle: 'Precast Compound Wall',
          desc: 'Modular RCC precast up to 6.6 ft, ready to assemble on-site. Pricing and MOQ vary by type; request a custom quote today.',
          image: 'assets/precast-boundary-wall.webp',
          sizesSubtitle: 'Modular RCC Precast: Ready to Assemble',
          sizes: [
            { label: 'Up to 6.6 ft', val: '6.6ft' },
            { label: 'Modular Slabs', val: 'slabs' },
            { label: 'MOQ by Type', val: 'moq' },
            { label: 'Request Quote', val: 'quote' }
          ]
        }
      ]
    }
  };

  let currentCategory = 'bricks';
  let currentProductIndex = 0;

  function updateShowcase(categoryKey, itemIdx) {
    const item = PRODUCTS_DATA[categoryKey]?.items[itemIdx];
    if (!item) return;

    if (showcaseImg) {
      showcaseImg.classList.add('fading');
      setTimeout(() => {
        showcaseImg.src = item.image;
        showcaseImg.alt = item.plainTitle;
        showcaseImg.classList.remove('fading');
      }, 140);
    }

    if (sizesSubtitle) {
      sizesSubtitle.textContent = item.sizesSubtitle;
    }

    if (sizesGrid && Array.isArray(item.sizes)) {
      sizesGrid.innerHTML = item.sizes.map((s, sIdx) => {
        const isAct = sIdx === 0 ? ' active' : '';
        return `<button type="button" class="size-pill-btn${isAct}" data-size="${s.val}">${s.label}</button>`;
      }).join('');

      const newPills = sizesGrid.querySelectorAll('.size-pill-btn');
      newPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          newPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
        });
      });
    }
  }

  function renderCategory(categoryKey, selectedIdx = 0) {
    const catData = PRODUCTS_DATA[categoryKey];
    if (!catData || !productsGrid) return;
    currentCategory = categoryKey;
    currentProductIndex = selectedIdx;

    productsGrid.innerHTML = catData.items.map((item, idx) => {
      const isActive = idx === selectedIdx;
      const activeClass = isActive ? 'solid-blue-card active' : 'light-blue-card';
      return `
        <div class="prod-item-card ${activeClass}" data-index="${idx}">
          <h3 class="prod-name">${item.title}</h3>
          <p class="prod-desc">${item.desc}</p>
        </div>
      `;
    }).join('');

    updateShowcase(categoryKey, selectedIdx);
  }

  // Card click event delegation
  productsGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.prod-item-card');
    if (!card) return;
    const idx = parseInt(card.dataset.index, 10);
    if (isNaN(idx) || idx === currentProductIndex) return;

    const allCards = productsGrid.querySelectorAll('.prod-item-card');
    allCards.forEach((c, i) => {
      if (i === idx) {
        c.classList.add('active', 'solid-blue-card');
        c.classList.remove('light-blue-card');
      } else {
        c.classList.remove('active', 'solid-blue-card');
        c.classList.add('light-blue-card');
      }
    });

    currentProductIndex = idx;
    updateShowcase(currentCategory, idx);
  });

  // Tab toggles
  if (tabBricks && tabFencing) {
    tabBricks.addEventListener('click', () => {
      if (currentCategory === 'bricks') return;
      tabBricks.classList.add('active');
      tabFencing.classList.remove('active');
      renderCategory('bricks', 0);
    });

    tabFencing.addEventListener('click', () => {
      if (currentCategory === 'fencing') return;
      tabFencing.classList.add('active');
      tabBricks.classList.remove('active');
      renderCategory('fencing', 0);
    });
  }

  // Initial render to bind size pills and initial active state
  renderCategory('bricks', 0);
}

/* 3. Testimonial Slider */
function initTestimonialSlider() {
  const quoteText = document.getElementById('activeQuoteText');
  const quoteAuthor = document.getElementById('activeQuoteAuthor');
  const dots = document.querySelectorAll('.t-dot');

  if (!quoteText || !quoteAuthor || dots.length === 0) return;

  const card = document.querySelector('.fullwidth-testimonial-card');
  const SLIDE_DELAY = 5000; // 5 seconds per testimonial
  let currentIndex = 0;
  let timer = null;

  const testimonials = [
    {
      quote: "“MLR delivers exactly what they promise: bricks cast on our site, on our schedule, without the delays a trucked-in supplier would have given us.”",
      name: "- Vamshi Krishna,",
      role: "MD, VKC"
    },
    {
      quote: "“For our factory expansion, MLR handled material and labour together, which meant one less vendor for us to manage. Quality was consistent across the whole order.”",
      name: "- Sudhakar,",
      role: "Project Manager, Amaraja"
    },
    {
      quote: "“We've used MLR on more than one project now, including our hospital builds in Bheemgal and Banswada. On-site casting cut down our wait time significantly.”",
      name: "- Rajamouli,",
      role: "Project Manager, Stanch Projects"
    },
    {
      quote: "“Reliable supply and a crew that showed up when they said they would. That's what we needed for our apartment project in Bibinagar.”",
      name: "- Ramakrishna,",
      role: "Project Manager, NCC"
    },
    {
      quote: "“MLR's end-to-end approach with material, machinery, and labour together made coordination far simpler on our end.”",
      name: "- Devender Reddy,",
      role: "MD, VDR"
    }
  ];

  function showTestimonial(idx) {
    if (!testimonials[idx]) return;
    currentIndex = idx;

    // Smooth fade out
    quoteText.style.opacity = '0';
    quoteAuthor.style.opacity = '0';

    setTimeout(() => {
      quoteText.textContent = testimonials[idx].quote;
      quoteAuthor.innerHTML = `<strong>${testimonials[idx].name}</strong> <span>${testimonials[idx].role}</span>`;

      // Update dots
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === idx);
      });

      // Smooth fade in
      quoteText.style.opacity = '1';
      quoteAuthor.style.opacity = '1';
    }, 200);
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % testimonials.length;
      showTestimonial(nextIndex);
    }, SLIDE_DELAY);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Click on dots
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-quote-idx'), 10) || 0;
      showTestimonial(idx);
      startTimer();
    });
  });

  // Pause on hover so the user can read without it switching
  if (card) {
    card.addEventListener('mouseenter', stopTimer);
    card.addEventListener('mouseleave', startTimer);
  }

  // Start auto-play timer
  startTimer();
}

/* 4. Estimator (Single Mode: By Wall Size Only) */
function initEstimator() {
  const wallLengthInput = document.getElementById('wallLength');
  const wallHeightInput = document.getElementById('wallHeight');
  const wallOpeningsInput = document.getElementById('wallOpenings');
  const wastageInput = document.getElementById('calcWastage');
  const wastageLabel = document.getElementById('wastageValueLabel');
  
  const displayBrickCount = document.getElementById('displayBrickCount');
  const displayNetArea = document.getElementById('displayNetArea');
  const displayProdDays = document.getElementById('displayProdDays');
  const displayUnitLabel = document.getElementById('displayUnitLabel');

  const sizeBtns = document.querySelectorAll('.calc-size-btn');
  const prodTabs = document.querySelectorAll('.calc-tab');
  const presetBtns = document.querySelectorAll('.preset-pill-btn');
  const btnTransfer = document.getElementById('btnTransferEstimate');

  let currentLengthMm = 300;
  let currentHeightMm = 200;
  let currentProdType = 'CC Bricks';

  function calculate() {
    const len = parseFloat(wallLengthInput.value) || 0;
    const hgt = parseFloat(wallHeightInput.value) || 0;
    const ded = parseFloat(wallOpeningsInput.value) || 0;
    const wastePct = parseFloat(wastageInput.value) || 0;

    if (wastageLabel) {
      wastageLabel.textContent = wastePct + '%';
    }

    const grossArea = len * hgt;
    const netArea = Math.max(0, grossArea - ded);

    if (displayNetArea) {
      displayNetArea.textContent = Math.round(netArea) + ' sq.ft';
    }

    // Brick face area in square feet including 10mm mortar joint
    const nominalLenFt = (currentLengthMm + 10) / 304.8;
    const nominalHgtFt = (currentHeightMm + 10) / 304.8;
    const nominalFaceArea = nominalLenFt * nominalHgtFt;

    let totalBricks = 0;
    if (nominalFaceArea > 0) {
      const rawCount = netArea / nominalFaceArea;
      totalBricks = Math.ceil(rawCount * (1 + wastePct / 100));
    }

    if (displayBrickCount) {
      displayBrickCount.textContent = totalBricks.toLocaleString();
    }

    // Production Days (assuming baseline capacity of 3,500 units/day)
    const days = Math.max(1, Math.ceil(totalBricks / 3500));
    if (displayProdDays) {
      displayProdDays.textContent = days === 1 ? '~1 Day' : `~${days} Days`;
    }
  }

  // Size pill buttons
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLengthMm = parseFloat(btn.getAttribute('data-l')) || 300;
      currentHeightMm = parseFloat(btn.getAttribute('data-h')) || 200;
      calculate();
    });
  });

  // Product Tabs
  prodTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      prodTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentProdType = tab.textContent.trim();
      if (displayUnitLabel) {
        displayUnitLabel.textContent = `${currentProdType} Required`;
      }
      calculate();
    });
  });

  // Presets
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pLen = btn.getAttribute('data-len');
      const pHgt = btn.getAttribute('data-hgt');
      const pDed = btn.getAttribute('data-ded');
      if (wallLengthInput) wallLengthInput.value = pLen;
      if (wallHeightInput) wallHeightInput.value = pHgt;
      if (wallOpeningsInput) wallOpeningsInput.value = pDed;
      calculate();
    });
  });

  // Input listeners
  [wallLengthInput, wallHeightInput, wallOpeningsInput, wastageInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', calculate);
    }
  });

  // Transfer Estimate to Contact Form
  if (btnTransfer) {
    btnTransfer.addEventListener('click', () => {
      const count = displayBrickCount ? displayBrickCount.textContent : '';
      const net = displayNetArea ? displayNetArea.textContent : '';
      const days = displayProdDays ? displayProdDays.textContent : '';
      const notesField = document.getElementById('projectEstimateNotes');
      const materialSelect = document.getElementById('projectType');

      if (notesField) {
        notesField.value = `Estimated Scope: ${count} units of ${currentProdType} (${currentLengthMm}x200x${currentHeightMm}mm) for ${net} net wall area. Expected on-site production schedule: ${days}.`;
      }

      if (materialSelect) {
        materialSelect.value = currentProdType.includes('Fencing') ? 'Precast Fencing' : 
                               currentProdType.includes('Paver') ? 'Paver Blocks' : 'CC Bricks';
      }
    });
  }

  calculate();
}

/* 5. Contact Form */
function initContactForm() {
  const form = document.getElementById('siteEnquiryForm');
  const successBanner = document.getElementById('formSuccessMessage');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (successBanner) {
      successBanner.style.display = 'flex';
      form.style.display = 'none';
    }
  });
}

/* 6. Hero Crane Image & Floating Badge Parallax Scroll Effect */
function initHeroParallax() {
  const heroCard = document.querySelector('.hero-image-card');
  const heroImg = document.querySelector('.hero-crane-img');
  const heroBadge = document.querySelector('.hero-floating-badge');
  if (!heroCard || !heroImg) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  function updateParallax() {
    const rect = heroCard.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Only update when hero section is visible in viewport
    if (rect.bottom > 0 && rect.top < windowHeight) {
      const scrollY = window.scrollY || window.pageYOffset;
      // Image translates down as page scrolls up (smooth parallax depth)
      const imgOffset = Math.min(scrollY * 0.22, 120);
      const badgeOffset = Math.max(scrollY * -0.07, -35);

      heroImg.style.setProperty('--hero-parallax-y', `${imgOffset.toFixed(2)}px`);
      if (heroBadge) {
        heroBadge.style.setProperty('--badge-parallax-y', `${badgeOffset.toFixed(2)}px`);
      }
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  if (window.lenis) {
    window.lenis.on('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    });
  }

  window.addEventListener('resize', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  // Initial calculation on load
  updateParallax();
}

/* ==========================================================================
   7. Lenis Smooth Scroll Engine
   ========================================================================== */
function initLenisScroll() {
  if (typeof Lenis === 'undefined') {
    console.warn('Lenis script not loaded. Falling back to native browser scrolling.');
    return;
  }

  // Prevent browser from automatically jumping to remembered scroll or #home on reload
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lenis = new Lenis({
    duration: prefersReduced ? 0.01 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: !prefersReduced,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.2,
    infinite: false,
    autoRaf: false
  });

  window.lenis = lenis;

  // Dedicated continuous RAF loop for 60/120fps motion
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Smooth scroll handler for all anchor links (#home, #about, #products, etc.)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Check if it's an on-page anchor
    let hash = '';
    try {
      const url = new URL(link.href, window.location.href);
      if (url.pathname !== window.location.pathname) return;
      hash = url.hash;
    } catch (err) {
      if (href.startsWith('#')) {
        hash = href;
      } else {
        return;
      }
    }

    if (!hash || hash === '#' || hash.length < 2) {
      if (hash === '#') e.preventDefault();
      return;
    }

    // SPECIAL HANDLING FOR #home: Always scroll to top of page (0), not behind navbar!
    if (hash === '#home') {
      e.preventDefault();
      lenis.scrollTo(0, {
        duration: prefersReduced ? 0.01 : 1.0,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      });

      // Remove #home from URL so refreshing doesn't jump to #home
      if (history.pushState) {
        history.pushState(null, '', window.location.pathname + window.location.search);
      }

      try {
        sessionStorage.setItem('mlr_nav_scrolled', '0');
        sessionStorage.setItem('mlr_nav_section_label', 'Home');
        sessionStorage.setItem('mlr_nav_section_idx', '0');
      } catch (err) {}

      // Auto-close mobile drawer if active
      const drawer = document.getElementById('mobileDrawer');
      if (drawer && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        document.body.style.overflow = '';
        lenis.start();
      }
      return;
    }

    const targetEl = document.querySelector(hash);
    if (!targetEl) return;

    e.preventDefault();

    // Offset for floating sticky pill navbar (approx 80px)
    lenis.scrollTo(targetEl, {
      offset: -80,
      duration: prefersReduced ? 0.01 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });

    if (history.pushState) {
      history.pushState(null, '', hash);
    }

    // Auto-close mobile drawer if active
    const drawer = document.getElementById('mobileDrawer');
    if (drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      document.body.style.overflow = '';
      lenis.start();
    }
  });

  // Handle initial page load with hash anchor smoothly
  if (window.location.hash) {
    if (window.location.hash === '#home') {
      // Clean up URL so refresh doesn't trigger scroll restoration
      if (history.replaceState) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      window.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true });
    } else {
      const initialTarget = document.querySelector(window.location.hash);
      if (initialTarget) {
        setTimeout(() => {
          lenis.scrollTo(initialTarget, {
            offset: -80,
            immediate: false,
            duration: 0.8
          });
        }, 150);
      }
    }
  } else {
    // If no hash and at top, ensure clean 0
    if ((window.scrollY || window.pageYOffset || 0) < 60) {
      window.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true });
    }
  }
}


