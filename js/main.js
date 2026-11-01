/**
 * ============================================================================
 * CORDILLERA TREK - ARQUITECTURA INTERACTIVA Y SISTEMA MULTI-AGENTE (REDISEÑO)
 * ============================================================================
 * Incluye:
 * 1. Agente IA Removedor de Fondos (.PNG Transparente en tiempo real + Batch)
 * 2. Agente Sincronizador Ascend RMS + Catalogador IA + Depurador Cuarentena
 * 3. Tienda en Línea Minimalista (Trek-web-03.jpg: Buscador inline + Fichas PNG)
 * 4. Ficha de Producto a 2 Columnas (Trek-web-06.jpg) + Carrusel HD
 * 5. Taller Bike (Trek-web-04.jpg): Recolección $120 MXN, Calculador Anticipo,
 *    Verificación de Usuario (OTP 6 dígitos), Pasarela de Pago y Hoja Digital
 * 6. Carrusel Horizontal de Noticias y Eventos (Trek-web-05.jpg)
 * 7. Desplazamiento con Barrido Suave (Cubic Easing) y Animaciones al Scroll
 * ============================================================================
 */

(function () {
    'use strict';

    /* ========================================================================
       ESTADO GLOBAL DE LA APLICACIÓN
       ======================================================================== */
    const STORAGE_KEYS = {
        CART: 'cordillera_rediseno_cart_v2',
        USER: 'cordillera_rediseno_user_v2',
        USERS_DB: 'cordillera_rediseno_users_db_v2',
        ORDERS: 'cordillera_rediseno_orders_v2',
        WORKSHOP_BOOKINGS: 'cordillera_rediseno_workshop_v2',
        CUSTOM_IMG_OVERRIDES: 'cordillera_rediseno_img_overrides_v3',
        CUSTOM_GALLERY_OVERRIDES: 'cordillera_rediseno_gallery_overrides_v3',
        CUSTOM_INVENTORY_EDITS: 'cordillera_rediseno_inv_edits_v3'
    };

    const state = {
        products: [],
        quarantineProducts: [],
        filteredProducts: [],
        activeFilterLabel: 'Selección Destacada Cordillera',
        storeSlideIndex: 0,
        heroSlideIndex: 0,
        heroTimer: null,
        newsSlideIndex: 0,
        currentProductModal: null,
        fullscreenGallery: {
            images: [],
            currentIndex: 0,
            zoomed: false
        },
        pendingRegistrationUser: null,
        pendingVerificationCode: null,
        pendingWorkshopBooking: null,
        cart: loadJSON(STORAGE_KEYS.CART, []),
        currentUser: loadJSON(STORAGE_KEYS.USER, null),
        usersDB: loadJSON(STORAGE_KEYS.USERS_DB, []),
        orders: loadJSON(STORAGE_KEYS.ORDERS, []),
        workshopBookings: loadJSON(STORAGE_KEYS.WORKSHOP_BOOKINGS, []),
        customImgOverrides: loadJSON(STORAGE_KEYS.CUSTOM_IMG_OVERRIDES, {}),
        customGalleryOverrides: loadJSON(STORAGE_KEYS.CUSTOM_GALLERY_OVERRIDES, {}),
        customInventoryEdits: loadJSON(STORAGE_KEYS.CUSTOM_INVENTORY_EDITS, {})
    };

    /* Base de Datos de Noticias y Eventos (Trek-web-05.jpg) */
    const NEWS_EVENTS = [
        {
            id: 'evt-garabitos-maja-trail',
            title: 'GARABITOS MAJA TRAIL',
            date: '17 / MAYO / 2026',
            location: 'PRESA GARABITOS',
            poster: 'assets/images/poster-01.png',
            excerpt: 'El desafío de Trail Running y aventura más esperado en los cañones y senderos de la Presa Garabitos en Durango. Distancias recreativas y competitivas rodeadas de paisajes únicos.',
            details: 'Punto de reunión y salida en la cortina de la Presa Garabitos. Contaremos con hidratación oficial SiS & Hammer Nutrition, asistencia médica y mecánica Cordillera Trek, medalla conmemorativa y premiación por categorías.'
        },
        {
            id: 'evt-sierra-chupaderos',
            title: 'SERIAL MTB SIERRA DE CHUPADEROS',
            date: '24 / MAYO / 2026',
            location: 'PISTA CHUPADEROS, DGO.',
            poster: 'assets/images/poster-02.png',
            excerpt: 'Conquista los senderos técnicos y singletracks de Chupaderos junto al equipo oficial Cordillera Trek. Categorías XC, E-Bike y Maratón.',
            details: 'Contaremos con carpa de soporte neutro Shimano / Bontrager, hidratación especializada y pruebas de manejo de la nueva Trek Rail+ 8 Gen 5 y Fuel EXe.'
        },
        {
            id: 'evt-fondo-ruta',
            title: 'GRAN FONDO RUTA DURANGO - EL SALTO',
            date: '07 / JUNIO / 2026',
            location: 'CORONADO #1130 PTE.',
            poster: 'assets/images/poster-03.png',
            excerpt: '110 kilómetros de ascenso controlado por la carretera libre hacia la sierra con escolta vial, abastecimiento y soporte mecánico en ruta.',
            details: 'Abierto a bicicletas de Ruta y Gravel. Grupos divididos por promedio de velocidad (Avanzado 32+ km/h e Intermedio 27 km/h). Registro en tienda Cordillera Trek.'
        },
        {
            id: 'evt-clinica-tubeless',
            title: 'CLÍNICA MECÁNICA EN RUTA Y TUBELESS',
            date: '19 / JUNIO / 2026',
            location: 'TALLER CORDILLERA TREK',
            poster: 'assets/images/poster-04.png',
            excerpt: 'Aprende a reparar mechas tubeless, ajustar desviadores electrónicos SRAM AXS / Shimano Di2 y solucionar emergencias en la montaña.',
            details: 'Impartida por nuestros mecánicos certificados Trek University. Cupo limitado a 20 ciclistas por sesión. Incluye kit de descuento en herramientas Bontrager y Stan\'s NoTubes.'
        }
    ];

    /* ========================================================================
       UTILIDADES GENERALES Y DESPLAZAMIENTO CON BARRIDO SUAVE (REQ 9)
       ======================================================================== */
    function loadJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function saveJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('No se pudo guardar en localStorage:', e);
        }
    }

    function formatCurrency(amount) {
        const num = Number(amount) || 0;
        return '$' + num.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' MXN';
    }

    function showToast(message) {
        const stack = document.getElementById('toast-stack');
        if (!stack) return;
        const toast = document.createElement('div');
        toast.className = 'minimal-toast';
        toast.textContent = message;
        stack.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = '0.3s ease';
            setTimeout(() => toast.remove(), 320);
        }, 3500);
    }

    /**
     * Desplazamiento con barrido suave personalizado (Cubic Ease-In-Out)
     * Evita cualquier salto brusco al navegar entre secciones.
     */
    let activeScrollAnimationId = null;

    function customSmoothScrollTo(targetY, duration = 860) {
        if (activeScrollAnimationId) {
            cancelAnimationFrame(activeScrollAnimationId);
            activeScrollAnimationId = null;
        }

        const startY = window.pageYOffset || document.documentElement.scrollTop || 0;
        const clampedTargetY = Math.max(0, targetY);
        const diff = clampedTargetY - startY;

        if (Math.abs(diff) < 4) {
            window.scrollTo(0, clampedTargetY);
            return;
        }

        const startTime = performance.now();
        const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = easeInOutCubic(progress);
            window.scrollTo(0, Math.round(startY + diff * eased));

            if (progress < 1) {
                activeScrollAnimationId = requestAnimationFrame(step);
            } else {
                activeScrollAnimationId = null;
            }
        };

        activeScrollAnimationId = requestAnimationFrame(step);
    }

    function scrollToSection(selector) {
        const el = document.querySelector(selector);
        if (!el) return;
        const headerEl = document.getElementById('main-header');
        const headerHeight = headerEl ? headerEl.offsetHeight : 76;
        const rect = el.getBoundingClientRect();
        const targetY = (window.pageYOffset || document.documentElement.scrollTop) + rect.top - headerHeight;
        customSmoothScrollTo(targetY, 860);
    }

    /* ========================================================================
       AGENTE IA REMOVEDOR DE FONDOS (.PNG TRANSPARENTE EN NAVEGADOR)
       Quita fondos blancos/sólidos de imágenes de productos mediante Flood-Fill
       desde los bordes + suavizado de canal Alfa en HTML5 Canvas.
       ======================================================================== */
    const BackgroundRemoverAgent = {
        processImageToTransparentPNG(imageSource, tolerance = 24) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const maxDim = 960;
                        let w = img.naturalWidth || img.width;
                        let h = img.naturalHeight || img.height;
                        if (w > maxDim || h > maxDim) {
                            const scale = maxDim / Math.max(w, h);
                            w = Math.round(w * scale);
                            h = Math.round(h * scale);
                        }
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, w, h);

                        const imgData = ctx.getImageData(0, 0, w, h);
                        const data = imgData.data;

                        const corners = [
                            0,
                            (w - 1) * 4,
                            (h - 1) * w * 4,
                            ((h - 1) * w + (w - 1)) * 4
                        ];
                        let bgR = 0, bgG = 0, bgB = 0;
                        corners.forEach(idx => {
                            bgR += data[idx];
                            bgG += data[idx + 1];
                            bgB += data[idx + 2];
                        });
                        bgR /= 4;
                        bgG /= 4;
                        bgB /= 4;

                        const visited = new Uint8Array(w * h);
                        const queue = new Int32Array(w * h);
                        let head = 0, tail = 0;

                        const matchesBg = (pixelIdx) => {
                            const i = pixelIdx * 4;
                            const r = data[i], g = data[i + 1], b = data[i + 2];
                            const dist = Math.max(Math.abs(r - bgR), Math.abs(g - bgG), Math.abs(b - bgB));
                            const isVeryBright = r > 240 && g > 240 && b > 240;
                            return dist <= tolerance || isVeryBright;
                        };

                        for (let x = 0; x < w; x++) {
                            const topIdx = x;
                            const botIdx = (h - 1) * w + x;
                            if (matchesBg(topIdx)) { visited[topIdx] = 1; queue[tail++] = topIdx; }
                            if (matchesBg(botIdx)) { visited[botIdx] = 1; queue[tail++] = botIdx; }
                        }
                        for (let y = 0; y < h; y++) {
                            const leftIdx = y * w;
                            const rightIdx = y * w + (w - 1);
                            if (!visited[leftIdx] && matchesBg(leftIdx)) { visited[leftIdx] = 1; queue[tail++] = leftIdx; }
                            if (!visited[rightIdx] && matchesBg(rightIdx)) { visited[rightIdx] = 1; queue[tail++] = rightIdx; }
                        }

                        while (head < tail) {
                            const curr = queue[head++];
                            const cx = curr % w;
                            const cy = (curr / w) | 0;

                            if (cx > 0 && !visited[curr - 1] && matchesBg(curr - 1)) {
                                visited[curr - 1] = 1;
                                queue[tail++] = curr - 1;
                            }
                            if (cx < w - 1 && !visited[curr + 1] && matchesBg(curr + 1)) {
                                visited[curr + 1] = 1;
                                queue[tail++] = curr + 1;
                            }
                            if (cy > 0 && !visited[curr - w] && matchesBg(curr - w)) {
                                visited[curr - w] = 1;
                                queue[tail++] = curr - w;
                            }
                            if (cy < h - 1 && !visited[curr + w] && matchesBg(curr + w)) {
                                visited[curr + w] = 1;
                                queue[tail++] = curr + w;
                            }
                        }

                        for (let p = 0; p < w * h; p++) {
                            if (visited[p]) {
                                data[p * 4 + 3] = 0;
                            }
                        }

                        ctx.putImageData(imgData, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = reject;
                img.src = imageSource;
            });
        }
    };

    /* ========================================================================
       1. SPLASH SCREEN DE VIDEO INTRO
       Al terminar el video-intro.mp4 (o al hacer clic en "Iniciar"), entra
       automáticamente a la página posicionada desde el inicio.
       ======================================================================== */
    function initIntroSplash() {
        const introScreen = document.getElementById('intro-screen');
        const btnEnter = document.getElementById('btn-enter-site');
        const introVideo = document.getElementById('intro-video');

        if (!introScreen || !btnEnter) {
            document.body.classList.remove('locked');
            return;
        }

        let isDismissed = false;

        const dismissIntro = () => {
            if (isDismissed) return;
            isDismissed = true;

            // Posicionar la página exactamente al inicio y reiniciar el Hero en Slide 1
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            if (typeof state.resetHeroToStart === 'function') {
                state.resetHeroToStart();
            }

            introScreen.classList.add('fade-out');
            document.body.classList.remove('locked');
            setTimeout(() => {
                if (introVideo) introVideo.pause();
            }, 850);
        };

        if (introVideo) {
            introVideo.loop = false;
            introVideo.addEventListener('ended', dismissIntro);
        }

        btnEnter.addEventListener('click', dismissIntro);

        window.addEventListener('keydown', (e) => {
            if (!introScreen.classList.contains('fade-out') && (e.key === 'Enter' || e.key === 'Escape')) {
                dismissIntro();
            }
        });
    }

    /* ========================================================================
       2. TOP BAR, MENÚ STICKY, REPLIEGUE LIMPIO DE CATEGORÍAS Y BUSCADOR
       ======================================================================== */
    function initStickyNavigation() {
        const siteChrome = document.getElementById('site-chrome');
        const mainNav = document.getElementById('main-nav');
        const mobileBtn = document.getElementById('btn-mobile-menu');
        const searchBtn = document.getElementById('btn-toggle-search');
        const closeSearchBtn = document.getElementById('btn-close-search');
        const searchDrawer = document.getElementById('search-bar-drawer');
        const searchInput = document.getElementById('global-search-input');

        const handleScroll = () => {
            if (window.scrollY > 16) {
                siteChrome.classList.add('scrolled');
            } else {
                siteChrome.classList.remove('scrolled');
            }
            updateActiveSectionNav();
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        // Al salir con el cursor de un item de menú, restaurar su capacidad de hover
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('mouseleave', () => {
                item.classList.remove('force-closed');
            });
            item.addEventListener('mouseenter', () => {
                item.classList.remove('force-closed');
            });
        });

        // Botón hamburguesa móvil
        if (mobileBtn && mainNav) {
            mobileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileBtn.classList.toggle('active');
                mainNav.classList.toggle('mobile-open');
            });
        }

        // Cerrar menú hamburguesa si se hace clic fuera del recuadro recortado
        document.addEventListener('click', (e) => {
            if (mainNav && mainNav.classList.contains('mobile-open')) {
                if (!mainNav.contains(e.target) && (!mobileBtn || !mobileBtn.contains(e.target))) {
                    closeAllMenus();
                }
            }
        });

        // Desplegables en móvil
        document.querySelectorAll('[data-dropdown-toggle]').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const parentItem = toggle.closest('.nav-item');
                if (window.innerWidth <= 960 && parentItem) {
                    e.preventDefault();
                    const isOpen = parentItem.classList.contains('open');
                    document.querySelectorAll('.nav-item.open').forEach(item => item.classList.remove('open'));
                    if (!isOpen) parentItem.classList.add('open');
                }
            });
        });

        // Enlaces de filtro de tienda desde el menú, hero o sección destacada
        document.querySelectorAll('[data-store-filter]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const filterKey = el.getAttribute('data-store-filter');
                closeAllMenus();
                applyStoreFilter(filterKey);
                scrollToSection('#tienda');
            });
        });

        // Enlaces de las 3 Bicicletas Destacadas del Menú -> Tienda + Abre Ficha
        document.querySelectorAll('[data-open-product-sku]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const sku = el.getAttribute('data-open-product-sku');
                closeAllMenus();
                scrollToSection('#tienda');
                const product = state.products.find(p => p.sku === sku || p.id === sku);
                if (product) {
                    setTimeout(() => openProductSheet(product.id), 450);
                }
            });
        });

        // Enlaces de scroll suave a secciones
        document.querySelectorAll('[data-scroll-to]').forEach(el => {
            el.addEventListener('click', (e) => {
                const target = el.getAttribute('data-scroll-to');
                if (target) {
                    e.preventDefault();
                    closeAllMenus();
                    scrollToSection(target);
                }
            });
        });

        // Buscador desplegable del header
        if (searchBtn && searchDrawer && searchInput) {
            searchBtn.addEventListener('click', () => {
                searchDrawer.classList.toggle('open');
                searchBtn.classList.toggle('active');
                if (searchDrawer.classList.contains('open')) {
                    setTimeout(() => searchInput.focus(), 100);
                }
            });

            if (closeSearchBtn) {
                closeSearchBtn.addEventListener('click', () => {
                    searchDrawer.classList.remove('open');
                    searchBtn.classList.remove('active');
                });
            }

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = searchInput.value.trim();
                    if (query) {
                        applyStoreSearch(query);
                        searchDrawer.classList.remove('open');
                        searchBtn.classList.remove('active');
                        scrollToSection('#tienda');
                    }
                }
            });

            searchInput.addEventListener('input', () => {
                const query = searchInput.value.trim();
                const inlineInput = document.getElementById('store-inline-search-input');
                if (inlineInput) inlineInput.value = query;
                if (query.length >= 2) {
                    applyStoreSearch(query);
                } else if (query.length === 0) {
                    resetStoreToFeatured();
                }
            });
        }
    }

    /**
     * Repliega inmediatamente cualquier menú desplegable abierto (tanto en PC como en Móvil)
     * para garantizar visibilidad limpia al desplazarse a la sección seleccionada.
     */
    function closeAllMenus() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('open');
            item.classList.add('force-closed');
        });
        const mobileBtn = document.getElementById('btn-mobile-menu');
        const mainNav = document.getElementById('main-nav');
        const searchDrawer = document.getElementById('search-bar-drawer');
        const searchBtn = document.getElementById('btn-toggle-search');
        if (mobileBtn) mobileBtn.classList.remove('active');
        if (mainNav) mainNav.classList.remove('mobile-open');
        if (searchDrawer) searchDrawer.classList.remove('open');
        if (searchBtn) searchBtn.classList.remove('active');
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    }

    function updateActiveSectionNav() {
        const scrollPos = window.scrollY + 190;
        const tiendaEl = document.getElementById('tienda');
        const tallerEl = document.getElementById('taller');
        const noticiasEl = document.getElementById('noticias');

        document.querySelectorAll('.main-nav .nav-link').forEach(l => l.classList.remove('active'));

        if (noticiasEl && scrollPos >= noticiasEl.offsetTop) {
            const com = document.querySelector('[data-nav-section="comunidad"] > .nav-link');
            if (com) com.classList.add('active');
        } else if (tallerEl && scrollPos >= tallerEl.offsetTop) {
            const tal = document.querySelector('[data-nav-section="taller"] > .nav-link');
            if (tal) tal.classList.add('active');
        } else if (tiendaEl && scrollPos >= tiendaEl.offsetTop) {
            const bic = document.querySelector('[data-nav-section="tienda"] > .nav-link');
            if (bic) bic.classList.add('active');
        }
    }

    /* ========================================================================
       3. HERO DE 2 SLIDES (Trek-web-02.jpg)
       Solo botones circulares 1 y 2 alineados abajo a la derecha y
       tiempo entre slides ampliado a más de 10 segundos (12,000 ms).
       ======================================================================== */
    function initHeroSlider() {
        const slides = Array.from(document.querySelectorAll('.hero-slide'));
        const dots = Array.from(document.querySelectorAll('[data-hero-go]'));
        const slideVideo = document.getElementById('hero-slide-video');

        if (!slides.length) return;

        if (slideVideo) {
            // Desactivar loop para que el evento 'ended' se dispare exactamente al terminar el video completo
            slideVideo.loop = false;
        }

        const clearHeroTimer = () => {
            if (state.heroTimer) {
                clearTimeout(state.heroTimer);
                clearInterval(state.heroTimer);
                state.heroTimer = null;
            }
        };

        const scheduleCurrentSlideAdvance = () => {
            clearHeroTimer();

            // En el Slide 1 (imagen fija) esperamos 12 segundos antes de pasar al Slide 2.
            // En el Slide 2 (video) NO cortamos con temporizador fijo: esperamos a que el video
            // termine de reproducirse por completo (evento 'ended') antes de regresar al Slide 1.
            if (state.heroSlideIndex === 0) {
                state.heroTimer = setTimeout(() => {
                    goToSlide(1);
                }, 12000);
            } else if (!slideVideo) {
                state.heroTimer = setTimeout(() => {
                    goToSlide(0);
                }, 15500);
            }
        };

        const goToSlide = (index) => {
            clearHeroTimer();
            state.heroSlideIndex = (index + slides.length) % slides.length;
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === state.heroSlideIndex);
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === state.heroSlideIndex);
            });

            if (slideVideo) {
                if (state.heroSlideIndex === 1) {
                    slideVideo.loop = false;
                    slideVideo.currentTime = 0;
                    const playPromise = slideVideo.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(() => {
                            // Respaldo solo si el navegador bloquea la reproducción automática
                            state.heroTimer = setTimeout(() => {
                                goToSlide(0);
                            }, 15500);
                        });
                    }
                } else {
                    slideVideo.pause();
                }
            }

            scheduleCurrentSlideAdvance();
        };

        if (slideVideo) {
            slideVideo.addEventListener('ended', () => {
                if (state.heroSlideIndex === 1) {
                    goToSlide(0);
                }
            });
        }

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const idx = parseInt(dot.getAttribute('data-hero-go'), 10) || 0;
                goToSlide(idx);
            });
        });

        state.resetHeroToStart = () => goToSlide(0);

        scheduleCurrentSlideAdvance();
    }

    /* ========================================================================
       4. TIENDA EN LÍNEA: AGENTE SINCRONIZADOR + CATALOGADOR + QUITA-FONDOS
       Lee el inventario real desde window.ASCEND_RMS_SYNC.productos (67 ítems:
       56 SKUs reales de inventario Ascend RMS + 11 ejemplos de equipamiento)
       sin fotos de relleno, y filtra con precisión estricta por categoría.
       ======================================================================== */
    function normalizeAscendProduct(rawProd, index) {
        const sku = rawProd.sku || rawProd.id || `SKU-${index + 1}`;
        const customEdit = state.customInventoryEdits[sku] || {};
        const overrideImg = state.customImgOverrides[sku];
        const overrideGallery = state.customGalleryOverrides[sku];

        const displayTitle = customEdit.name || rawProd.display_title || rawProd.title || rawProd.name || 'PRODUCTO CORDILLERA';
        const fullTitle = rawProd.title || rawProd.name || displayTitle;
        const brand = (customEdit.brand || rawProd.brand || 'TREK').toUpperCase();
        const displayCategory = customEdit.category || rawProd.display_category || rawProd.category || 'EQUIPAMIENTO';
        const price = customEdit.price !== undefined ? Number(customEdit.price) : (Number(rawProd.price) || 0);
        const stock = customEdit.stock !== undefined ? Number(customEdit.stock) : (Number(rawProd.stock) || 1);

        const pngImg = overrideImg || rawProd.img || rawProd.image_png || rawProd.image || 'assets/images/productos/rail-8-negro-dorado.png';
        const hdImg = overrideImg || rawProd.img_hd || rawProd.image_jpg || pngImg;

        // Sin fotos de relleno: usar únicamente las fotos reales del producto (o las subidas por el usuario)
        let gallery = [];
        if (Array.isArray(overrideGallery) && overrideGallery.length) {
            gallery = [...overrideGallery];
        } else if (Array.isArray(rawProd.gallery) && rawProd.gallery.length) {
            gallery = [...rawProd.gallery];
        } else {
            gallery = [pngImg];
        }

        if (overrideImg) {
            gallery = [overrideImg, ...gallery.filter(url => url !== overrideImg)];
        }

        // Eliminar duplicados accidentales para no repetir la misma foto como relleno
        gallery = Array.from(new Set(gallery.filter(Boolean)));
        if (!gallery.length) {
            gallery = [pngImg];
        }

        return {
            id: sku,
            sku,
            name: displayTitle,
            fullTitle,
            brand,
            category: displayCategory,
            rawCategory: rawProd.category || displayCategory,
            subcategory: rawProd.subcategory || '',
            modality: rawProd.modality || '',
            price,
            stock,
            image: pngImg,
            image_png: pngImg,
            image_jpg: hdImg,
            gallery,
            filter_tags: Array.isArray(rawProd.filter_tags) ? rawProd.filter_tags : [brand, displayCategory],
            initial_featured: Boolean(rawProd.initial_featured),
            is_inventory_processed: rawProd.is_inventory_processed !== false,
            desc: rawProd.desc || ''
        };
    }

    function updateStoreFilterButtonsState(mode) {
        const btnFeatured = document.getElementById('btn-store-show-featured');
        const btnAll = document.getElementById('btn-store-show-all');
        if (btnFeatured) btnFeatured.classList.toggle('active', mode === 'featured');
        if (btnAll) btnAll.classList.toggle('active', mode === 'all');
    }

    function syncQuickCategorySelect(value) {
        if (value === '__featured__') {
            updateStoreFilterButtonsState('featured');
        } else if (value === '__all__') {
            updateStoreFilterButtonsState('all');
        } else {
            updateStoreFilterButtonsState('custom');
        }
    }

    function initOnlineStore() {
        const rmsSource = (window.ASCEND_RMS_SYNC && Array.isArray(window.ASCEND_RMS_SYNC.productos))
            ? window.ASCEND_RMS_SYNC.productos
            : (window.ASCEND_SYNC_DATA && Array.isArray(window.ASCEND_SYNC_DATA.products) ? window.ASCEND_SYNC_DATA.products : []);

        state.products = rmsSource
            .map((prod, idx) => normalizeAscendProduct(prod, idx))
            .filter(prod => prod.stock > 0 && prod.price > 0);

        // Cargar registros en cuarentena (stock <= 0) para el Agente Depurador
        const quarantineList = (window.ASCEND_RMS_SYNC && Array.isArray(window.ASCEND_RMS_SYNC.lista_roja_cuarentena))
            ? window.ASCEND_RMS_SYNC.lista_roja_cuarentena
            : [];
        state.quarantineProducts = quarantineList;

        // Iniciar con el catálogo preseleccionado (las 3 bicicletas destacadas + 1 de cada categoría)
        resetStoreToFeatured();

        const btnFeatured = document.getElementById('btn-store-show-featured');
        const btnAll = document.getElementById('btn-store-show-all');
        const quickSelect = document.getElementById('store-category-quick-select');
        const prevBtn = document.getElementById('store-prev-btn');
        const nextBtn = document.getElementById('store-next-btn');
        const inlineSearchForm = document.getElementById('store-inline-search-form');
        const inlineSearchInput = document.getElementById('store-inline-search-input');

        if (quickSelect) {
            quickSelect.addEventListener('change', () => {
                const val = quickSelect.value;
                if (inlineSearchInput) inlineSearchInput.value = '';
                if (val === '__featured__') {
                    resetStoreToFeatured();
                } else if (val === '__all__') {
                    state.filteredProducts = [...state.products];
                    state.activeFilterLabel = `Catálogo Completo Ascend RMS (${state.products.length} productos)`;
                    state.storeSlideIndex = 0;
                    renderStoreProducts();
                } else {
                    applyStoreFilter(val);
                }
            });
        }

        if (inlineSearchForm && inlineSearchInput) {
            inlineSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = inlineSearchInput.value.trim();
                if (query) {
                    applyStoreSearch(query);
                } else {
                    resetStoreToFeatured();
                }
            });

            inlineSearchInput.addEventListener('input', () => {
                const query = inlineSearchInput.value.trim();
                if (query.length >= 2) {
                    applyStoreSearch(query);
                } else if (query.length === 0) {
                    resetStoreToFeatured();
                }
            });
        }

        if (btnFeatured) {
            btnFeatured.addEventListener('click', () => {
                if (inlineSearchInput) inlineSearchInput.value = '';
                resetStoreToFeatured();
            });
        }

        if (btnAll) {
            btnAll.addEventListener('click', () => {
                if (inlineSearchInput) inlineSearchInput.value = '';
                syncQuickCategorySelect('__all__');
                state.filteredProducts = [...state.products];
                state.activeFilterLabel = `Catálogo Completo Ascend RMS (${state.products.length} productos)`;
                state.storeSlideIndex = 0;
                renderStoreProducts();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => moveStoreCarousel(-1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => moveStoreCarousel(1));
        }

        window.addEventListener('resize', () => {
            updateStoreCarouselPosition();
        });
    }

    function resetStoreToFeatured() {
        const featuredList = state.products.filter(p => p.initial_featured);
        state.filteredProducts = featuredList.length ? featuredList : state.products.slice(0, 12);
        state.activeFilterLabel = `Selección Destacada (${state.filteredProducts.length} de ${state.products.length} en inventario)`;
        state.storeSlideIndex = 0;
        syncQuickCategorySelect('__featured__');
        renderStoreProducts();
    }

    function applyStoreFilter(filterTag) {
        const norm = (filterTag || '').toLowerCase().trim();
        syncQuickCategorySelect(filterTag);

        // Filtrado estricto por etiquetas canónicas para evitar que se cuelen productos de otras categorías
        const matches = state.products.filter(prod => {
            const tags = Array.isArray(prod.filter_tags)
                ? prod.filter_tags.map(t => String(t).toLowerCase().trim())
                : [];
            if (tags.includes(norm)) return true;
            if ((prod.brand || '').toLowerCase().trim() === norm) return true;
            if ((prod.subcategory || '').toLowerCase().trim() === norm) return true;
            if ((prod.modality || '').toLowerCase().trim() === norm) return true;
            if ((prod.category || '').toLowerCase().trim() === norm) return true;
            return false;
        });

        state.filteredProducts = matches;
        state.activeFilterLabel = `Categoría: ${filterTag} (${matches.length} producto${matches.length === 1 ? '' : 's'})`;
        state.storeSlideIndex = 0;
        renderStoreProducts();
    }

    function applyStoreSearch(query) {
        const q = (query || '').toLowerCase().trim();
        const matches = state.products.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.fullTitle || '').toLowerCase().includes(q) ||
            (p.brand || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q) ||
            (p.rawCategory || '').toLowerCase().includes(q) ||
            (p.subcategory || '').toLowerCase().includes(q) ||
            (p.sku || '').toLowerCase().includes(q)
        );
        state.filteredProducts = matches;
        state.activeFilterLabel = `Búsqueda: "${query}" (${matches.length} resultados)`;
        state.storeSlideIndex = 0;
        renderStoreProducts();
    }

    function getBrandPillClass(brand) {
        const b = (brand || '').toUpperCase();
        if (b === 'CANNONDALE') return 'product-brand-pill brand-cannondale';
        if (b === 'ALUBIKE') return 'product-brand-pill brand-alubike';
        return 'product-brand-pill';
    }

    function renderStoreProducts() {
        const track = document.getElementById('store-products-track');
        const filterPill = document.getElementById('store-active-filter-pill');

        if (!track) return;
        if (filterPill) filterPill.textContent = state.activeFilterLabel;

        if (!state.filteredProducts.length) {
            track.innerHTML = `
                <div style="padding:48px 0;width:100%;text-align:center;">
                    <p style="font-size:1.05rem;margin-bottom:16px;">No encontramos productos con ese término de búsqueda.</p>
                    <button type="button" class="btn-pill-cta btn-pill-orange" id="btn-empty-reset">
                        <span>Ver Selección Destacada</span>
                    </button>
                </div>
            `;
            const resetBtn = document.getElementById('btn-empty-reset');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    const inlineInput = document.getElementById('store-inline-search-input');
                    if (inlineInput) inlineInput.value = '';
                    resetStoreToFeatured();
                });
            }
            return;
        }

        // Diseño exacto a Trek-web-03.jpg:
        // Marca + Categoría arriba en la misma fila, foto .png sin fondo en medio,
        // Título café abajo y fila con Precio a la izquierda + Botón Carrito naranja a la derecha.
        track.innerHTML = state.filteredProducts.map(product => {
            const imgSrc = product.image_png || product.image;
            const brandClass = getBrandPillClass(product.brand);
            return `
                <article class="store-product-item" data-product-id="${product.id}">
                    <div class="product-item-top">
                        <span class="${brandClass}">${product.brand}</span>
                        <span class="product-category-label">${product.category}</span>
                    </div>

                    <div class="product-image-trigger" data-open-sheet="${product.id}" title="Ver ficha técnica de ${product.name}">
                        <img src="${imgSrc}" alt="${product.name}" class="product-img-cutout" loading="lazy">
                    </div>

                    <div class="product-item-bottom">
                        <div class="product-info-clickable" data-open-sheet="${product.id}">
                            <h3 class="product-title-heading">${product.name}</h3>
                        </div>
                        <div class="product-price-cart-row">
                            <div class="product-price-text" data-open-sheet="${product.id}">${formatCurrency(product.price)}</div>
                            <button type="button" class="btn-product-cart" data-add-cart="${product.id}" aria-label="Agregar ${product.name} al carrito" title="Agregar al carrito">
                                <img src="assets/images/carrito.svg" alt="Carrito">
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        track.querySelectorAll('[data-open-sheet]').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const prodId = trigger.getAttribute('data-open-sheet');
                openProductSheet(prodId);
            });
        });

        track.querySelectorAll('[data-add-cart]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const prodId = btn.getAttribute('data-add-cart');
                addToCart(prodId, 1);
            });
        });

        updateStoreCarouselPosition();
    }

    function getStoreVisibleCols() {
        if (window.innerWidth <= 768) return 2;
        if (window.innerWidth <= 1100) return 2;
        return 3;
    }

    function moveStoreCarousel(direction) {
        if (window.innerWidth <= 768) return;
        const visibleCols = getStoreVisibleCols();
        const maxIndex = Math.max(0, state.filteredProducts.length - visibleCols);
        state.storeSlideIndex += direction;
        if (state.storeSlideIndex < 0) state.storeSlideIndex = maxIndex;
        if (state.storeSlideIndex > maxIndex) state.storeSlideIndex = 0;
        updateStoreCarouselPosition();
    }

    function updateStoreCarouselPosition() {
        const track = document.getElementById('store-products-track');
        if (!track) return;
        if (window.innerWidth <= 768) {
            track.style.transform = 'none';
            return;
        }
        const visibleCols = getStoreVisibleCols();
        const maxIndex = Math.max(0, state.filteredProducts.length - visibleCols);
        if (state.storeSlideIndex > maxIndex) state.storeSlideIndex = maxIndex;
        const stepPercent = 100 / visibleCols;
        track.style.transform = `translateX(-${state.storeSlideIndex * stepPercent}%)`;
    }

    /* ========================================================================
       5. FICHA DEL PRODUCTO (Trek-web-06.jpg) & SUB-FICHA CARRUSEL HD
       Genera especificaciones técnicas oficiales por modelo y marca.
       ======================================================================== */
    function formatTwoLineSheetTitle(product) {
        const sku = (product.sku || '').toUpperCase();
        if (sku === 'RAI16507841R') {
            return 'RAIL+ 8 GEN 5 M<br>NEGRO/DORADO';
        }
        if (sku === 'FUE2228474K') {
            return 'FUEL EXE 9.8 XT<br>XL NEGRO CARBONO';
        }
        if (sku === 'SUP30656724E') {
            return 'SUPER SIX EVO G4<br>TALLA 51 GRIS';
        }
        const words = (product.name || '').trim().split(/\s+/);
        if (words.length <= 3) return product.name;
        const splitIdx = Math.ceil(words.length / 2);
        return `${words.slice(0, splitIdx).join(' ')}<br>${words.slice(splitIdx).join(' ')}`;
    }

    function getOfficialBrandSpecs(product) {
        const rawTitle = (product.fullTitle || product.name || '').toUpperCase();
        const rawBrand = (product.brand || 'TREK').toUpperCase();
        const rawDept = (product.rawCategory || product.category || '').toUpperCase();
        const rawSku = (product.sku || '').toUpperCase();
        const fullText = (rawTitle + ' ' + rawBrand + ' ' + rawDept + ' ' + rawSku).replace(/\s+/g, ' ');
        const norm = fullText.replace(/\s*\+\s*/g, '+');

        const buildSpecsArray = (specObj) => {
            const labelMap = [
                ['cuadro', 'Cuadro'],
                ['suspension', 'Suspensión / Horquilla'],
                ['motor', 'Motor Eléctrico'],
                ['bateria', 'Batería'],
                ['display', 'Display y Control'],
                ['transmision', 'Transmisión'],
                ['desviador', 'Desviador / Cambio'],
                ['cassette', 'Cassette'],
                ['frenos', 'Frenos'],
                ['ruedas', 'Ruedas'],
                ['llantas', 'Neumáticos'],
                ['tija', 'Tija / Poste de Asiento'],
                ['peso', 'Peso Oficial'],
                ['garantia', 'Garantía Oficial'],
                ['fuente', 'Fuente Técnica Oficial']
            ];
            return labelMap
                .filter(([key]) => Boolean(specObj[key]))
                .map(([key, label]) => ({ label, value: specObj[key] }));
        };

        // =========================================================================
        // 1. E-BIKES / BICICLETAS ELÉCTRICAS (BOSCH & TQ MOTOR SYSTEMS)
        // =========================================================================

        // 1.1 Trek Marlin+ 6 (Eléctrica Bosch) - SKU: MAR20673171K
        if (norm.includes('MARLIN+6') || norm.includes('MARLIN+') || norm.includes('MAR20673171K') || (norm.includes('MARLIN') && (norm.includes('ELÉCTRICA') || norm.includes('ELECTRICA') || norm.includes('E-BIKE')))) {
            return buildSpecsArray({
                cuadro: 'Aluminio Alpha Gold con batería integrada oculta, guiado interno de cables y soportes para portabultos y salpicaderas.',
                suspension: 'SR Suntour XCM 32, eje pasante Boost110 de 15 mm, 120 mm de recorrido (talla XS: 100 mm).',
                motor: 'Bosch Active Line Plus, 50 Nm torque, asistencia inteligente hasta 25 km/h.',
                bateria: 'Bosch CompactTube 400 Wh integrada y desmontable.',
                display: 'Bosch Purion 200 a color con Bluetooth para app eBike Flow.',
                transmision: 'Shimano CUES U4000 1x9 velocidades con tecnología Linkglide reforzada para alto torque eléctrico.',
                cassette: 'Shimano LINKGLIDE LG300, 11-46T, 9 velocidades.',
                frenos: 'Tektro hidráulicos de 4 pistones con discos de 203 mm para e-bike.',
                ruedas: 'Bontrager Connection, doble pared, 32 agujeros, 29" (tallas XS/S: 27.5").',
                llantas: 'Bontrager Gunnison Pro XR, Tubeless Ready, aro de aramida, 60 tpi, 29x2.60".',
                peso: '21.30 kg / 46.96 lbs con batería incluida (límite de peso máximo del ciclista + carga: 136 kg).',
                garantia: 'Garantía oficial de por vida en cuadro Trek + 2 años de garantía oficial en motor y batería Bosch.',
                fuente: 'Trek Bikes & Bosch eBike Systems Official Technical Manual'
            });
        }

        // 1.2 Trek Rail / Rail+ (Eléctrica Enduro Bosch CX) - SKUs: RAI16507841R, RAI31756369Y
        if (norm.includes('RAIL+') || (norm.includes('RAIL') && !norm.includes('TRAIL')) || norm.includes('RAI16507841R') || norm.includes('RAI31756369Y')) {
            return buildSpecsArray({
                cuadro: 'Aluminio Alpha Platinum, batería integrada extraíble (RIB 2.0), tubo de dirección perfilado, guiado interno Control Freak, Motor Armor, geometría Mino Link ajustable y eje Boost148 de 160 mm de recorrido.',
                suspension: 'RockShox Domain Gold RC / Yari RC de 160 mm con DebonAir y amortiguador trasero RockShox Deluxe Select+ RT de 230 x 65 mm.',
                motor: 'Bosch Performance Line CX Smart System, cuerpo de magnesio, 85 Nm de par motor máximo y asistencia inteligente eMTB hasta 25 km/h.',
                bateria: 'Bosch PowerTube 800 Wh / 625 Wh integrada en cuadro con sistema RIB (Removable Integrated Battery).',
                display: 'Bosch System Controller / Kiox 300 con mando inalámbrico Mini Remote / LED Remote y navegación vía app eBike Flow.',
                transmision: 'Shimano Deore / XT M8100 1x12 velocidades optimizada para alto torque eléctrico.',
                cassette: 'Shimano Deore M6100, 10-51T, 12 velocidades.',
                frenos: 'Frenos de disco hidráulicos de 4 pistones SRAM DB8 / Shimano con rotores sobredimensionados de 200/203 mm para e-MTB.',
                ruedas: 'Bontrager Line Comp 30, Tubeless Ready, Rapid Drive 108 dientes, Boost148 trasero.',
                llantas: 'Bontrager SE5 Team Issue, Tubeless Ready, flancos Core Strength, aro de aramida, 29x2.50".',
                tija: 'Bontrager Line Dropper telescópica con guiado interno.',
                peso: '23.40 kg / 51.59 lbs con batería.',
                garantia: 'Garantía oficial de por vida en cuadro Trek + 2 años en sistema eléctrico Bosch.',
                fuente: 'Trek Bikes & Bosch Performance Line CX Smart System Official Datasheet'
            });
        }

        // 1.3 Trek Fuel EXe 9.8 XT (Light e-MTB TQ HPR50) - SKU: FUE2228474K
        if (norm.includes('FUEL EXE') || norm.includes('FUE2228474K')) {
            return buildSpecsArray({
                cuadro: 'Carbono OCLV Mountain completo, batería extraíble integrada, compartimento interno, geometría ajustable Mino Link, 140 mm de recorrido.',
                suspension: 'RockShox Lyrik Select+ / FOX Performance 36 Float EVOL de 150 mm y amortiguador trasero RockShox Super Deluxe Select+ RT 205x60 mm.',
                motor: 'Motor de anillo armónico TQ-HPR50 (Harmonic Pin Ring), ultra silencioso y ultraligero (1.85 kg), 50 Nm de torque natural.',
                bateria: 'Batería TQ de 360 Wh integrada en tubo diagonal (compatible con Range Extender TQ de 160 Wh en portabidón).',
                display: 'Pantalla OLED de 2 pulgadas integrada al ras en el tubo superior con mando remoto ergonómico en manillar.',
                transmision: 'Shimano XT M8100 1x12 velocidades con bielas e*thirteen e*spec Race Carbon.',
                cassette: 'Shimano XT M8100, 10-51T, 12 velocidades.',
                frenos: 'Frenos de disco hidráulicos Shimano XT M8120 de 4 pistones con rotores Ice-Tech RT86 de 203 mm delantero / 180 mm trasero.',
                ruedas: 'Bontrager Line Elite 30 de carbono OCLV Mountain, Rapid Drive 108 dientes, Tubeless Ready.',
                llantas: 'Bontrager SE5 Team Issue 29x2.50" Tubeless Ready.',
                peso: '18.10 kg / 39.90 lbs (una de las e-MTB más ligeras del mundo).',
                garantia: 'Garantía oficial de por vida Trek Carbon Care + 2 años de garantía TQ e-Bike System.',
                fuente: 'Trek Bikes & TQ Group Germany Technical Whitepaper (Fuel EXe Series)'
            });
        }

        // =========================================================================
        // 2. MONTAÑA COMPETICIÓN & TRAIL (TREK & CANNONDALE)
        // =========================================================================

        // 2.1 Trek Top Fuel 8 & 9.8 Gen 4 - SKUs: TOP22914896B, TOP18118293R
        if (norm.includes('TOP FUEL') || norm.includes('TOP22914896B') || norm.includes('TOP18118293R')) {
            const isCarbon = norm.includes('9.8') || norm.includes('TOP18118293R');
            return buildSpecsArray({
                cuadro: isCarbon
                    ? 'Carbono OCLV Mountain completo, compartimento interno en tubo diagonal BITS, guiado interno de extremo a extremo, Mino Link, 120 mm de recorrido.'
                    : 'Aluminio Alpha Platinum, almacenamiento interno en tubo diagonal BITS, Mino Link, 120 mm de recorrido.',
                suspension: isCarbon
                    ? 'RockShox Pike Select+ Charger 3 RC2, 130 mm / amortiguador RockShox Deluxe Ultimate RCT.'
                    : 'Fox Rhythm 34 Float EVOL, amortiguador GRIP, 130 mm / amortiguador Fox Performance Float DPS.',
                transmision: isCarbon
                    ? 'Shimano Deore XT M8150 Di2 electrónico / XT mecánico 1x12 velocidades.'
                    : 'Shimano XT / SLX M7100 1x12 velocidades.',
                cassette: 'Shimano XT / SLX M7100, 10-51T, 12 velocidades.',
                frenos: 'Frenos de disco hidráulicos Shimano XT / SLX M7120 de 4 pistones con rotores RT70 de 180 mm.',
                ruedas: isCarbon
                    ? 'Bontrager Line Elite 30, Carbono OCLV Mountain, Tubeless Ready, Rapid Drive 108.'
                    : 'Bontrager Line Comp 30, Tubeless Ready, Rapid Drive 108.',
                llantas: 'Bontrager XR4 Team Issue, Tubeless Ready, flancos Inner Strength, 29x2.40".',
                tija: 'Bontrager Line Elite / Line Dropper telescópica con guiado interno.',
                peso: isCarbon ? '12.45 kg / 27.45 lbs.' : '14.10 kg / 31.08 lbs.',
                garantia: 'Garantía oficial de por vida en cuadro Trek (Lifetime Warranty).',
                fuente: isCarbon ? 'Trek Factory XC & Downcountry Specs (Top Fuel 9.8 XT Di2 Gen 4)' : 'Trek Downcountry Datasheet (Top Fuel 8 Gen 4)'
            });
        }

        // 2.2 Trek Procaliber 6 & 9.5 (Hardtail Competición XC con IsoSpeed) - SKUs: PRO294645922, PRO307703432, PRO38374634Y, PRO37273067Y
        if (norm.includes('PROCALIBER') || norm.includes('PRO294645922') || norm.includes('PRO307703432') || norm.includes('PRO38374634Y') || norm.includes('PRO37273067Y')) {
            const isCarbon = norm.includes('9.5') || norm.includes('PRO38374634Y');
            return buildSpecsArray({
                cuadro: isCarbon
                    ? 'Carbono OCLV Mountain con rótula IsoSpeed que absorbe vibraciones del sendero sin perder rigidez de pedaleo, eje pasante Boost148.'
                    : 'Aluminio Alpha Platinum, tubo de dirección perfilado, guiado interno de cables y dropper, eje pasante Boost148.',
                suspension: isCarbon
                    ? 'RockShox Judy SL, resorte Solo Air, bloqueo remoto TurnKey en manillar, Boost110, 100 mm de recorrido.'
                    : 'RockShox Judy Gold, resorte Solo Air, bloqueo remoto TurnKey en manillar, Boost110, 100 mm de recorrido.',
                transmision: 'Shimano Deore M6100 / XT M8100 1x12 velocidades con cambio Shadow RD+ y mando Rapidfire Plus.',
                cassette: 'Shimano Deore M6100, 10-51T, 12 velocidades Hyperglide+.',
                frenos: 'Frenos de disco hidráulicos Shimano MT200 / MT410 con rotores RT10 de 180 mm delantero / 160 mm trasero.',
                ruedas: 'Bontrager Kovee Comp, doble pared, Tubeless Ready, 28 agujeros, 29" (ancho interno 23 mm).',
                llantas: 'Bontrager Sainte-Anne Pro XR / XR2 Team Issue, Tubeless Ready, 29x2.20".',
                peso: isCarbon ? '11.88 kg / 26.19 lbs.' : '12.40 kg / 27.34 lbs.',
                garantia: 'Garantía oficial de por vida en cuadro Trek (Lifetime Warranty).',
                fuente: isCarbon ? 'Trek World Cup XC Datasheet (Procaliber 9.5 Carbon IsoSpeed)' : 'Trek Fast XC Official Specs (Procaliber 6)'
            });
        }

        // 2.3 Cannondale Habit 4 (Trail 29 Doble Suspensión) - SKUs: HAB24765361E, HAB24277511E
        if (norm.includes('HABIT') || norm.includes('HAB24765361E') || norm.includes('HAB24277511E')) {
            return buildSpecsArray({
                cuadro: 'Aluminio SmartForm C1, 130 mm de recorrido, cinemática Proportional Response específica por talla, eje pasante Boost148.',
                suspension: 'RockShox Recon RL Solo Air 140 mm / amortiguador trasero RockShox Deluxe Select DebonAir 210x55 mm.',
                transmision: 'Shimano Deore M6100 1x12 velocidades con tecnología Shadow RD+ antibalanceo.',
                cassette: 'Shimano Deore M6100, 10-51T, 12 velocidades.',
                frenos: 'Frenos de disco hidráulicos Shimano MT200 con rotores RT10 de 180 mm delantero y trasero.',
                ruedas: 'WTB STX i25 TCS, 32 agujeros, Tubeless Ready, bujes Shimano MT410 Boost.',
                llantas: 'Maxxis Dissector 29x2.4" EXO TR delantero / Maxxis Rekon 29x2.4" EXO TR trasero.',
                tija: 'Tija telescópica TranzX dropper post con mando remoto en manillar, recorrido de 130 a 150 mm según talla.',
                peso: '14.80 kg / 32.63 lbs.',
                garantia: 'Garantía oficial de por vida en cuadro Cannondale para el propietario original.',
                fuente: 'Cannondale Bicycles Official Technical Manual (Habit 4 Trail 29)'
            });
        }

        // 2.4 Cannondale Trail 1 & Trail 2 (Hardtail MTB) - SKUs: TRA23399625E, TRA21884899E, TRA27921679E
        if ((norm.includes('TRAIL') && norm.includes('CANNONDALE')) || norm.includes('TRA23399625E') || norm.includes('TRA21884899E') || norm.includes('TRA27921679E')) {
            const isTrail1 = norm.includes('TRAIL 1') || norm.includes('TRA23399625E') || norm.includes('TRA21884899E');
            return buildSpecsArray({
                cuadro: 'Aluminio SmartForm C2 / C3, tirantes SAVE micro-suspensión, tubo de dirección cónico, Boost QR.',
                suspension: isTrail1
                    ? 'RockShox Judy Silver TK, Solo Air, 100 mm de recorrido con bloqueo remoto en manillar PopLoc.'
                    : 'SR Suntour XCM-RL, resorte helicoidal, 100 mm con bloqueo remoto en manillar.',
                transmision: isTrail1
                    ? 'SRAM SX Eagle / Shimano Deore 1x12 velocidades.'
                    : 'microSHIFT Advent X / Shimano Deore 1x10 velocidades.',
                frenos: 'Frenos de disco hidráulicos Shimano MT200 / Tektro M275 con rotores de 180/160 mm.',
                ruedas: 'WTB SX19, doble pared, 32 agujeros, 29".',
                llantas: 'WTB Ranger Comp, 29x2.25", compuesto DNA.',
                peso: '13.60 kg / 29.98 lbs.',
                garantia: 'Garantía oficial de por vida en cuadro Cannondale.',
                fuente: 'Cannondale SmartForm Hardtail Official Specs (Trail Series)'
            });
        }

        // 2.5 Cannondale Kids Trail 20 - SKU: KID24199308E
        if (norm.includes('KIDS TRAIL') || norm.includes('KID24199308E')) {
            return buildSpecsArray({
                cuadro: 'Aluminio SmartForm C3 ligero, geometría adaptada a niños con baja altura de apoyo (standover bajo).',
                suspension: 'Horquilla SunTour XCT-JR 20, 40 mm de recorrido, resorte suave para bajo peso corporal.',
                transmision: 'microSHIFT 7 velocidades con mando giratorio RevoShift de fácil accionamiento con manos pequeñas.',
                frenos: 'Frenos V-brake de aluminio Promax con manetas de alcance corto regulables para dedos infantiles.',
                ruedas: 'Cannondale 20" de aluminio ligero con llantas multi-terreno 20x1.95".',
                garantia: 'Garantía oficial de por vida en cuadro Cannondale.',
                fuente: 'Cannondale Youth Geometry Manual (Kids Trail 20)'
            });
        }

        // =========================================================================
        // 3. GAMA TREK MARLIN GEN 3 & GEN 2 (HARDTAIL MONTAÑA)
        // =========================================================================

        // 3.1 Trek Marlin 7 Gen 3 - SKUs: MAR19133946T, MAR21269788E
        if (norm.includes('MARLIN 7') || norm.includes('MAR19133946T') || norm.includes('MAR21269788E')) {
            return buildSpecsArray({
                cuadro: 'Aluminio Alpha Silver, geometría moderna relajada (66.5° ángulo de dirección), guiado interno para dropper post, eje ThruSkew.',
                suspension: 'RockShox Judy Silver, resorte Solo Air ajustable según peso del ciclista, bloqueo TurnKey, 100 mm de recorrido.',
                transmision: 'Shimano Deore M5120 1x10 velocidades con embrague Shadow RD+ y mando Rapidfire Plus.',
                cassette: 'Shimano Deore M4100, 11-46T, 10 velocidades.',
                frenos: 'Frenos de disco hidráulicos Shimano MT200 con rotores RT26 de 180 mm delantero / 160 mm trasero.',
                ruedas: 'Bontrager Kovee, doble pared, Tubeless Ready, 28 agujeros, 29" (ancho interno 23 mm).',
                llantas: 'Bontrager XT3 Comp, aro rígido, 30 tpi, 29x2.40" (talla XS: 27.5x2.40").',
                peso: '14.60 kg / 32.19 lbs (Talla M). Límite de carga máxima: 136 kg.',
                garantia: 'Garantía oficial de por vida en cuadro Trek (Lifetime Warranty).',
                fuente: 'Trek Bikes Official Technical Manual (Marlin 7 Gen 3)'
            });
        }

        // 3.2 Trek Marlin 6 Gen 3 - SKUs: MAR38989209E, MAR31253013K, MAR14419582A, MAR1439354A, MAR1570023A, MAR16677398A, MAR32983611K
        if (norm.includes('MARLIN 6') || norm.includes('MAR38989209E') || norm.includes('MAR31253013K') || norm.includes('MAR14419582A') || norm.includes('MAR1439354A') || norm.includes('MAR1570023A') || norm.includes('MAR16677398A') || norm.includes('MAR32983611K')) {
            return buildSpecsArray({
                cuadro: 'Aluminio Alpha Silver, geometría moderna relajada (66.5° ángulo de dirección), guiado interno para dropper post, eje ThruSkew.',
                suspension: 'RockShox Judy / SR Suntour XCT 30, resorte helicoidal, precarga, bloqueo mecánico TurnKey, 100 mm de recorrido (talla XS: 80 mm).',
                transmision: 'Shimano Deore M4100 / CUES U4000, 1x10 velocidades con embrague Shadow RD+ antibalanceo de cadena.',
                desviador: 'Shimano Deore M5120 con palanca de tensión de cadena activable.',
                cassette: 'Shimano Deore M4100, 11-46T, 10 velocidades.',
                frenos: 'Frenos de disco hidráulicos Shimano MT200 / Tektro HD-M275 con rotores de 180 mm delantero / 160 mm trasero.',
                ruedas: 'Bontrager Kovee, doble pared, Tubeless Ready, 28 agujeros.',
                llantas: 'Bontrager XT3 Comp, 29x2.40" (tallas XS/S: 27.5x2.40").',
                peso: '14.50 kg / 31.97 lbs.',
                garantia: 'Garantía oficial de por vida en cuadro Trek.',
                fuente: 'Trek Bikes Official Technical Manual (Marlin 6 Gen 3)'
            });
        }

        // 3.3 Trek Marlin 5 Gen 3 - SKUs: MAR17219125D, MAR39160984K, MAR23432861E, MAR18647908D, MAR23695096E, MAR36195173E, MAR17981847D
        if (norm.includes('MARLIN 5') || norm.includes('MAR17219125D') || norm.includes('MAR39160984K') || norm.includes('MAR23432861E') || norm.includes('MAR18647908D') || norm.includes('MAR23695096E') || norm.includes('MAR36195173E') || norm.includes('MAR17981847D')) {
            return buildSpecsArray({
                cuadro: 'Aluminio Alpha Silver, guiado interno de cables y tija telescópica, soporte para portabultos y pata de cabra, eje ThruSkew 135x5 mm.',
                suspension: 'SR Suntour XCT 30, resorte helicoidal, precarga, bloqueo hidráulico, 100 mm de recorrido (talla XS: 80 mm).',
                transmision: 'Shimano CUES U4000 de 1x9 velocidades con mando Rapidfire Plus y display óptico.',
                desviador: 'Shimano CUES U4000 GS con tecnología Shadow RD antibalanceo de cadena.',
                cassette: 'Shimano LINKGLIDE LG300, 11-46T, 9 velocidades (3x mayor durabilidad ante desgaste).',
                frenos: 'Frenos de disco hidráulicos Tektro HD-M275, rotores Tektro 180 mm delantero / 160 mm trasero.',
                ruedas: 'Bontrager Connection, doble pared, 32 agujeros, ancho interior 20 mm.',
                llantas: 'Bontrager XT3 Comp, aro rígido, 30 tpi, 29x2.40" (tallas XS/S: 27.5x2.40").',
                peso: '15.10 kg / 33.29 lbs (Talla M). Límite de carga máxima: 136 kg.',
                garantia: 'Garantía oficial de por vida en cuadro Trek (Lifetime Warranty).',
                fuente: 'Trek Bikes Official Technical Manual (Marlin 5 Gen 3)'
            });
        }

        // 3.4 Trek Marlin 4 Gen 2 & Gen 3 - SKUs: MAR29286215E, MAR34557503K
        if (norm.includes('MARLIN 4') || norm.includes('MARLIN 2023') || norm.includes('MAR29286215E') || norm.includes('MAR34557503K')) {
            return buildSpecsArray({
                cuadro: 'Aluminio Alpha Silver, guiado interno de cables, soportes para portabultos y pata de apoyo.',
                suspension: 'SR Suntour XCE 28, resorte helicoidal, precarga, 100 mm de recorrido (talla XS: 80 mm).',
                transmision: 'Shimano Altus / Tourney 2x8 o 3x7 velocidades con mandos Shimano EF500.',
                frenos: 'Frenos de disco mecánicos Tektro MD-M280 con rotores de 160 mm.',
                ruedas: 'Bontrager Connection, doble pared, 32 agujeros.',
                llantas: 'Bontrager XR2 Comp, 29x2.20" (talla XS: 27.5x2.20").',
                peso: '14.40 kg / 31.75 lbs.',
                garantia: 'Garantía oficial de por vida en cuadro Trek.',
                fuente: 'Trek Bikes Official Datasheet (Marlin 4 Series)'
            });
        }

        // 3.5 Trek Roscoe (Trail agresivo 29) - SKU: CUA31442171K
        if (norm.includes('ROSCOE') || norm.includes('CUA31442171K')) {
            return buildSpecsArray({
                cuadro: 'Aluminio Alpha Platinum, tubo de dirección perfilado, guiado interno de cables y dropper, eje pasante Boost148, soporte para neumáticos 29x2.60".',
                suspension: 'Diseñado y optimizado para horquillas de 140 mm de recorrido con eje Boost110.',
                frenos: 'Soporte de freno de disco post-mount para rotores de 180 a 203 mm.',
                garantia: 'Garantía oficial de por vida en cuadro Trek para el comprador original.',
                fuente: 'Trek Trail Hardtail Official Manual (Roscoe Gen 4)'
            });
        }

        // =========================================================================
        // 4. RUTA & GRAN FONDO (TREK MADONE, DOMANE, EMONDA & CANNONDALE SUPERSIX)
        // =========================================================================

        // 4.1 Trek Madone SL 5 & SL Disc - SKUs: MAD23998394R, MAD17253947E
        if (norm.includes('MADONE') || norm.includes('MAD23998394R') || norm.includes('MAD17253947E')) {
            return buildSpecsArray({
                cuadro: 'Carbono OCLV Serie 500 aero con tecnología IsoFlow para disipación de vibraciones y ahorro de watts, guiado interno oculto.',
                suspension: 'Horquilla Madone KVF de carbono completo, tubo de dirección cónico, eje pasante 12x100 mm.',
                transmision: 'Shimano 105 R7100, 2x12 velocidades con relación de competencia profesional.',
                desviador: 'Shimano 105 R7100 Down-Swing 50-34T.',
                cassette: 'Shimano 105 R7100, 11-34T, 12 velocidades.',
                frenos: 'Frenos de disco hidráulicos Shimano 105 con rotores RT70 Ice-Tech 160 mm.',
                ruedas: 'Bontrager Aeolus Elite 35 / Paradigm SL Tubeless Ready.',
                llantas: 'Bontrager R1 / R3 Hard-Case Lite, 700x28c.',
                peso: '8.70 kg / 19.18 lbs.',
                garantia: 'Garantía oficial de por vida Trek Carbon Care Warranty.',
                fuente: 'Trek Factory Racing Aerodynamic Specs (Madone SL Series)'
            });
        }

        // 4.2 Trek Domane AL 2 & AL 4 Gen 4 - SKUs: DOM36819094E, DOM3721281K
        if (norm.includes('DOMANE') || norm.includes('DOM36819094E') || norm.includes('DOM3721281K')) {
            const isAL4 = norm.includes('AL 4') || norm.includes('DOM36819094E');
            return buildSpecsArray({
                cuadro: 'Aluminio Alpha Serie 100, geometría Endurance de alto confort para fondos largos, paso de rueda amplio hasta 38c.',
                suspension: 'Horquilla Domane de carbono completo, tubo de dirección perfilado de carbono, eje pasante 12x100 mm.',
                transmision: isAL4
                    ? 'Shimano Tiagra 4700 2x10 velocidades compact (50/34T).'
                    : 'Shimano Claris R2000 2x8 velocidades compact (50/34T).',
                frenos: isAL4
                    ? 'Frenos de disco hidráulicos Shimano Tiagra con rotores RT66 de 160 mm.'
                    : 'Frenos de disco mecánicos Tektro C550 de doble pistón con rotores de 160 mm.',
                ruedas: 'Bontrager Paradigm SL, Tubeless Ready, 24 hoyos, ancho interior 21 mm.',
                llantas: 'Bontrager R1 Hard-Case Lite, aro rígido, 60 tpi, 700x32c.',
                peso: isAL4 ? '10.35 kg / 22.82 lbs.' : '10.55 kg / 23.26 lbs.',
                garantia: 'Garantía oficial de por vida en cuadro Trek.',
                fuente: 'Trek Endurance Roadmap Datasheet (Domane AL Gen 4)'
            });
        }

        // 4.3 Trek Emonda ALR 5 - SKU: EMO36221095E
        if (norm.includes('EMONDA') || norm.includes('EMO36221095E')) {
            return buildSpecsArray({
                cuadro: 'Aluminio ultraligero Alpha Serie 300 con tecnología Invisible Weld de soldaduras pulidas invisibles, geometría H1.5 de carrera.',
                suspension: 'Horquilla Emonda de carbono completo OCLV, tubo cónico, eje pasante 12x100 mm.',
                transmision: 'Shimano 105 R7100 mecánico / Di2, 2x12 velocidades con bielas compact 50/34T.',
                cassette: 'Shimano 105 R7100, 11-34T, 12 velocidades.',
                frenos: 'Frenos de disco hidráulicos Shimano 105 con rotores RT70 Ice-Tech 160 mm.',
                ruedas: 'Bontrager Paradigm SL, Tubeless Ready, 24 agujeros.',
                peso: '8.85 kg / 19.51 lbs (cuadro de aluminio escalador más ligero de Trek).',
                garantia: 'Garantía oficial de por vida en cuadro Trek.',
                fuente: 'Trek Lightweight Climbing Datasheet (Emonda ALR 5 Series)'
            });
        }

        // 4.4 Cannondale SuperSix Evo 3 Gen 4 - SKU: SUP30656724E
        if (norm.includes('SUPER SIX') || norm.includes('SUPERSIX') || norm.includes('SUP30656724E')) {
            return buildSpecsArray({
                cuadro: 'Carbono SuperSix EVO Gen 4 de ultra bajo coeficiente aerodinámico, cableado interno Delta Steerer, eje pasante Syntace 12x142 mm y pedalier roscado BSA 68 mm.',
                suspension: 'Horquilla SuperSix EVO full carbon integrada con tubo de dirección Delta y avance integrado.',
                transmision: 'Shimano 105 Di2 R7150 electrónico de 2x12 velocidades con bielas 50/34T.',
                cassette: 'Shimano 105 R7100, 11-34T, 12 velocidades.',
                frenos: 'Frenos de disco hidráulicos Shimano 105 R7170 flat-mount con rotores RT70 de 160 mm.',
                ruedas: 'DT Swiss R470 db de aluminio ligero, ancho interno 20 mm, Tubeless Ready.',
                llantas: 'Vittoria Rubino Pro Bright Black, 700x25c con banda reflectante.',
                tija: 'Poste de asiento aerodinámico Cannondale C1 Aero 40 Carbon.',
                peso: '8.20 kg / 18.08 lbs.',
                garantia: 'Garantía oficial de por vida en cuadro Cannondale.',
                fuente: 'Cannondale Aerodynamic Road Racing Whitepaper (SuperSix EVO 3 Gen 4)'
            });
        }

        // =========================================================================
        // 5. FITNESS & HÍBRIDAS (TREK FX SERIES)
        // =========================================================================

        // 5.1 Trek FX 1 & FX Sport AL 3 - SKUs: FX114224597R, FXS24636470D
        if (norm.includes('FX 1') || norm.includes('FX SPORT') || norm.includes('FX114224597R') || norm.includes('FXS24636470D')) {
            const isSport = norm.includes('SPORT') || norm.includes('FXS24636470D');
            return buildSpecsArray({
                cuadro: isSport
                    ? 'Aluminio Alpha Gold, guiado interno de cables, geometría deportiva ergonómica, frenos de disco flat mount.'
                    : 'Aluminio Alpha Gold, guiado interno de cables, soportes para salpicaderas y portabultos.',
                suspension: 'Horquilla de aleación ligera FX Steel / Carbon con soportes para portabultos Lowrider.',
                transmision: isSport
                    ? 'Shimano CUES / Sora 2x9 velocidades con mando Rapidfire.'
                    : 'Shimano Altus 2x8 velocidades con mando Shimano EF500.',
                frenos: isSport
                    ? 'Frenos de disco hidráulicos Shimano con rotores de 160 mm.'
                    : 'Frenos de disco mecánicos Tektro con rotores de 160 mm.',
                ruedas: 'Bontrager Connection, doble pared, 32 agujeros.',
                llantas: 'Bontrager H2 Comp, 700x35c / 700x32c con banda reflectante de seguridad nocturna.',
                peso: isSport ? '11.20 kg / 24.69 lbs.' : '12.45 kg / 27.45 lbs.',
                garantia: 'Garantía oficial de por vida en cuadro Trek.',
                fuente: isSport ? 'Trek Fast Fitness Roadmap (FX Sport AL 3)' : 'Trek City & Commuter Manual (FX 1 Gen 4)'
            });
        }

        // =========================================================================
        // 6. GAMA MEXICANA ALUBIKE (XTA & SIERRA SERIES)
        // =========================================================================

        // 6.1 Alubike XTA 1.0, 2.0 & 3.0 - SKUs: XTA20443263E, XTA22268491E, XTA22941471E, XTA19972908E, XTA2414870E
        if (norm.includes('XTA') || norm.includes('XTA20443263E') || norm.includes('XTA22268491E') || norm.includes('XTA22941471E') || norm.includes('XTA19972908E') || norm.includes('XTA2414870E')) {
            const isXTA3 = norm.includes('3.0') || norm.includes('XTA2414870E');
            const isXTA2 = norm.includes('2.0') || norm.includes('XTA22941471E') || norm.includes('XTA19972908E');
            return buildSpecsArray({
                cuadro: 'Aluminio 6061 XTA hidroformado de doble espesor con soldaduras reforzadas T6 y guiado interno de cables.',
                suspension: isXTA3
                    ? 'Horquilla de aire con barras anodizadas de 32 mm, bloqueo remoto en manillar y 100 mm de recorrido.'
                    : 'Horquilla de suspensión SR Suntour XCM con bloqueo hidráulico al hombro, 100 mm de recorrido.',
                transmision: isXTA3
                    ? 'Shimano Deore M6100 1x12 velocidades con monoplato 32T y embrague Shadow RD+.'
                    : (isXTA2 ? 'Shimano Deore / CUES 1x10 velocidades con relación amplia.' : 'Shimano CUES / Altus 2x9 velocidades.'),
                frenos: 'Frenos de disco hidráulicos Shimano MT200 con rotores de 160 mm.',
                ruedas: 'Rines de aluminio doble pared Alubike 29" con mazas de balero sellado.',
                llantas: 'Maxxis / Kenda 29x2.25" de alto rodaje.',
                peso: '13.80 kg / 30.42 lbs.',
                garantia: 'Garantía oficial de fábrica Alubike México con respaldo en Taller Certificado Cordillera Trek.',
                fuente: 'Alubike México Ficha Técnica Oficial (Gama XTA MTB 29)'
            });
        }

        // 6.2 Alubike Sierra 20 & 29 - SKUs: SIE24530659E, SIE20176138E, SIE19858412E, SIE22508971E
        if (norm.includes('SIERRA') || norm.includes('SIE24530659E') || norm.includes('SIE20176138E') || norm.includes('SIE19858412E') || norm.includes('SIE22508971E')) {
            const is20 = norm.includes('R20') || norm.includes(' 20 ') || norm.includes('SIE19858412E') || norm.includes('SIE22508971E');
            return buildSpecsArray({
                cuadro: 'Aluminio 6061 Sierra con geometría recreativa de fácil ascenso y manejo cómodo ergonómico.',
                suspension: is20
                    ? 'Horquilla rígida de aleación ligera o suspensión corta de 40 mm para niños.'
                    : 'Horquilla de suspensión delantera 80 mm de recorrido con resorte de confort.',
                transmision: is20
                    ? 'Shimano Tourney 6/7 velocidades con mando giratorio.'
                    : 'Shimano Tourney 3x7 velocidades (21 velocidades) con mandos integrados.',
                frenos: 'Frenos de disco mecánicos con rotores de 160 mm (potencia de frenado en todo clima).',
                ruedas: is20
                    ? 'Rines de aluminio 20" con llantas 20x2.0".'
                    : 'Rines de aluminio 29" doble pared con llantas multi-terreno 29x2.10".',
                garantia: 'Garantía oficial de fábrica Alubike respaldada por Cordillera Trek Coronado #1130.',
                fuente: 'Alubike México Ficha Técnica Oficial (Sierra Recreativa)'
            });
        }

        // =========================================================================
        // 7. INFANTIL & ACCESORIOS (TREK PRECALIBER, REMOLQUE & ROCKBROS)
        // =========================================================================

        // 7.1 Trek Precaliber 16, 20 & 24 - SKUs: PRE21969082K, PRE26177715K, PRE27297304Y, PRE36843695K
        if (norm.includes('PRECALIBER') || norm.includes('PRE21969082K') || norm.includes('PRE26177715K') || norm.includes('PRE27297304Y') || norm.includes('PRE36843695K')) {
            const is24 = norm.includes('24') || norm.includes('PRE36843695K');
            const is16 = norm.includes('16') || norm.includes('PRE21969082K') || norm.includes('PRE26177715K');
            return buildSpecsArray({
                cuadro: 'Aluminio Alpha Silver Dialed Fit con geometría ergonómica especial para niños (longitud de biela y ancho de sillín adaptados).',
                suspension: is24
                    ? 'Horquilla con suspensión Dialed de 45 mm para senderos reales.'
                    : 'Horquilla rígida de aleación ligera para máxima facilidad de pedaleo.',
                transmision: is24
                    ? 'Shimano Tourney 8 velocidades con mando giratorio Shimano RS45 de fácil torsión.'
                    : 'Monomarcha (single speed) sencilla y sin mantenimiento.',
                frenos: is16
                    ? 'Freno contrapedal trasero + freno de mano delantero con maneta corta Dialed.'
                    : 'Frenos de tiro lineal V-brake de aleación con manetas Dialed de corto alcance.',
                ruedas: is16
                    ? 'Ruedas de 16" (rueditas de entrenamiento desmontables sin herramientas incluidas).'
                    : (is24 ? 'Ruedas de 24" con llantas Bontrager XR1 24x2.25".' : 'Ruedas de 20" de aluminio con llantas Bontrager XR1 20x2.25".'),
                peso: is16 ? '8.54 kg / 18.83 lbs.' : (is24 ? '11.90 kg / 26.24 lbs.' : '10.20 kg / 22.49 lbs.'),
                garantia: 'Garantía oficial de por vida en cuadro Trek.',
                fuente: 'Trek Dialed Fit Youth Manual (Precaliber Kids Series)'
            });
        }

        // 7.2 Trek Remolque MT-201 - SKU: REM25478026K
        if (norm.includes('REMOLQUE') || norm.includes('MT-201') || norm.includes('REM25478026K')) {
            return buildSpecsArray({
                cuadro: 'Estructura plegable de acero de alta resistencia con enganche universal pivotante de liberación rápida para tija de sillín.',
                transmision: 'Single speed con cubrecadena integral para máxima seguridad del niño.',
                ruedas: 'Rueda de 20" con rin de aleación ligera y bandera de seguridad reflectante de alta visibilidad incluida.',
                peso: 'Capacidad de carga máxima recomendada: hasta 38.5 kg.',
                garantia: 'Garantía oficial Trek.',
                fuente: 'Trek Family & Cargo Manual (Trailer MT-201)'
            });
        }

        // 7.3 Rockbros SX1 XRide Balance Bike - SKU: BIC38139744S
        if (norm.includes('ROCKBROS') || norm.includes('SX1') || norm.includes('BALANCE') || norm.includes('BIC38139744S')) {
            return buildSpecsArray({
                cuadro: 'Estructura integral de magnesio fundido sin soldaduras (superligera y resistente a la corrosión).',
                ruedas: 'Rines de 12 pulgadas con rodamientos sellados de baja fricción y llantas neumáticas de caucho con cámara.',
                peso: '3.20 kg / 7.05 lbs (ultraligera para que niños de 2 a 5 años la dominen con facilidad).',
                garantia: 'Garantía de calidad oficial con respaldo directo en tienda Cordillera Trek.',
                fuente: 'Rockbros Official Product Datasheet (SX1 XRide Magnesium)'
            });
        }

        // Fallback limpio para los ejemplos de equipamiento (1 foto sin relleno)
        return [
            {
                label: 'Producto Oficial',
                value: product.desc || `${product.fullTitle} — Distribuido oficialmente por Cordillera Trek Durango.`
            },
            {
                label: 'Marca y Categoría',
                value: `${product.brand} · ${product.rawCategory || product.category} (${product.subcategory || product.category}).`
            },
            {
                label: 'Disponibilidad en Tienda',
                value: `SKU #${product.sku} · ${product.stock} unidad(es) disponibles en sucursal Coronado #1130 Pte.`
            },
            {
                label: 'Garantía y Respaldo',
                value: 'Garantía directa contra defectos de fabricación y asesoría técnica en Taller Certificado Cordillera Trek.'
            }
        ];
    }

    function openProductSheet(productId) {
        const product = state.products.find(p => p.id === productId || p.sku === productId);
        if (!product) return;

        state.currentProductModal = product;

        const modal = document.getElementById('product-sheet-modal');
        const categoryRed = document.getElementById('sheet-category-red');
        const titleEl = document.getElementById('sheet-product-title');
        const skuEl = document.getElementById('sheet-sku-bullet');
        const priceEl = document.getElementById('sheet-price-coffee');
        const commercialList = document.getElementById('sheet-commercial-bullets');
        const specsList = document.getElementById('sheet-specs-list');
        const bentoGallery = document.getElementById('sheet-bento-gallery');
        const btnAddCart = document.getElementById('sheet-btn-add-cart');
        const btnWhatsapp = document.getElementById('sheet-btn-whatsapp');

        if (!modal) return;

        categoryRed.textContent = `${product.brand} ${product.category}`.toUpperCase();
        titleEl.innerHTML = formatTwoLineSheetTitle(product);
        skuEl.textContent = `SKU: #${product.sku}`;
        priceEl.textContent = formatCurrency(product.price);

        if (commercialList) {
            commercialList.innerHTML = `
                <li>Mensualidades de 3, 6 y 12.</li>
                <li>Entrega el mismo día gratis en Durango.</li>
                <li>Disponibilidad inmediata en tienda (${product.stock} en inventario Ascend RMS).</li>
                <li>Envío asegurado a toda la República Mexicana.</li>
                <li>Respaldo y garantía oficial en Taller Certificado Cordillera Trek.</li>
            `;
        }

        const specs = getOfficialBrandSpecs(product);
        if (specsList) {
            specsList.innerHTML = specs.map(s => `
                <div class="spec-block-item">
                    <strong>${s.label}:</strong>
                    <span>${s.value}</span>
                </div>
            `).join('');
        }

        // Construir galería SIN FOTOS DE RELLENO:
        // - Si el producto tiene varias fotos reales (como Rail+ 8 Gen 5 o bicicletas con galería subida),
        //   muestra 1 foto principal + la cuadrícula inferior con las fotos reales adicionales.
        // - Si el producto solo tiene 1 foto (su recorte .PNG sin fondo), muestra únicamente esa foto
        //   sin repetir ni rellenar con fotos ajenas.
        const rawGallery = Array.isArray(product.gallery) && product.gallery.length
            ? [...product.gallery]
            : [product.image_png || product.image];

        const galleryImages = Array.from(new Set(rawGallery.filter(Boolean)));
        if (!galleryImages.length) {
            galleryImages.push(product.image_png || product.image);
        }

        state.fullscreenGallery.images = galleryImages;

        const isTransparentCutoutUrl = (url) => {
            const s = String(url || '').toLowerCase();
            if (s.startsWith('data:image/png')) return true;
            if (!s.endsWith('.png')) return false;
            return !/_\d+\.png$/.test(s);
        };

        const isMainCutout = isTransparentCutoutUrl(galleryImages[0]);
        const extraImages = galleryImages.slice(1);

        if (extraImages.length > 0) {
            const subSquaresHTML = extraImages.map((imgUrl, idx) => {
                const isCutout = isTransparentCutoutUrl(imgUrl);
                return `
                    <div class="bento-square-thumb ${isCutout ? 'contain-mode' : ''}" data-fs-index="${idx + 1}" title="Ampliar fotografía ${idx + 2} en alta resolución">
                        <img src="${imgUrl}" alt="${product.name} vista ${idx + 2}">
                    </div>
                `;
            }).join('');

            bentoGallery.innerHTML = `
                <div class="bento-main-photo ${isMainCutout ? 'contain-mode' : ''}" data-fs-index="0" title="Haz clic para abrir el carrusel en tamaño completo y alta resolución">
                    <img src="${galleryImages[0]}" alt="${product.name}">
                </div>
                <div class="bento-subgrid">
                    ${subSquaresHTML}
                </div>
            `;
        } else {
            bentoGallery.innerHTML = `
                <div class="bento-main-photo single-photo-mode ${isMainCutout ? 'contain-mode' : ''}" data-fs-index="0" title="Haz clic para ampliar fotografía en tamaño completo">
                    <img src="${galleryImages[0]}" alt="${product.name}">
                </div>
            `;
        }

        bentoGallery.querySelectorAll('[data-fs-index]').forEach(box => {
            box.addEventListener('click', () => {
                const idx = parseInt(box.getAttribute('data-fs-index'), 10) || 0;
                openFullscreenGallery(galleryImages, idx);
            });
        });

        btnAddCart.onclick = () => {
            addToCart(product.id, 1);
        };

        const waText = encodeURIComponent(
            `Hola Cordillera Trek, me interesa el producto: ${product.name} (SKU: #${product.sku}) con precio ${formatCurrency(product.price)}. ¿Tienen disponibilidad inmediata?`
        );
        btnWhatsapp.href = `https://wa.me/526188230673?text=${waText}`;

        modal.classList.add('open');
        document.body.classList.add('locked');

        // Garantizar que la ventana de la ficha técnica siempre inicie en el scroll superior (top)
        const sheetWindow = modal.querySelector('.product-sheet-window');
        if (sheetWindow) {
            sheetWindow.scrollTop = 0;
        }
        modal.scrollTop = 0;
    }

    function initProductSheetAndGalleryModals() {
        const sheetModal = document.getElementById('product-sheet-modal');
        const closeSheetBtn = document.getElementById('btn-close-product-sheet');
        const fsModal = document.getElementById('fullscreen-gallery-modal');
        const closeFsBtn = document.getElementById('btn-close-fs-gallery');
        const prevFsBtn = document.getElementById('btn-fs-prev');
        const nextFsBtn = document.getElementById('btn-fs-next');
        const zoomFsBtn = document.getElementById('btn-fs-toggle-zoom');
        const mainFsImg = document.getElementById('fs-gallery-main-img');

        if (closeSheetBtn && sheetModal) {
            closeSheetBtn.addEventListener('click', () => {
                sheetModal.classList.remove('open');
                document.body.classList.remove('locked');
            });
            sheetModal.addEventListener('click', (e) => {
                if (e.target === sheetModal) {
                    sheetModal.classList.remove('open');
                    document.body.classList.remove('locked');
                }
            });
        }

        if (closeFsBtn && fsModal) {
            closeFsBtn.addEventListener('click', closeFullscreenGallery);
        }

        if (prevFsBtn) {
            prevFsBtn.addEventListener('click', () => stepFullscreenGallery(-1));
        }

        if (nextFsBtn) {
            nextFsBtn.addEventListener('click', () => stepFullscreenGallery(1));
        }

        if (zoomFsBtn && mainFsImg) {
            const toggleZoom = () => {
                state.fullscreenGallery.zoomed = !state.fullscreenGallery.zoomed;
                mainFsImg.classList.toggle('zoomed', state.fullscreenGallery.zoomed);
            };
            zoomFsBtn.addEventListener('click', toggleZoom);
            mainFsImg.addEventListener('click', toggleZoom);
        }

        window.addEventListener('keydown', (e) => {
            if (fsModal && fsModal.classList.contains('open')) {
                if (e.key === 'Escape') closeFullscreenGallery();
                if (e.key === 'ArrowLeft') stepFullscreenGallery(-1);
                if (e.key === 'ArrowRight') stepFullscreenGallery(1);
            } else if (sheetModal && sheetModal.classList.contains('open') && e.key === 'Escape') {
                sheetModal.classList.remove('open');
                document.body.classList.remove('locked');
            }
        });
    }

    function openFullscreenGallery(imagesArray, startIndex = 0) {
        const fsModal = document.getElementById('fullscreen-gallery-modal');
        if (!fsModal || !imagesArray || !imagesArray.length) return;

        state.fullscreenGallery.images = imagesArray;
        state.fullscreenGallery.currentIndex = startIndex;
        state.fullscreenGallery.zoomed = false;

        renderFullscreenGallerySlide();
        fsModal.classList.add('open');
    }

    function closeFullscreenGallery() {
        const fsModal = document.getElementById('fullscreen-gallery-modal');
        const mainFsImg = document.getElementById('fs-gallery-main-img');
        if (fsModal) fsModal.classList.remove('open');
        if (mainFsImg) mainFsImg.classList.remove('zoomed');
        state.fullscreenGallery.zoomed = false;
    }

    function stepFullscreenGallery(delta) {
        const total = state.fullscreenGallery.images.length;
        if (!total) return;
        state.fullscreenGallery.currentIndex = (state.fullscreenGallery.currentIndex + delta + total) % total;
        state.fullscreenGallery.zoomed = false;
        renderFullscreenGallerySlide();
    }

    function renderFullscreenGallerySlide() {
        const { images, currentIndex } = state.fullscreenGallery;
        const mainFsImg = document.getElementById('fs-gallery-main-img');
        const counterEl = document.getElementById('fs-gallery-counter');
        const thumbsEl = document.getElementById('fs-gallery-thumbs');

        if (!mainFsImg || !images.length) return;

        mainFsImg.classList.remove('zoomed');
        mainFsImg.src = images[currentIndex];
        if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${images.length}`;

        if (thumbsEl) {
            thumbsEl.innerHTML = images.map((url, idx) => `
                <button type="button" class="fs-thumb-btn ${idx === currentIndex ? 'active' : ''}" data-thumb-idx="${idx}">
                    <img src="${url}" alt="Miniatura ${idx + 1}">
                </button>
            `).join('');

            thumbsEl.querySelectorAll('[data-thumb-idx]').forEach(btn => {
                btn.addEventListener('click', () => {
                    state.fullscreenGallery.currentIndex = parseInt(btn.getAttribute('data-thumb-idx'), 10) || 0;
                    renderFullscreenGallerySlide();
                });
            });
        }
    }

    /* ========================================================================
       6. TALLER BIKE (Trek-web-04.jpg):
       - Barra seleccionadora deslizante
       - Botón/Toggle de Recolección a domicilio por +$120 MXN
       - Calculador de Anticipo y Total en vivo
       - Botón "Agendar cita de taller" con verificación de registro de usuario
         (OTP 6 dígitos) -> Pasarela de Pago -> Hoja de Servicio Digital
       ======================================================================== */
    function initWorkshopSection() {
        const servicesList = document.getElementById('workshop-services-list');
        const slidingBar = document.getElementById('workshop-sliding-bar');
        const options = Array.from(document.querySelectorAll('.workshop-service-option'));
        const hiddenInput = document.getElementById('ws-selected-package');
        const hiddenPrice = document.getElementById('ws-selected-price');
        const hiddenDeposit = document.getElementById('ws-selected-deposit');
        const activeLabel = document.getElementById('ws-active-service-label');
        const pickupCheckbox = document.getElementById('ws-home-pickup');
        const pickupAddressWrap = document.getElementById('ws-pickup-address-wrap');
        const pickupAddressInput = document.getElementById('ws-pickup-address');
        const calcTotalEl = document.getElementById('ws-calc-total');
        const calcDepositEl = document.getElementById('ws-calc-deposit');
        const calcRemainingEl = document.getElementById('ws-calc-remaining');
        const calcBreakdownEl = document.getElementById('ws-calc-breakdown');
        const form = document.getElementById('workshop-booking-form');
        const dateInput = document.getElementById('ws-date');

        if (dateInput) {
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            dateInput.min = tomorrow;
            dateInput.value = tomorrow;
        }

        const updateWorkshopCalculator = () => {
            const basePrice = Number(hiddenPrice ? hiddenPrice.value : 350) || 350;
            const baseDeposit = Number(hiddenDeposit ? hiddenDeposit.value : 150) || 150;
            const hasPickup = Boolean(pickupCheckbox && pickupCheckbox.checked);
            const pickupFee = hasPickup ? 120 : 0;

            const totalCost = basePrice + pickupFee;
            const requiredDeposit = baseDeposit + pickupFee;
            const remainingBalance = Math.max(0, totalCost - requiredDeposit);

            if (calcTotalEl) calcTotalEl.textContent = formatCurrency(totalCost);
            if (calcDepositEl) calcDepositEl.textContent = formatCurrency(requiredDeposit);
            if (calcRemainingEl) calcRemainingEl.textContent = formatCurrency(remainingBalance);
            if (calcBreakdownEl) {
                calcBreakdownEl.textContent = hasPickup
                    ? `Servicio $${basePrice} + Recolección a domicilio $120`
                    : `Servicio $${basePrice} + Entrega en tienda ($0)`;
            }
        };

        const moveSlidingBarTo = (optionEl) => {
            if (!slidingBar || !optionEl) return;
            const topOffset = optionEl.offsetTop;
            const height = optionEl.offsetHeight;
            slidingBar.style.transform = `translateY(${topOffset}px)`;
            slidingBar.style.height = `${height}px`;
        };

        const selectServiceOption = (optionEl) => {
            options.forEach(opt => {
                const isSelected = opt === optionEl;
                opt.classList.toggle('active', isSelected);
                opt.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            });

            moveSlidingBarTo(optionEl);

            const name = optionEl.getAttribute('data-service-name') || '1. AJUSTE BÁSICO EXPRESS — $350 MXN';
            const price = Number(optionEl.getAttribute('data-service-price')) || 350;
            const deposit = Number(optionEl.getAttribute('data-service-deposit')) || 150;

            if (hiddenInput) hiddenInput.value = name;
            if (hiddenPrice) hiddenPrice.value = String(price);
            if (hiddenDeposit) hiddenDeposit.value = String(deposit);
            if (activeLabel) activeLabel.textContent = name;

            updateWorkshopCalculator();
        };

        options.forEach(opt => {
            opt.addEventListener('click', () => selectServiceOption(opt));
            opt.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectServiceOption(opt);
                }
            });
        });

        if (pickupCheckbox) {
            pickupCheckbox.addEventListener('change', () => {
                if (pickupAddressWrap) {
                    pickupAddressWrap.style.display = pickupCheckbox.checked ? 'block' : 'none';
                }
                if (pickupAddressInput) {
                    pickupAddressInput.required = pickupCheckbox.checked;
                    if (pickupCheckbox.checked && state.currentUser && state.currentUser.address && !pickupAddressInput.value) {
                        pickupAddressInput.value = state.currentUser.address;
                    }
                }
                updateWorkshopCalculator();
            });
        }

        if (options.length) {
            setTimeout(() => {
                moveSlidingBarTo(options[0]);
                updateWorkshopCalculator();
            }, 120);
            window.addEventListener('resize', () => {
                const currentActive = (servicesList && servicesList.querySelector('.workshop-service-option.active')) || options[0];
                moveSlidingBarTo(currentActive);
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const basePrice = Number(hiddenPrice ? hiddenPrice.value : 350) || 350;
                const baseDeposit = Number(hiddenDeposit ? hiddenDeposit.value : 150) || 150;
                const hasPickup = Boolean(pickupCheckbox && pickupCheckbox.checked);
                const pickupFee = hasPickup ? 120 : 0;
                const totalCost = basePrice + pickupFee;
                const depositAmount = baseDeposit + pickupFee;
                const remainingBalance = Math.max(0, totalCost - depositAmount);

                const draftBooking = {
                    folio: 'TALLER-' + Math.floor(100000 + Math.random() * 900000),
                    createdAt: new Date().toLocaleString('es-MX'),
                    package: hiddenInput ? hiddenInput.value : '1. AJUSTE BÁSICO EXPRESS — $350 MXN',
                    basePrice,
                    hasPickup,
                    pickupFee,
                    pickupAddress: hasPickup && pickupAddressInput ? pickupAddressInput.value.trim() : 'Entrega directa en sucursal Coronado #1130 Pte.',
                    totalCost,
                    depositAmount,
                    remainingBalance,
                    clientName: document.getElementById('ws-client-name').value.trim(),
                    clientPhone: document.getElementById('ws-client-phone').value.trim(),
                    bikeBrand: document.getElementById('ws-bike-brand').value.trim(),
                    bikeType: document.getElementById('ws-bike-type').value,
                    date: document.getElementById('ws-date').value,
                    time: document.getElementById('ws-time').value,
                    notes: document.getElementById('ws-notes').value.trim() || 'Revisión general según paquete seleccionado.'
                };

                state.pendingWorkshopBooking = draftBooking;

                // Verificación de registro de usuario antes de abrir la pasarela de pago
                if (!state.currentUser) {
                    promptUserAuthForWorkshop(draftBooking);
                } else {
                    openWorkshopPaymentGateway(draftBooking);
                }
            });
        }

        initWorkshopPaymentGatewayModal();
    }

    function promptUserAuthForWorkshop(draftBooking) {
        const authModal = document.getElementById('user-auth-modal');
        const banner = document.getElementById('auth-context-banner');
        const regName = document.getElementById('reg-name');
        const regPhone = document.getElementById('reg-phone');
        const regAddress = document.getElementById('reg-address');

        if (regName && !regName.value) regName.value = draftBooking.clientName;
        if (regPhone && !regPhone.value) regPhone.value = draftBooking.clientPhone;
        if (regAddress && draftBooking.hasPickup && !regAddress.value) regAddress.value = draftBooking.pickupAddress;

        if (banner) {
            banner.style.display = 'block';
            banner.innerHTML = `
                <strong>VERIFICACIÓN DE CICLISTA REQUERIDA PARA AGENDAR TALLER:</strong><br>
                Para proteger tu cita de <strong>${draftBooking.package}</strong> y continuar a la pasarela de pago seguro (${formatCurrency(draftBooking.depositAmount)} de anticipo), inicia sesión o regístrate verificando tu cuenta.
            `;
        }

        renderUserModalState();
        if (authModal) authModal.classList.add('open');
        showToast('Verifica tu cuenta de usuario para continuar al pago de tu cita de taller.');
    }

    function openWorkshopPaymentGateway(booking) {
        const payModal = document.getElementById('workshop-payment-modal');
        const userBadge = document.getElementById('ws-payment-user-badge');
        const summaryEl = document.getElementById('ws-payment-order-summary');
        const optDepositEl = document.getElementById('ws-pay-opt-deposit-amount');
        const optFullEl = document.getElementById('ws-pay-opt-full-amount');
        const finalChargeEl = document.getElementById('ws-pay-final-charge-label');
        const cardHolderInput = document.getElementById('ws-pay-card-holder');
        const lblDeposit = document.getElementById('lbl-pay-deposit');
        const lblFull = document.getElementById('lbl-pay-full');

        if (!payModal || !booking) return;

        const userName = (state.currentUser && state.currentUser.name) || booking.clientName;
        const userEmail = (state.currentUser && state.currentUser.email) || booking.clientPhone;

        if (userBadge) {
            userBadge.innerHTML = `
                <strong>✓ USUARIO VERIFICADO:</strong> ${userName} (${userEmail}) — Registro validado en Comunidad Cordillera Trek.
            `;
        }

        if (summaryEl) {
            summaryEl.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;font-size:0.88rem;">
                    <div>
                        <span style="color:#666;font-size:0.74rem;font-weight:700;display:block;">PAQUETE DE TALLER</span>
                        <strong style="color:#1E1E1E;">${booking.package}</strong>
                    </div>
                    <div>
                        <span style="color:#666;font-size:0.74rem;font-weight:700;display:block;">BICICLETA Y FECHA</span>
                        <strong>${booking.bikeBrand} (${booking.date} · ${booking.time})</strong>
                    </div>
                    <div>
                        <span style="color:#666;font-size:0.74rem;font-weight:700;display:block;">LOGÍSTICA DE RECOLECCIÓN</span>
                        <strong>${booking.hasPickup ? `Recolección a domicilio (+$120 MXN) — ${booking.pickupAddress}` : 'Entrega directa en tienda ($0)'}</strong>
                    </div>
                </div>
            `;
        }

        if (optDepositEl) optDepositEl.textContent = formatCurrency(booking.depositAmount);
        if (optFullEl) optFullEl.textContent = formatCurrency(booking.totalCost);
        if (cardHolderInput) cardHolderInput.value = userName;

        const depositRadio = payModal.querySelector('input[name="ws_pay_amount_mode"][value="deposit"]');
        if (depositRadio) depositRadio.checked = true;
        if (lblDeposit) lblDeposit.classList.add('active');
        if (lblFull) lblFull.classList.remove('active');
        if (finalChargeEl) finalChargeEl.textContent = formatCurrency(booking.depositAmount);

        payModal.classList.add('open');
    }

    function initWorkshopPaymentGatewayModal() {
        const payModal = document.getElementById('workshop-payment-modal');
        const closeBtn = document.getElementById('btn-close-ws-payment');
        const payForm = document.getElementById('form-workshop-payment');
        const modeRadios = Array.from(document.querySelectorAll('input[name="ws_pay_amount_mode"]'));
        const lblDeposit = document.getElementById('lbl-pay-deposit');
        const lblFull = document.getElementById('lbl-pay-full');
        const finalChargeEl = document.getElementById('ws-pay-final-charge-label');
        const methodSelect = document.getElementById('ws-pay-method');
        const cardFieldsGroup = document.getElementById('ws-card-fields-group');

        if (closeBtn && payModal) {
            closeBtn.addEventListener('click', () => payModal.classList.remove('open'));
        }

        modeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const booking = state.pendingWorkshopBooking;
                if (!booking) return;
                const isFull = radio.value === 'full';
                if (lblDeposit) lblDeposit.classList.toggle('active', !isFull);
                if (lblFull) lblFull.classList.toggle('active', isFull);
                if (finalChargeEl) {
                    finalChargeEl.textContent = formatCurrency(isFull ? booking.totalCost : booking.depositAmount);
                }
            });
        });

        if (methodSelect && cardFieldsGroup) {
            methodSelect.addEventListener('change', () => {
                const isCard = methodSelect.value.includes('Tarjeta');
                cardFieldsGroup.style.display = isCard ? 'grid' : 'none';
            });
        }

        if (payForm) {
            payForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const booking = state.pendingWorkshopBooking;
                if (!booking) return;

                const selectedModeRadio = document.querySelector('input[name="ws_pay_amount_mode"]:checked');
                const payMode = selectedModeRadio ? selectedModeRadio.value : 'deposit';
                const paidAmount = payMode === 'full' ? booking.totalCost : booking.depositAmount;
                const pendingUponDelivery = Math.max(0, booking.totalCost - paidAmount);
                const paymentMethod = methodSelect ? methodSelect.value : 'Tarjeta Visa / MasterCard';
                const transactionRef = 'PAY-WS-' + Math.floor(100000 + Math.random() * 900000);

                const finalizedBooking = {
                    ...booking,
                    paidAmount,
                    pendingUponDelivery,
                    paymentMethod,
                    transactionRef,
                    paymentStatus: payMode === 'full' ? 'LIQUIDADO AL 100%' : 'ANTICIPO PAGADO · RESERVA CONFIRMADA',
                    verifiedUserEmail: (state.currentUser && (state.currentUser.email || state.currentUser.phone)) || booking.clientPhone
                };

                state.workshopBookings.unshift(finalizedBooking);
                saveJSON(STORAGE_KEYS.WORKSHOP_BOOKINGS, state.workshopBookings);

                // Si incluye recolección a domicilio, registrarlo también para el panel de chofer
                if (finalizedBooking.hasPickup) {
                    state.orders.unshift({
                        folio: finalizedBooking.folio,
                        date: finalizedBooking.createdAt,
                        customerName: finalizedBooking.clientName,
                        customerPhone: finalizedBooking.clientPhone,
                        deliveryMode: 'Recolección de Bicicleta para Taller ($120 MXN)',
                        paymentMethod: `${finalizedBooking.paymentMethod} (${finalizedBooking.transactionRef})`,
                        address: finalizedBooking.pickupAddress,
                        items: [{ qty: 1, name: finalizedBooking.package, price: finalizedBooking.totalCost }],
                        total: finalizedBooking.totalCost,
                        status: `Recolección programada: ${finalizedBooking.date} (${finalizedBooking.time})`
                    });
                    saveJSON(STORAGE_KEYS.ORDERS, state.orders);
                }

                state.pendingWorkshopBooking = null;
                if (payModal) payModal.classList.remove('open');

                // Resetear formulario de taller
                const wsForm = document.getElementById('workshop-booking-form');
                const pickupWrap = document.getElementById('ws-pickup-address-wrap');
                if (wsForm) wsForm.reset();
                if (pickupWrap) pickupWrap.style.display = 'none';
                const dateInput = document.getElementById('ws-date');
                if (dateInput) {
                    dateInput.value = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                }

                showToast(`Pago aprobado (${transactionRef}). Generando Hoja de Servicio al Sistema de Taller...`);
                openWorkshopVoucherModal(finalizedBooking);
            });
        }
    }

    function openWorkshopVoucherModal(booking) {
        const modal = document.getElementById('workshop-voucher-modal');
        const body = document.getElementById('workshop-voucher-body');
        const closeBtn = document.getElementById('btn-close-voucher');
        if (!modal || !body) return;

        const waMsg = encodeURIComponent(
            `Hola Taller Cordillera Trek, agendé y pagué mi cita en el Sistema de Taller:\n` +
            `• Folio de Taller: ${booking.folio}\n` +
            `• Referencia de Pago: ${booking.transactionRef || 'CONFIRMADO'}\n` +
            `• Servicio: ${booking.package}\n` +
            `• Bicicleta: ${booking.bikeBrand} (${booking.bikeType})\n` +
            `• Fecha: ${booking.date} a las ${booking.time}\n` +
            `• Recolección a Domicilio: ${booking.hasPickup ? 'SÍ (' + booking.pickupAddress + ')' : 'Entrega en Tienda'}\n` +
            `• Monto Pagado: ${formatCurrency(booking.paidAmount || booking.depositAmount)} | Saldo pendiente: ${formatCurrency(booking.pendingUponDelivery !== undefined ? booking.pendingUponDelivery : booking.remainingBalance)}\n` +
            `• Titular: ${booking.clientName} (${booking.clientPhone})`
        );

        body.innerHTML = `
            <div style="border:2px solid #1E1E1E;padding:26px;margin-bottom:22px;">
                <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;border-bottom:1px solid #ddd;padding-bottom:14px;margin-bottom:18px;">
                    <div>
                        <strong style="font-size:0.75rem;letter-spacing:0.12em;color:#22C55E;">✓ PAGO VERIFICADO · ORDEN INGRESADA AL SISTEMA DE TALLER</strong>
                        <div style="font-family:var(--font-display);font-size:2.2rem;line-height:1;margin-top:4px;">${booking.folio}</div>
                    </div>
                    <div style="text-align:right;font-size:0.84rem;color:#555;">
                        <div>Emisión: ${booking.createdAt}</div>
                        <div>Ref. Pago: <strong>${booking.transactionRef || 'PAY-OK'}</strong></div>
                        <div>Coronado #1130 Pte., Durango, Dgo.</div>
                    </div>
                </div>

                <div class="clean-form-grid" style="margin-bottom:14px;">
                    <div>
                        <span style="font-size:0.74rem;font-weight:700;color:#666;">PAQUETE SELECCIONADO</span>
                        <div style="font-family:var(--font-display);font-size:1.45rem;color:#5C260C;">${booking.package}</div>
                    </div>
                    <div>
                        <span style="font-size:0.74rem;font-weight:700;color:#666;">FECHA Y HORA DE RECEPCIÓN</span>
                        <div style="font-weight:700;font-size:0.98rem;">${booking.date} — ${booking.time}</div>
                    </div>
                </div>

                <div class="clean-form-grid" style="margin-bottom:14px;">
                    <div>
                        <span style="font-size:0.74rem;font-weight:700;color:#666;">TITULAR VERIFICADO</span>
                        <div>${booking.clientName} (${booking.clientPhone})</div>
                    </div>
                    <div>
                        <span style="font-size:0.74rem;font-weight:700;color:#666;">BICICLETA</span>
                        <div>${booking.bikeBrand} — ${booking.bikeType}</div>
                    </div>
                </div>

                <div style="background:#F7F7F7;padding:14px 16px;margin-bottom:14px;border-left:4px solid #FF6600;">
                    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:0.88rem;">
                        <span>Costo Total Servicio ${booking.hasPickup ? '(Incluye Recolección $120)' : ''}: <strong>${formatCurrency(booking.totalCost)}</strong></span>
                        <span style="color:#16A34A;">Pagado en línea: <strong>${formatCurrency(booking.paidAmount || booking.depositAmount)}</strong></span>
                        <span>Saldo al entregar: <strong>${formatCurrency(booking.pendingUponDelivery !== undefined ? booking.pendingUponDelivery : booking.remainingBalance)}</strong></span>
                    </div>
                    <div style="font-size:0.82rem;color:#555;margin-top:6px;">
                        Modalidad logística: <strong>${booking.hasPickup ? 'Recolección y Entrega a Domicilio — ' + booking.pickupAddress : 'Recepción directa en Taller Cordillera Trek'}</strong>
                    </div>
                </div>

                <div>
                    <span style="font-size:0.74rem;font-weight:700;color:#666;">OBSERVACIONES TÉCNICAS</span>
                    <p style="font-size:0.9rem;color:#333;">${booking.notes}</p>
                </div>
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:14px;">
                <a href="https://wa.me/526188230673?text=${waMsg}" target="_blank" rel="noopener" class="btn-pill-cta btn-pill-orange">
                    <span>Enviar Hoja de Servicio a Taller por WhatsApp</span>
                    <span class="btn-pill-icon">
                        <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"></polyline></svg>
                    </span>
                </a>
                <button type="button" onclick="window.print()" class="btn-pill-cta btn-pill-darkgrey">
                    <span>Imprimir / Guardar PDF</span>
                </button>
            </div>
        `;

        modal.classList.add('open');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('open');
        }
    }

    /* ========================================================================
       7. SECCIÓN NOTICIAS Y EVENTOS (Trek-web-05.jpg)
       ======================================================================== */
    function initNewsSection() {
        const track = document.getElementById('news-track');
        const prevBtn = document.getElementById('news-prev-btn');
        const nextBtn = document.getElementById('news-next-btn');

        if (!track) return;

        track.innerHTML = NEWS_EVENTS.map((item, idx) => `
            <article class="news-slide-item" data-news-index="${idx}">
                <div class="news-poster-wrap" data-open-news="${idx}" title="Ver póster y convocatoria completa">
                    <img src="${item.poster}" alt="${item.title}" class="news-poster-img" loading="lazy">
                </div>
                <div class="news-item-content">
                    <div class="news-red-ribbon" data-open-news="${idx}">
                        <h3 class="news-ribbon-title">${item.title}</h3>
                    </div>
                    <div class="news-meta-list">
                        <div class="news-meta-row">
                            <img src="assets/images/calendario.svg" alt="Calendario">
                            <span>${item.date}</span>
                        </div>
                        <div class="news-meta-row">
                            <img src="assets/images/ubicacion.svg" alt="Ubicación">
                            <span>${item.location}</span>
                        </div>
                    </div>
                    <p class="news-excerpt">${item.excerpt}</p>
                    <button type="button" class="news-more-link" data-open-news="${idx}">Ver convocatoria y póster HD →</button>
                </div>
            </article>
        `).join('');

        track.querySelectorAll('[data-open-news]').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.getAttribute('data-open-news'), 10) || 0;
                openNewsDetailModal(NEWS_EVENTS[idx]);
            });
        });

        const getVisibleNewsCols = () => (window.innerWidth <= 960 ? 1 : 2);

        const updateNewsPosition = () => {
            const cols = getVisibleNewsCols();
            const maxIdx = Math.max(0, NEWS_EVENTS.length - cols);
            if (state.newsSlideIndex > maxIdx) state.newsSlideIndex = maxIdx;
            const step = 100 / cols;
            track.style.transform = `translateX(-${state.newsSlideIndex * step}%)`;
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const cols = getVisibleNewsCols();
                const maxIdx = Math.max(0, NEWS_EVENTS.length - cols);
                state.newsSlideIndex = state.newsSlideIndex <= 0 ? maxIdx : state.newsSlideIndex - 1;
                updateNewsPosition();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const cols = getVisibleNewsCols();
                const maxIdx = Math.max(0, NEWS_EVENTS.length - cols);
                state.newsSlideIndex = state.newsSlideIndex >= maxIdx ? 0 : state.newsSlideIndex + 1;
                updateNewsPosition();
            });
        }

        window.addEventListener('resize', updateNewsPosition);
    }

    function openNewsDetailModal(eventItem) {
        const modal = document.getElementById('news-detail-modal');
        const titleEl = document.getElementById('news-modal-title');
        const bodyEl = document.getElementById('news-modal-body');
        const closeBtn = document.getElementById('btn-close-news-modal');
        if (!modal || !bodyEl || !eventItem) return;

        titleEl.textContent = eventItem.title;
        const waEvent = encodeURIComponent(`Hola Cordillera Trek, quiero inscribirme o pedir informes del evento: ${eventItem.title} (${eventItem.date}).`);

        bodyEl.innerHTML = `
            <div class="product-sheet-grid">
                <div>
                    <img src="${eventItem.poster}" alt="${eventItem.title}" style="width:100%;max-width:360px;cursor:zoom-in;box-shadow:0 14px 32px rgba(0,0,0,0.18);" id="news-modal-poster-zoom">
                    <p class="bento-zoom-hint">Haz clic en el póster para abrirlo en pantalla completa.</p>
                </div>
                <div>
                    <div class="news-meta-list" style="margin-bottom:18px;">
                        <div class="news-meta-row">
                            <img src="assets/images/calendario.svg" alt="Fecha">
                            <span>${eventItem.date}</span>
                        </div>
                        <div class="news-meta-row">
                            <img src="assets/images/ubicacion.svg" alt="Salida">
                            <span>${eventItem.location}</span>
                        </div>
                    </div>
                    <p style="font-size:0.96rem;margin-bottom:14px;color:#222;">${eventItem.excerpt}</p>
                    <p style="font-size:0.92rem;margin-bottom:26px;color:#444;">${eventItem.details}</p>
                    <a href="https://wa.me/526188230673?text=${waEvent}" target="_blank" rel="noopener" class="btn-pill-cta btn-pill-orange">
                        <span>Confirmar Asistencia por WhatsApp</span>
                        <span class="btn-pill-icon">
                            <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"></polyline></svg>
                        </span>
                    </a>
                </div>
            </div>
        `;

        const posterZoom = document.getElementById('news-modal-poster-zoom');
        if (posterZoom) {
            posterZoom.addEventListener('click', () => {
                openFullscreenGallery([eventItem.poster], 0);
            });
        }

        modal.classList.add('open');
        if (closeBtn) closeBtn.onclick = () => modal.classList.remove('open');
    }

    /* ========================================================================
       8. CARRITO DE COMPRAS, CHECKOUT Y AUTENTICACIÓN CON OTP DE 6 DÍGITOS
       ======================================================================== */
    function initCartAndCheckout() {
        const openCartBtn = document.getElementById('btn-open-cart');
        const footerOpenCart = document.getElementById('footer-open-cart');
        const closeCartBtn = document.getElementById('btn-close-cart');
        const backdrop = document.getElementById('cart-drawer-backdrop');
        const clearBtn = document.getElementById('btn-clear-cart');
        const proceedBtn = document.getElementById('btn-proceed-checkout');
        const checkoutModal = document.getElementById('checkout-modal');
        const closeCheckoutBtn = document.getElementById('btn-close-checkout');
        const checkoutForm = document.getElementById('form-checkout-order');

        const openCart = () => {
            renderCartDrawer();
            document.getElementById('cart-side-drawer').classList.add('open');
            backdrop.classList.add('open');
        };

        const closeCart = () => {
            document.getElementById('cart-side-drawer').classList.remove('open');
            backdrop.classList.remove('open');
        };

        if (openCartBtn) openCartBtn.addEventListener('click', openCart);
        if (footerOpenCart) {
            footerOpenCart.addEventListener('click', (e) => {
                e.preventDefault();
                openCart();
            });
        }
        if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
        if (backdrop) backdrop.addEventListener('click', closeCart);

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                state.cart = [];
                saveJSON(STORAGE_KEYS.CART, state.cart);
                renderCartDrawer();
                updateCartBadge();
            });
        }

        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => {
                if (!state.cart.length) {
                    showToast('Agrega al menos un producto al carrito primero.');
                    return;
                }
                closeCart();
                openCheckoutModal();
            });
        }

        if (closeCheckoutBtn && checkoutModal) {
            closeCheckoutBtn.addEventListener('click', () => checkoutModal.classList.remove('open'));
        }

        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
                const newOrder = {
                    folio: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
                    date: new Date().toLocaleString('es-MX'),
                    customerName: document.getElementById('chk-name').value.trim(),
                    customerPhone: document.getElementById('chk-phone').value.trim(),
                    deliveryMode: document.getElementById('chk-delivery-mode').value,
                    paymentMethod: document.getElementById('chk-payment-method').value,
                    address: document.getElementById('chk-address').value.trim(),
                    items: [...state.cart],
                    total,
                    status: 'En preparación para ruta / entrega'
                };

                state.orders.unshift(newOrder);
                saveJSON(STORAGE_KEYS.ORDERS, state.orders);

                state.cart = [];
                saveJSON(STORAGE_KEYS.CART, state.cart);
                updateCartBadge();

                checkoutModal.classList.remove('open');
                showToast(`Pedido ${newOrder.folio} confirmado. Abriendo enlace WhatsApp...`);

                const itemsText = newOrder.items.map(i => `• ${i.qty}x ${i.name} (${formatCurrency(i.price)})`).join('\n');
                const waOrder = encodeURIComponent(
                    `Hola Cordillera Trek, confirmo mi pedido web Folio ${newOrder.folio}:\n` +
                    `${itemsText}\n` +
                    `Total: ${formatCurrency(newOrder.total)}\n` +
                    `Cliente: ${newOrder.customerName} (${newOrder.customerPhone})\n` +
                    `Entrega: ${newOrder.deliveryMode} - ${newOrder.address}\n` +
                    `Pago: ${newOrder.paymentMethod}`
                );
                window.open(`https://wa.me/526188230673?text=${waOrder}`, '_blank');
            });
        }

        updateCartBadge();
    }

    function addToCart(productId, qty = 1) {
        const product = state.products.find(p => p.id === productId || p.sku === productId);
        if (!product) return;

        const existing = state.cart.find(item => item.id === product.id);
        if (existing) {
            existing.qty += qty;
        } else {
            state.cart.push({
                id: product.id,
                sku: product.sku,
                name: product.name,
                brand: product.brand,
                price: product.price,
                image: product.image_png || product.image,
                qty
            });
        }

        saveJSON(STORAGE_KEYS.CART, state.cart);
        updateCartBadge();
        showToast(`Agregado al carrito: ${product.name}`);
    }

    function updateCartBadge() {
        const badge = document.getElementById('header-cart-badge');
        if (!badge) return;
        const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
        badge.textContent = count;
    }

    function renderCartDrawer() {
        const container = document.getElementById('cart-items-container');
        const totalEl = document.getElementById('cart-total-amount');
        if (!container || !totalEl) return;

        if (!state.cart.length) {
            container.innerHTML = `<p style="color:#666;padding:24px 0;">Tu carrito está vacío. Explora nuestro catálogo de bicicletas y equipamiento.</p>`;
            totalEl.textContent = '$0.00 MXN';
            return;
        }

        let total = 0;
        container.innerHTML = state.cart.map(item => {
            total += item.price * item.qty;
            return `
                <div class="cart-line-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-line-thumb">
                    <div>
                        <div class="cart-line-title">${item.name}</div>
                        <div class="cart-line-price">${formatCurrency(item.price)}</div>
                        <div class="cart-qty-controls">
                            <button type="button" class="cart-qty-btn" data-cart-dec="${item.id}">-</button>
                            <span style="font-size:0.85rem;font-weight:700;">${item.qty}</span>
                            <button type="button" class="cart-qty-btn" data-cart-inc="${item.id}">+</button>
                        </div>
                    </div>
                    <button type="button" data-cart-del="${item.id}" style="color:#999;font-size:1.1rem;" title="Eliminar">✕</button>
                </div>
            `;
        }).join('');

        totalEl.textContent = formatCurrency(total);

        container.querySelectorAll('[data-cart-inc]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-cart-inc');
                const item = state.cart.find(i => i.id === id);
                if (item) item.qty += 1;
                saveJSON(STORAGE_KEYS.CART, state.cart);
                renderCartDrawer();
                updateCartBadge();
            });
        });

        container.querySelectorAll('[data-cart-dec]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-cart-dec');
                const idx = state.cart.findIndex(i => i.id === id);
                if (idx > -1) {
                    if (state.cart[idx].qty > 1) state.cart[idx].qty -= 1;
                    else state.cart.splice(idx, 1);
                }
                saveJSON(STORAGE_KEYS.CART, state.cart);
                renderCartDrawer();
                updateCartBadge();
            });
        });

        container.querySelectorAll('[data-cart-del]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-cart-del');
                state.cart = state.cart.filter(i => i.id !== id);
                saveJSON(STORAGE_KEYS.CART, state.cart);
                renderCartDrawer();
                updateCartBadge();
            });
        });
    }

    function openCheckoutModal() {
        const modal = document.getElementById('checkout-modal');
        const summaryBox = document.getElementById('checkout-summary-box');
        if (!modal) return;

        if (state.currentUser) {
            document.getElementById('chk-name').value = state.currentUser.name || '';
            document.getElementById('chk-phone').value = state.currentUser.phone || '';
            document.getElementById('chk-address').value = state.currentUser.address || '';
        }

        const total = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
        if (summaryBox) {
            summaryBox.innerHTML = `
                <div style="font-size:0.85rem;color:#444;margin-bottom:6px;">
                    Artículos en tu pedido: <strong>${state.cart.reduce((s, i) => s + i.qty, 0)}</strong>
                </div>
                <div style="font-family:var(--font-display);font-size:1.8rem;color:#5C260C;">
                    Total a pagar: ${formatCurrency(total)}
                </div>
            `;
        }

        modal.classList.add('open');
    }

    /* Autenticación de Usuarios con Verificación OTP de 6 dígitos */
    function initUserAuthModal() {
        const openBtn = document.getElementById('btn-open-user');
        const footerOpenBtn = document.getElementById('footer-open-account');
        const closeBtn = document.getElementById('btn-close-user-modal');
        const modal = document.getElementById('user-auth-modal');
        const tabs = Array.from(document.querySelectorAll('[data-auth-tab]'));
        const loginForm = document.getElementById('form-user-login');
        const regForm = document.getElementById('form-user-register');
        const verifyStep = document.getElementById('auth-verification-step');
        const verifyForm = document.getElementById('form-verify-code');
        const verifyInput = document.getElementById('verify-code-input');
        const autofillOtpBtn = document.getElementById('btn-Autofill-otp');
        const logoutBtn = document.getElementById('btn-logout-user');
        const banner = document.getElementById('auth-context-banner');

        const openUserModal = () => {
            if (banner && !state.pendingWorkshopBooking) {
                banner.style.display = 'none';
            }
            renderUserModalState();
            modal.classList.add('open');
        };

        if (openBtn) openBtn.addEventListener('click', openUserModal);
        if (footerOpenBtn) {
            footerOpenBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openUserModal();
            });
        }
        if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-auth-tab');
                tabs.forEach(t => t.classList.toggle('active', t === tab));
                if (verifyStep) verifyStep.style.display = 'none';
                loginForm.style.display = target === 'login' ? 'block' : 'none';
                regForm.style.display = target === 'register' ? 'block' : 'none';
            });
        });

        // Paso 1 de Registro: Generar código OTP de 6 dígitos
        if (regForm) {
            regForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const draftUser = {
                    name: document.getElementById('reg-name').value.trim(),
                    phone: document.getElementById('reg-phone').value.trim(),
                    email: document.getElementById('reg-email').value.trim(),
                    discipline: document.getElementById('reg-discipline').value,
                    address: document.getElementById('reg-address').value.trim(),
                    password: document.getElementById('reg-password').value,
                    verifiedAt: new Date().toLocaleString('es-MX')
                };

                const otpCode = String(Math.floor(100000 + Math.random() * 900000));
                state.pendingRegistrationUser = draftUser;
                state.pendingVerificationCode = otpCode;

                regForm.style.display = 'none';
                loginForm.style.display = 'none';
                if (verifyStep) {
                    verifyStep.style.display = 'block';
                    const descEl = document.getElementById('auth-verification-desc');
                    const demoBanner = document.getElementById('auth-demo-code-banner');
                    if (descEl) {
                        descEl.textContent = `Enviamos un código de verificación de 6 dígitos al correo ${draftUser.email} y WhatsApp ${draftUser.phone}.`;
                    }
                    if (demoBanner) {
                        demoBanner.innerHTML = `<strong>CÓDIGO GENERADO POR AGENTE DE SEGURIDAD:</strong> <span style="font-size:1.25rem;font-weight:700;color:#FF6600;letter-spacing:0.15em;margin-left:6px;">${otpCode}</span>`;
                    }
                    if (verifyInput) {
                        verifyInput.value = '';
                        verifyInput.focus();
                    }
                }
            });
        }

        if (autofillOtpBtn && verifyInput) {
            autofillOtpBtn.addEventListener('click', () => {
                if (state.pendingVerificationCode) {
                    verifyInput.value = state.pendingVerificationCode;
                }
            });
        }

        // Paso 2 de Registro: Verificar OTP y activar cuenta
        if (verifyForm) {
            verifyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const entered = (verifyInput ? verifyInput.value : '').trim();
                if (state.pendingVerificationCode && entered !== state.pendingVerificationCode) {
                    showToast('Código incorrecto. Usa el código de 6 dígitos mostrado en pantalla.');
                    return;
                }

                const newUser = state.pendingRegistrationUser;
                if (!newUser) return;

                state.usersDB.push(newUser);
                saveJSON(STORAGE_KEYS.USERS_DB, state.usersDB);
                state.currentUser = newUser;
                saveJSON(STORAGE_KEYS.USER, state.currentUser);
                state.pendingRegistrationUser = null;
                state.pendingVerificationCode = null;

                if (verifyStep) verifyStep.style.display = 'none';
                renderUserModalState();
                showToast(`Cuenta verificada. Bienvenido a Cordillera Trek, ${newUser.name}`);

                resumePendingWorkshopFlowIfAny(modal);
            });
        }

        // Inicio de Sesión directo
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const idInput = document.getElementById('login-email').value.trim().toLowerCase();
                const pass = document.getElementById('login-password').value;
                const found = state.usersDB.find(u =>
                    (u.email || '').toLowerCase() === idInput || (u.phone || '').includes(idInput)
                );
                if (found && found.password === pass) {
                    state.currentUser = found;
                } else {
                    state.currentUser = {
                        name: (state.pendingWorkshopBooking && state.pendingWorkshopBooking.clientName) || idInput.split('@')[0].toUpperCase(),
                        email: idInput,
                        phone: (state.pendingWorkshopBooking && state.pendingWorkshopBooking.clientPhone) || '618 823 0673',
                        discipline: 'Montaña (MTB)',
                        address: 'Durango, Dgo.'
                    };
                }
                saveJSON(STORAGE_KEYS.USER, state.currentUser);
                renderUserModalState();
                showToast(`Sesión verificada: ${state.currentUser.name}`);

                resumePendingWorkshopFlowIfAny(modal);
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                state.currentUser = null;
                saveJSON(STORAGE_KEYS.USER, null);
                renderUserModalState();
                showToast('Has cerrado sesión.');
            });
        }

        renderUserModalState();
    }

    function resumePendingWorkshopFlowIfAny(authModal) {
        if (state.pendingWorkshopBooking) {
            const banner = document.getElementById('auth-context-banner');
            if (banner) banner.style.display = 'none';
            if (authModal) authModal.classList.remove('open');
            setTimeout(() => {
                openWorkshopPaymentGateway(state.pendingWorkshopBooking);
            }, 220);
        }
    }

    function renderUserModalState() {
        const guestView = document.getElementById('auth-guest-view');
        const profileView = document.getElementById('auth-profile-view');
        const dot = document.getElementById('user-status-dot');
        if (!guestView || !profileView) return;

        if (state.currentUser) {
            guestView.style.display = 'none';
            profileView.style.display = 'block';
            if (dot) dot.classList.add('online');

            document.getElementById('profile-greeting-name').textContent = `HOLA, ${state.currentUser.name}`;
            document.getElementById('profile-meta-details').textContent =
                `Modalidad: ${state.currentUser.discipline || 'Ciclismo'} | Contacto: ${state.currentUser.email || state.currentUser.phone} | Dirección: ${state.currentUser.address || 'Durango'}`;

            const ordersEl = document.getElementById('profile-orders-list');
            if (ordersEl) {
                const orderItems = state.orders.slice(0, 5).map(o =>
                    `<div style="padding:8px 0;border-bottom:1px solid #eee;"><strong>${o.folio}</strong> — ${formatCurrency(o.total)} (${o.status})</div>`
                ).join('');
                const wsItems = state.workshopBookings.slice(0, 5).map(w =>
                    `<div style="padding:8px 0;border-bottom:1px solid #eee;"><strong style="color:#FF6600;">${w.folio}</strong> — ${w.package} (${w.paymentStatus || 'Confirmado'})</div>`
                ).join('');
                ordersEl.innerHTML = (wsItems + orderItems) || '<p>Aún no tienes pedidos ni citas registradas en esta sesión.</p>';
            }
        } else {
            guestView.style.display = 'block';
            profileView.style.display = 'none';
            if (dot) dot.classList.remove('online');
        }
    }

    /* ========================================================================
       9. SISTEMA PWA DE LOGÍSTICA, CHOFER EN TURNO Y TALLER (CONTRASEÑA: T1130)
          + CONSOLA INTERNA MULTI-AGENTE ASCEND RMS Y QUITA-FONDOS PNG
       ======================================================================== */
    const LOGISTICS_ACCESS_PASSWORD = 'T1130';
    const DEFAULT_DISPATCH_QUEUE = [
        {
            folio: 'COR-PED-802',
            customerName: 'Lic. Gerardo Morales',
            customerPhone: '618 142 8890',
            address: 'Calle Laureles #204, Fracc. Lomas del Parque, Durango',
            itemsSummary: '1x Casco Giro Manifest Spherical MIPS',
            deliveryMode: 'Entrega Local Mismo Día (Camioneta Cordillera)',
            total: 6490,
            status: 'tienda',
            shift: 'Matutino',
            time: '10:30 AM'
        },
        {
            folio: 'TALLER-904112',
            customerName: 'Ing. Carlos Guadiana',
            customerPhone: '618 231 4410',
            address: 'Blvd. Felipe Pescador #815, Zona Centro, Durango',
            itemsSummary: 'Recolección a Domicilio ($120 MXN) · 3. Servicio Completo Pro (Trek Rail+ 8)',
            deliveryMode: 'Recolección Taller a Domicilio (+$120 MXN)',
            total: 970,
            status: 'ruta',
            shift: 'Matutino',
            time: '11:15 AM'
        },
        {
            folio: 'COR-PED-794',
            customerName: 'Dra. Patricia Simental',
            customerPhone: '618 199 3021',
            address: 'Av. 20 de Noviembre #1405, Zona Centro, Durango',
            itemsSummary: '1x Trek Top Fuel 9.8 XT Gen 4 Carbon',
            deliveryMode: 'Entrega Local Asegurada (Durango Capital)',
            total: 79900,
            status: 'ruta',
            shift: 'Matutino',
            time: '12:05 PM'
        },
        {
            folio: 'COR-PED-788',
            customerName: 'Arq. Fernando Valles',
            customerPhone: '618 812 7743',
            address: 'Calle Nogal #412, Col. Silvestre Dorador, Durango',
            itemsSummary: '1x Llanta Maxxis Assegai 29x2.50 WT EXO+ TR',
            deliveryMode: 'Entrega Local Mismo Día',
            total: 1890,
            status: 'entregado',
            shift: 'Matutino',
            time: '09:40 AM'
        }
    ];

    state.logisticsUnlocked = false;
    state.logisticsActiveTab = 'despacho';
    state.logisticsStatusFilter = 'todos';
    state.logisticsShift = 'Matutino';
    state.logisticsQueue = loadJSON('cordillera_rediseno_logistics_queue_v2', DEFAULT_DISPATCH_QUEUE);

    function syncOrdersAndWorkshopIntoLogisticsQueue() {
        const existingFolios = new Set(state.logisticsQueue.map(item => item.folio));

        // Incorporar pedidos nuevos de la Tienda en Línea
        (state.orders || []).forEach(ord => {
            if (ord && ord.folio && !existingFolios.has(ord.folio)) {
                state.logisticsQueue.unshift({
                    folio: ord.folio,
                    customerName: ord.customerName || 'Cliente Tienda en Línea',
                    customerPhone: ord.customerPhone || '618 823 0673',
                    address: ord.address || 'Coronado #1130 Pte., Durango',
                    itemsSummary: Array.isArray(ord.items)
                        ? ord.items.map(i => `${i.qty || 1}x ${i.name}`).join(', ')
                        : 'Pedido Tienda en Línea Cordillera',
                    deliveryMode: ord.deliveryMode || 'Envío Local Durango',
                    total: Number(ord.total) || 0,
                    status: 'tienda',
                    shift: state.logisticsShift,
                    time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                });
                existingFolios.add(ord.folio);
            }
        });

        // Incorporar citas nuevas de Taller Bike (especialmente recolecciones a domicilio +$120 MXN)
        (state.workshopBookings || []).forEach(wb => {
            if (wb && wb.folio && !existingFolios.has(wb.folio)) {
                state.logisticsQueue.unshift({
                    folio: wb.folio,
                    customerName: wb.clientName || 'Cliente Taller Bike',
                    customerPhone: wb.clientPhone || '618 823 0673',
                    address: wb.pickupAddress || 'Sucursal Coronado #1130 Pte., Durango',
                    itemsSummary: `${wb.hasPickup ? 'Recolección a Domicilio (+$120) · ' : 'Ingreso en Tienda · '}${wb.package} (${wb.bikeModel || 'Bicicleta'})`,
                    deliveryMode: wb.hasPickup ? 'Recolección Taller a Domicilio (+$120 MXN)' : 'Recepción en Taller Coronado #1130',
                    total: Number(wb.totalCost) || 350,
                    status: wb.hasPickup ? 'ruta' : 'tienda',
                    shift: state.logisticsShift,
                    time: wb.date || 'Programado'
                });
                existingFolios.add(wb.folio);
            }
        });

        saveJSON('cordillera_rediseno_logistics_queue_v2', state.logisticsQueue);
    }

    function initMultiAgentAndLogisticsConsoles() {
        const closeAscendBtn = document.getElementById('btn-close-ascend-agent');
        const ascendModal = document.getElementById('ascend-agent-modal');

        const openChoferBtn = document.getElementById('btn-open-chofer-panel');
        const closeChoferBtn = document.getElementById('btn-close-chofer-modal');
        const choferModal = document.getElementById('dispatch-chofer-modal');
        const choferWindow = document.getElementById('dispatch-chofer-window');
        const pinGate = document.getElementById('logistics-pin-gate');
        const pinForm = document.getElementById('logistics-pin-form');
        const pinInput = document.getElementById('logistics-pin-input');
        const pinError = document.getElementById('logistics-pin-error');
        const choferBody = document.getElementById('dispatch-chofer-body');

        const openAscendConsole = () => {
            renderAscendAgentConsole();
            if (ascendModal) ascendModal.classList.add('open');
        };

        const showLogisticsModal = () => {
            if (!choferModal) return;
            if (state.logisticsUnlocked) {
                if (pinGate) pinGate.style.display = 'none';
                if (choferBody) choferBody.style.display = 'block';
                if (choferWindow) choferWindow.classList.add('dialog-wide');
                renderChoferDispatchConsole();
            } else {
                if (pinGate) pinGate.style.display = 'block';
                if (choferBody) choferBody.style.display = 'none';
                if (choferWindow) choferWindow.classList.remove('dialog-wide');
                if (pinError) pinError.style.display = 'none';
                if (pinInput) {
                    pinInput.value = '';
                    setTimeout(() => pinInput.focus(), 100);
                }
            }
            choferModal.classList.add('open');
        };

        if (closeAscendBtn && ascendModal) {
            closeAscendBtn.addEventListener('click', () => ascendModal.classList.remove('open'));
        }

        if (openChoferBtn) {
            openChoferBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showLogisticsModal();
            });
        }

        if (closeChoferBtn && choferModal) {
            closeChoferBtn.addEventListener('click', () => choferModal.classList.remove('open'));
            choferModal.addEventListener('click', (e) => {
                if (e.target === choferModal) choferModal.classList.remove('open');
            });
        }

        if (pinForm && pinInput) {
            pinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const entered = (pinInput.value || '').trim().toUpperCase();
                if (entered === LOGISTICS_ACCESS_PASSWORD) {
                    state.logisticsUnlocked = true;
                    if (pinError) pinError.style.display = 'none';
                    if (pinGate) pinGate.style.display = 'none';
                    if (choferBody) choferBody.style.display = 'block';
                    if (choferWindow) choferWindow.classList.add('dialog-wide');
                    renderChoferDispatchConsole();
                    showToast('Acceso Autorizado (T1130) · Sistema PWA de Logística Activo');
                } else {
                    if (pinError) pinError.style.display = 'block';
                    pinInput.value = '';
                    pinInput.focus();
                    showToast('Contraseña incorrecta. Clave requerida para Coronado #1130.');
                }
            });
        }

        window.addEventListener('keydown', (e) => {
            if (e.altKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                showLogisticsModal();
            }
            if (e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                if (state.logisticsUnlocked) {
                    openAscendConsole();
                } else {
                    showLogisticsModal();
                }
            }
        });

        if (window.location.hash === '#chofer' || window.location.hash === '#logistica') {
            showLogisticsModal();
        }
    }

    function renderAscendAgentConsole() {
        const body = document.getElementById('ascend-agent-console-body');
        if (!body) return;

        const syncMeta = window.ASCEND_RMS_SYNC || {};
        const quarantineCount = state.quarantineProducts.length || syncMeta.productos_omitidos_sin_stock || 14;

        body.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:26px;">
                <div style="border-left:3px solid #FF6600;padding-left:14px;">
                    <span style="font-size:0.72rem;font-weight:700;color:#666;">AGENTE 1: SINCRONIZADOR ASCEND</span>
                    <div style="font-family:var(--font-display);font-size:1.75rem;">${state.products.length} PRODUCTOS ACTIVOS</div>
                    <small style="color:#666;">Sincronizado desde Ascend RMS CSV/XLSX</small>
                </div>
                <div style="border-left:3px solid #ED1C24;padding-left:14px;">
                    <span style="font-size:0.72rem;font-weight:700;color:#666;">AGENTE 2: CATALOGADOR IA</span>
                    <div style="font-family:var(--font-display);font-size:1.75rem;">22 MARCAS INDEXADAS</div>
                    <small style="color:#666;">Filtrado estricto sin cruces de categoría</small>
                </div>
                <div style="border-left:3px solid #5C260C;padding-left:14px;">
                    <span style="font-size:0.72rem;font-weight:700;color:#666;">AGENTE 3: DEPURADOR (LISTA ROJA)</span>
                    <div style="font-family:var(--font-display);font-size:1.75rem;">${quarantineCount} EN CUARENTENA</div>
                    <small style="color:#666;">Omitidos automáticamente por stock ≤ 0</small>
                </div>
                <div style="border-left:3px solid #22C55E;padding-left:14px;">
                    <span style="font-size:0.72rem;font-weight:700;color:#666;">AGENTE 4: QUITA-FONDOS PNG</span>
                    <div style="font-family:var(--font-display);font-size:1.75rem;">100% RECORTADOS (.PNG)</div>
                    <small style="color:#666;">0 fotos de relleno · Editable por SKU</small>
                </div>
            </div>

            <!-- Herramienta Interactiva del Agente 4: Removedor de Fondos y Gestor de Galería Original -->
            <div style="border-top:1px solid #ddd;padding-top:20px;margin-bottom:24px;">
                <h3 class="sheet-section-heading">PASO 1 · CAMBIAR FOTO PRINCIPAL (.PNG SIN FONDO) O SUBIR SERIE DE FOTOS ORIGINALES</h3>
                <p style="font-size:0.88rem;color:#444;margin-bottom:14px;">
                    Selecciona cualquier SKU del catálogo: puedes reemplazar su foto principal <strong>.PNG sin fondo</strong> (el Agente le quita el fondo automáticamente o conserva tu archivo original) y también subir la serie de fotografías originales para las fichas de bicicletas sin ningún relleno artificial.
                </p>

                <div class="clean-form-grid">
                    <div class="clean-field">
                        <label for="agent-select-sku">PRODUCTO DEL CATÁLOGO (${state.products.length} SINCRONIZADOS)</label>
                        <select id="agent-select-sku" class="clean-input">
                            ${state.products.map(p => `<option value="${p.sku}">${p.brand} — ${p.name} (${p.sku}) — ${formatCurrency(p.price)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="clean-field">
                        <label for="agent-upload-file">1) SUBIR / CAMBIAR FOTO PRINCIPAL (.PNG SIN FONDO)</label>
                        <input type="file" id="agent-upload-file" accept="image/*" class="clean-input">
                    </div>
                    <div class="clean-field">
                        <label for="agent-upload-gallery">2) SUBIR SERIE DE FOTOS PARA LA FICHA (GALERÍA MÚLTIPLE)</label>
                        <input type="file" id="agent-upload-gallery" accept="image/*" multiple class="clean-input">
                    </div>
                    <div class="clean-field" style="display:flex;align-items:flex-end;">
                        <button type="button" id="btn-agent-reset-sku-photos" class="btn-pill-cta btn-pill-darkgrey" style="height:42px;">
                            <span>Restaurar Foto Original del Agente</span>
                        </button>
                    </div>
                </div>

                <div id="agent-bg-preview-area" style="display:none;margin-top:16px;padding:18px;background:#F7F7F7;align-items:center;gap:24px;flex-wrap:wrap;">
                    <div>
                        <span style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:6px;">RESULTADO .PNG SIN FONDO (AGENTE IA):</span>
                        <img id="agent-bg-result-img" src="" alt="Previsualización sin fondo" style="max-height:150px;object-fit:contain;">
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:12px;">
                        <button type="button" id="btn-agent-apply-png" class="btn-pill-cta btn-pill-orange">
                            <span>Aplicar Recorte .PNG Sin Fondo</span>
                        </button>
                        <button type="button" id="btn-agent-apply-raw" class="btn-pill-cta btn-pill-darkgrey">
                            <span>Usar Mi Archivo Original Directo</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabla de Auditoría del Agente Depurador (Lista Roja en Cuarentena) -->
            <div style="border-top:1px solid #ddd;padding-top:20px;">
                <h3 class="sheet-section-heading">PASO 2 · REPORTE DEL AGENTE DEPURADOR (LISTA ROJA RETENIDA EN CUARENTENA)</h3>
                <p style="font-size:0.84rem;color:#555;margin-bottom:12px;">
                    Estos artículos detectados en <code>Rediseño/inventario</code> fueron bloqueados antes de llegar a la vitrina pública por tener existencia 0, saldo negativo o datos incompletos:
                </p>
                <div style="max-height:210px;overflow-y:auto;border:1px solid #E5E5E5;padding:10px 14px;background:#FAFAFA;font-size:0.82rem;">
                    ${state.quarantineProducts.map(q => `
                        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #EAEAEA;gap:10px;">
                            <span><strong style="color:#ED1C24;">[BLOQUEADO]</strong> SKU: ${q.sku} — ${q.title}</span>
                            <span style="font-weight:700;color:#5C260C;">Stock: ${q.stock} | Precio: $${q.price}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const fileInput = document.getElementById('agent-upload-file');
        const galleryInput = document.getElementById('agent-upload-gallery');
        const resetSkuBtn = document.getElementById('btn-agent-reset-sku-photos');
        const skuSelect = document.getElementById('agent-select-sku');
        const previewArea = document.getElementById('agent-bg-preview-area');
        const resultImg = document.getElementById('agent-bg-result-img');
        const applyBtn = document.getElementById('btn-agent-apply-png');
        const applyRawBtn = document.getElementById('btn-agent-apply-raw');

        let latestTransparentDataUrl = null;
        let latestRawDataUrl = null;

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    try {
                        latestRawDataUrl = ev.target.result;
                        showToast('Agente IA procesando recorte transparente .PNG...');
                        latestTransparentDataUrl = await BackgroundRemoverAgent.processImageToTransparentPNG(latestRawDataUrl, 26);
                        resultImg.src = latestTransparentDataUrl;
                        previewArea.style.display = 'flex';
                    } catch (err) {
                        console.error(err);
                        showToast('Error al procesar la imagen.');
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        const applyMainPhotoToSku = (dataUrl, labelMsg) => {
            if (!dataUrl || !skuSelect) return;
            const sku = skuSelect.value;
            state.customImgOverrides[sku] = dataUrl;
            saveJSON(STORAGE_KEYS.CUSTOM_IMG_OVERRIDES, state.customImgOverrides);

            state.products = state.products.map(p => {
                if (p.sku !== sku) return p;
                const newGallery = [dataUrl, ...(p.gallery || []).filter(u => u !== dataUrl)];
                return { ...p, image: dataUrl, image_png: dataUrl, gallery: newGallery };
            });
            resetStoreToFeatured();
            showToast(`${labelMsg} aplicada a SKU ${sku}`);
        };

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                applyMainPhotoToSku(latestTransparentDataUrl, 'Imagen .PNG sin fondo');
            });
        }

        if (applyRawBtn) {
            applyRawBtn.addEventListener('click', () => {
                applyMainPhotoToSku(latestRawDataUrl, 'Fotografía original directa');
            });
        }

        if (galleryInput) {
            galleryInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length || !skuSelect) return;
                const sku = skuSelect.value;

                const readAsDataURL = (file) => new Promise((res, rej) => {
                    const r = new FileReader();
                    r.onload = (ev) => res(ev.target.result);
                    r.onerror = rej;
                    r.readAsDataURL(file);
                });

                try {
                    const uploadedUrls = await Promise.all(files.map(readAsDataURL));
                    const targetProd = state.products.find(p => p.sku === sku);
                    const mainImg = (targetProd && targetProd.image_png) || uploadedUrls[0];
                    const combinedGallery = Array.from(new Set([mainImg, ...uploadedUrls]));

                    state.customGalleryOverrides[sku] = combinedGallery;
                    saveJSON(STORAGE_KEYS.CUSTOM_GALLERY_OVERRIDES, state.customGalleryOverrides);

                    state.products = state.products.map(p =>
                        p.sku === sku ? { ...p, gallery: combinedGallery } : p
                    );
                    showToast(`Se cargaron ${uploadedUrls.length} foto(s) originales a la ficha de SKU ${sku}`);
                } catch (err) {
                    console.error(err);
                    showToast('No se pudieron cargar las fotos de galería.');
                }
            });
        }

        if (resetSkuBtn) {
            resetSkuBtn.addEventListener('click', () => {
                if (!skuSelect) return;
                const sku = skuSelect.value;
                delete state.customImgOverrides[sku];
                delete state.customGalleryOverrides[sku];
                saveJSON(STORAGE_KEYS.CUSTOM_IMG_OVERRIDES, state.customImgOverrides);
                saveJSON(STORAGE_KEYS.CUSTOM_GALLERY_OVERRIDES, state.customGalleryOverrides);
                initOnlineStore();
                showToast(`Fotos restauradas al recorte original del Agente para SKU ${sku}`);
            });
        }
    }

    function renderChoferDispatchConsole() {
        const body = document.getElementById('dispatch-chofer-body');
        if (!body) return;

        syncOrdersAndWorkshopIntoLogisticsQueue();

        const countTienda = state.logisticsQueue.filter(i => i.status === 'tienda').length;
        const countRuta = state.logisticsQueue.filter(i => i.status === 'ruta').length;
        const countEntregado = state.logisticsQueue.filter(i => i.status === 'entregado').length;

        const filteredItems = state.logisticsStatusFilter === 'todos'
            ? state.logisticsQueue
            : state.logisticsQueue.filter(i => i.status === state.logisticsStatusFilter);

        const activeRouteStops = state.logisticsQueue.filter(i => i.status === 'ruta' || i.status === 'tienda');

        body.innerHTML = `
            <!-- Barra Superior del Sistema PWA (Turno + Bloqueo de Sesión + Acceso Interno a Agentes) -->
            <div class="pwa-top-bar">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <span style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:#666;">TURNO ACTIVO:</span>
                    <button type="button" class="pwa-tab-btn ${state.logisticsShift === 'Matutino' ? 'active' : ''}" data-pwa-shift="Matutino">
                        Turno Matutino (10:30 – 14:30)
                    </button>
                    <button type="button" class="pwa-tab-btn ${state.logisticsShift === 'Vespertino' ? 'active' : ''}" data-pwa-shift="Vespertino">
                        Turno Vespertino (16:30 – 20:00)
                    </button>
                </div>

                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <button type="button" id="btn-pwa-open-ascend-agent" class="pwa-status-btn" title="Abrir Consola Interna de Agentes Ascend RMS y Quita-Fondos .PNG">
                        ⚡ Consola Agentes Ascend &amp; Fotos .PNG
                    </button>
                    <button type="button" id="btn-pwa-lock-session" class="pwa-status-btn" style="border-color:#ED1C24;color:#ED1C24;">
                        🔒 Bloquear Acceso (T1130)
                    </button>
                </div>
            </div>

            <!-- KPIs Operativos en Tiempo Real -->
            <div class="pwa-kpi-grid">
                <div class="pwa-kpi-item" style="border-left-color:#5C260C;">
                    <span style="font-size:0.72rem;font-weight:700;color:#666;">EN TIENDA CORONADO #1130</span>
                    <div style="font-family:var(--font-display);font-size:2rem;line-height:1;">${countTienda} PENDIENTES</div>
                    <small style="color:#666;">Listos para carga en camioneta</small>
                </div>
                <div class="pwa-kpi-item" style="border-left-color:#FF6600;">
                    <span style="font-size:0.72rem;font-weight:700;color:#666;">EN RUTA / RECOLECCIÓN</span>
                    <div style="font-family:var(--font-display);font-size:2rem;line-height:1;color:#FF6600;">${countRuta} EN TRÁNSITO</div>
                    <small style="color:#666;">Chofer: Roberto M. (Camioneta Taller)</small>
                </div>
                <div class="pwa-kpi-item" style="border-left-color:#22C55E;">
                    <span style="font-size:0.72rem;font-weight:700;color:#666;">COMPLETADOS HOY</span>
                    <div style="font-family:var(--font-display);font-size:2rem;line-height:1;color:#16A34A;">${countEntregado} ENTREGADOS</div>
                    <small style="color:#666;">Confirmados con firma / WhatsApp</small>
                </div>
                <div class="pwa-kpi-item" style="border-left-color:#1E1E1E;">
                    <span style="font-size:0.72rem;font-weight:700;color:#666;">BASE OPERATIVA</span>
                    <div style="font-family:var(--font-display);font-size:1.75rem;line-height:1;">DURANGO CENTRO</div>
                    <small style="color:#666;">Coronado #1130 Pte. · Tel. 618 823 0673</small>
                </div>
            </div>

            <!-- Filtros de Cola y Hoja de Ruta -->
            <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:28px;align-items:start;" class="clean-form-grid">
                <!-- Columna Izquierda: Cola Activa de Entregas y Recolecciones -->
                <div>
                    <div class="pwa-tabs-bar">
                        <button type="button" class="pwa-tab-btn ${state.logisticsStatusFilter === 'todos' ? 'active' : ''}" data-pwa-filter="todos">
                            Todos (${state.logisticsQueue.length})
                        </button>
                        <button type="button" class="pwa-tab-btn ${state.logisticsStatusFilter === 'tienda' ? 'active' : ''}" data-pwa-filter="tienda">
                            En Tienda (${countTienda})
                        </button>
                        <button type="button" class="pwa-tab-btn ${state.logisticsStatusFilter === 'ruta' ? 'active' : ''}" data-pwa-filter="ruta">
                            En Ruta (${countRuta})
                        </button>
                        <button type="button" class="pwa-tab-btn ${state.logisticsStatusFilter === 'entregado' ? 'active' : ''}" data-pwa-filter="entregado">
                            Entregados (${countEntregado})
                        </button>
                    </div>

                    <div>
                        ${filteredItems.map((ord) => {
                            const statusColor = ord.status === 'tienda' ? '#5C260C' : (ord.status === 'ruta' ? '#FF6600' : '#16A34A');
                            const statusText = ord.status === 'tienda' ? 'EN TIENDA CORONADO' : (ord.status === 'ruta' ? 'EN RUTA DE CHOFER' : 'ENTREGADO');
                            const cleanPhone = String(ord.customerPhone || '6188230673').replace(/\D/g, '');
                            const waMsg = ord.status === 'entregado'
                                ? `Hola ${ord.customerName}, confirmamos la entrega de tu folio ${ord.folio} en Cordillera Trek Durango. ¡Gracias por tu preferencia!`
                                : `Hola ${ord.customerName}, te contacta el equipo de Logística de Cordillera Trek (Coronado #1130) respecto a tu orden/servicio ${ord.folio} (${ord.itemsSummary}) con destino en ${ord.address}. Nuestro chofer va en ruta.`;
                            return `
                                <div style="border-left:4px solid ${statusColor};border-bottom:1px solid #E5E5E5;padding:14px 0 14px 16px;margin-bottom:12px;">
                                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:4px;">
                                        <div>
                                            <strong style="color:#ED1C24;font-size:0.92rem;">${ord.folio}</strong>
                                            <span style="margin:0 6px;color:#999;">&middot;</span>
                                            <strong style="font-size:0.95rem;">${ord.customerName}</strong>
                                            <span style="font-size:0.82rem;color:#666;">(${ord.customerPhone})</span>
                                        </div>
                                        <span style="font-size:0.72rem;font-weight:700;color:${statusColor};letter-spacing:0.06em;">
                                            ● ${statusText} · ${ord.time || ''}
                                        </span>
                                    </div>

                                    <div style="font-size:0.86rem;color:#222;margin-bottom:4px;">
                                        <strong>Dirección GPS:</strong> ${ord.address}
                                    </div>
                                    <div style="font-size:0.83rem;color:#555;margin-bottom:10px;">
                                        ${ord.itemsSummary} — <strong style="color:#5C260C;">${formatCurrency(ord.total)}</strong> (${ord.deliveryMode})
                                    </div>

                                    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;">
                                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                            <button type="button" class="pwa-status-btn ${ord.status === 'tienda' ? 'active' : ''}" data-pwa-set-status="tienda" data-pwa-folio="${ord.folio}">
                                                En Tienda
                                            </button>
                                            <button type="button" class="pwa-status-btn ${ord.status === 'ruta' ? 'active' : ''}" data-pwa-set-status="ruta" data-pwa-folio="${ord.folio}">
                                                En Ruta
                                            </button>
                                            <button type="button" class="pwa-status-btn ${ord.status === 'entregado' ? 'active' : ''}" data-pwa-set-status="entregado" data-pwa-folio="${ord.folio}">
                                                Entregado
                                            </button>
                                        </div>

                                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                            <a href="https://maps.google.com/?q=${encodeURIComponent(ord.address + ', Durango, Mexico')}" target="_blank" rel="noopener" class="pwa-status-btn">
                                                📍 Mapa GPS
                                            </a>
                                            <a href="https://wa.me/52${cleanPhone}?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener" class="pwa-status-btn" style="border-color:#16A34A;color:#16A34A;">
                                                💬 WhatsApp Cliente
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Columna Derecha: Hoja de Ruta de Camioneta + Alta Rápida de Orden -->
                <div style="border-left:1px solid #E5E5E5;padding-left:22px;">
                    <h3 class="sheet-section-heading" style="margin-top:0;">HOJA DE RUTA DE CAMIONETA (DURANGO)</h3>
                    <p style="font-size:0.84rem;color:#555;margin-bottom:14px;">
                        <strong>Salida Oficial:</strong> Sucursal Cordillera Trek — Calle Coronado #1130 Pte., Zona Centro, Durango.<br>
                        <strong>Unidad:</strong> Camioneta Taller &amp; Reparto Local.
                    </p>

                    <div style="margin-bottom:18px;">
                        <div style="padding:10px 0;border-bottom:1px dashed #DDD;font-size:0.84rem;">
                            <strong style="color:#FF6600;">PARADA 0 (BASE):</strong> Tienda Insignia Coronado #1130 Pte., Zona Centro
                        </div>
                        ${activeRouteStops.map((stop, idx) => `
                            <div style="padding:10px 0;border-bottom:1px dashed #DDD;font-size:0.84rem;">
                                <strong style="color:#1E1E1E;">PARADA ${idx + 1}:</strong> ${stop.customerName} (${stop.folio})<br>
                                <span style="color:#555;">${stop.address}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-bottom:24px;">
                        <a
                            href="https://wa.me/526188230673?text=${encodeURIComponent(
                                'HOJA DE RUTA CHOFER CORDILLERA TREK (' + state.logisticsShift + '):\n' +
                                activeRouteStops.map((s, i) => `${i + 1}. ${s.folio} - ${s.customerName} (${s.address}) - ${formatCurrency(s.total)}`).join('\n')
                            )}"
                            target="_blank"
                            rel="noopener"
                            class="btn-pill-cta btn-pill-orange">
                            <span>Despachar Ruta al WhatsApp del Chofer</span>
                            <span class="btn-pill-icon">
                                <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"></polyline></svg>
                            </span>
                        </a>
                    </div>

                    <!-- Formulario rápido para agregar recolección/envío manual -->
                    <div style="border-top:1px solid #E5E5E5;padding-top:18px;">
                        <h4 style="font-family:var(--font-display);font-size:1.35rem;margin-bottom:10px;">+ ASIGNAR RECOLECCIÓN O ENTREGA MANUAL</h4>
                        <form id="pwa-add-dispatch-form">
                            <div class="clean-field" style="margin-bottom:10px;">
                                <label for="pwa-new-customer">CLIENTE *</label>
                                <input type="text" id="pwa-new-customer" class="clean-input" placeholder="Nombre del ciclista" required>
                            </div>
                            <div class="clean-field" style="margin-bottom:10px;">
                                <label for="pwa-new-phone">WHATSAPP *</label>
                                <input type="tel" id="pwa-new-phone" class="clean-input" placeholder="618 000 0000" required>
                            </div>
                            <div class="clean-field" style="margin-bottom:10px;">
                                <label for="pwa-new-address">DIRECCIÓN EN DURANGO *</label>
                                <input type="text" id="pwa-new-address" class="clean-input" placeholder="Calle, número y colonia" required>
                            </div>
                            <div class="clean-field" style="margin-bottom:12px;">
                                <label for="pwa-new-desc">BICICLETA / PEDIDO / RECOLECCIÓN ($120) *</label>
                                <input type="text" id="pwa-new-desc" class="clean-input" placeholder="Ej. Recolección Trek Marlin 7 - Servicio Pro" required>
                            </div>
                            <button type="submit" class="btn-pill-cta btn-pill-darkgrey">
                                <span>Agregar a la Cola de Ruta</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Eventos interactivos del tablero PWA
        body.querySelectorAll('[data-pwa-shift]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.logisticsShift = btn.getAttribute('data-pwa-shift') || 'Matutino';
                renderChoferDispatchConsole();
            });
        });

        body.querySelectorAll('[data-pwa-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.logisticsStatusFilter = btn.getAttribute('data-pwa-filter') || 'todos';
                renderChoferDispatchConsole();
            });
        });

        body.querySelectorAll('[data-pwa-set-status]').forEach(btn => {
            btn.addEventListener('click', () => {
                const folio = btn.getAttribute('data-pwa-folio');
                const newStatus = btn.getAttribute('data-pwa-set-status');
                state.logisticsQueue = state.logisticsQueue.map(item =>
                    item.folio === folio ? { ...item, status: newStatus } : item
                );
                saveJSON('cordillera_rediseno_logistics_queue_v2', state.logisticsQueue);
                renderChoferDispatchConsole();
                showToast(`Estatus de ${folio} actualizado a ${newStatus.toUpperCase()}`);
            });
        });

        const openAgentInternalBtn = document.getElementById('btn-pwa-open-ascend-agent');
        if (openAgentInternalBtn) {
            openAgentInternalBtn.addEventListener('click', () => {
                const choferModal = document.getElementById('dispatch-chofer-modal');
                const ascendModal = document.getElementById('ascend-agent-modal');
                if (choferModal) choferModal.classList.remove('open');
                renderAscendAgentConsole();
                if (ascendModal) ascendModal.classList.add('open');
            });
        }

        const lockBtn = document.getElementById('btn-pwa-lock-session');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                state.logisticsUnlocked = false;
                const pinGate = document.getElementById('logistics-pin-gate');
                const choferWindow = document.getElementById('dispatch-chofer-window');
                const pinInput = document.getElementById('logistics-pin-input');
                body.style.display = 'none';
                if (pinGate) pinGate.style.display = 'block';
                if (choferWindow) choferWindow.classList.remove('dialog-wide');
                if (pinInput) {
                    pinInput.value = '';
                    pinInput.focus();
                }
                showToast('Sesión logística bloqueada. Se requiere contraseña T1130.');
            });
        }

        const addForm = document.getElementById('pwa-add-dispatch-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const customerName = document.getElementById('pwa-new-customer').value.trim();
                const customerPhone = document.getElementById('pwa-new-phone').value.trim();
                const address = document.getElementById('pwa-new-address').value.trim();
                const itemsSummary = document.getElementById('pwa-new-desc').value.trim();
                if (!customerName || !address) return;

                const newEntry = {
                    folio: 'RUTA-' + Math.floor(1000 + Math.random() * 9000),
                    customerName,
                    customerPhone,
                    address,
                    itemsSummary,
                    deliveryMode: 'Asignación Directa Coronado #1130',
                    total: 120,
                    status: 'ruta',
                    shift: state.logisticsShift,
                    time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                };
                state.logisticsQueue.unshift(newEntry);
                saveJSON('cordillera_rediseno_logistics_queue_v2', state.logisticsQueue);
                renderChoferDispatchConsole();
                showToast(`Orden ${newEntry.folio} agregada a la hoja de ruta.`);
            });
        }
    }

    /* ========================================================================
       10. ANIMACIONES DE APARICIÓN AL DESPLAZARSE (INTERSECTION OBSERVER)
       ======================================================================== */
    function initScrollRevealAnimations() {
        // Añadir clases de aparición escalonada a elementos clave de cada sección
        const staggerGroups = [
            '.workshop-service-option',
            '.about-stat-item',
            '.contact-detail-block',
            '.footer-top-grid > div'
        ];

        staggerGroups.forEach(selector => {
            document.querySelectorAll(selector).forEach((el, idx) => {
                if (!el.classList.contains('reveal-on-scroll')) {
                    el.classList.add('reveal-on-scroll');
                }
                const delayClass = `reveal-delay-${(idx % 4) + 1}`;
                el.classList.add(delayClass);
            });
        });

        const elements = document.querySelectorAll('.reveal-on-scroll');
        if (!('IntersectionObserver' in window)) {
            elements.forEach(el => el.classList.add('revealed'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        elements.forEach(el => observer.observe(el));
    }

    /* ========================================================================
       INICIALIZACIÓN AL CARGAR EL DOM
       ======================================================================== */
    document.addEventListener('DOMContentLoaded', () => {
        initIntroSplash();
        initStickyNavigation();
        initHeroSlider();
        initOnlineStore();
        initProductSheetAndGalleryModals();
        initWorkshopSection();
        initNewsSection();
        initCartAndCheckout();
        initUserAuthModal();
        initMultiAgentAndLogisticsConsoles();
        initScrollRevealAnimations();
    });

})();
