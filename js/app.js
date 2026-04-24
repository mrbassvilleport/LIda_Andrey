import { routes, portoRoutes } from '../data/index.js';
import { escapeHtml, fetchWithTimeout, readGalleryCache, writeGalleryCache } from './utils.js';
import { renderTransitConnector } from './transit.js';
const grid = document.getElementById('routesGrid');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealObserver = prefersReducedMotion ? null : new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.14,
    rootMargin: '0px 0px -60px 0px'
});

requestAnimationFrame(() => {
    document.body.classList.add('page-ready');
});

function shouldRetryRemoteImage(src = '') {
    return /wikimedia\.org|googleusercontent\.com/i.test(src);
}

function normalizeRemoteImagePolicy(root = document) {
    root.querySelectorAll?.('img[referrerpolicy="no-referrer"]:not([data-referrer-fixed])').forEach((image) => {
        const originalSrc = image.getAttribute('src');
        image.dataset.referrerFixed = '1';
        image.referrerPolicy = 'origin';
        image.setAttribute('referrerpolicy', 'origin');

        if (!originalSrc || !shouldRetryRemoteImage(originalSrc)) return;

        image.removeAttribute('src');
        image.setAttribute('src', originalSrc);
    });
}

normalizeRemoteImagePolicy();

const remoteImageObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;

            if (node.matches?.('img')) {
                normalizeRemoteImagePolicy(node.parentElement || document);
                return;
            }

            normalizeRemoteImagePolicy(node);
        });
    });
});

remoteImageObserver.observe(document.body, { childList: true, subtree: true });

document.querySelectorAll('.section-reveal').forEach((element) => {
    if (prefersReducedMotion) {
        element.classList.add('is-visible');
        return;
    }

    revealObserver.observe(element);
});

const ROUTE_CARD_AUTOPLAY_MS = 4200;
const REMOTE_IMAGE_REFERRER_POLICY = 'origin';
const COMMONS_API_TIMEOUT_MS = 12000;
const COMMONS_API_CONCURRENCY = 3;
const routeCardCarouselCleanup = new WeakMap();
let commonsApiActiveRequests = 0;
const commonsApiQueue = [];

function proxyWikimediaUrl(url) {
    if (!url || !url.includes('wikimedia.org')) return url;
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
}

function collectUniqueImageUrls(urls = []) {
    const seen = new Set();

    return urls.filter((url) => {
        if (!url || seen.has(url)) return false;
        seen.add(url);
        return true;
    });
}

function buildRemotePhoto(url, alt, fallbackUrls = []) {
    if (!url) return null;

    const directSrc = url.trim();
    const proxiedSrc = proxyWikimediaUrl(directSrc);
    const fallbackSrcs = collectUniqueImageUrls([
        proxiedSrc !== directSrc ? proxiedSrc : '',
        ...fallbackUrls.flatMap((candidate) => {
            const directFallback = (candidate || '').trim();
            if (!directFallback) return [];

            const proxiedFallback = proxyWikimediaUrl(directFallback);
            return [directFallback, proxiedFallback !== directFallback ? proxiedFallback : ''];
        }),
    ]);

    return {
        src: directSrc,
        alt,
        fallbackSrcs,
    };
}

function normalizeCommonsFileTitle(fileTitle = '') {
    return fileTitle.replace(/^File:/i, '').replace(/_/g, ' ').trim();
}

function buildCommonsFilePathUrl(fileTitle, width = 1600) {
    const fileName = normalizeCommonsFileTitle(fileTitle);
    if (!fileName) return '';
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;
}

function buildCuratedCommonsFilePhoto(fileTitle) {
    const fileName = normalizeCommonsFileTitle(fileTitle);
    if (!fileName) return null;
    return buildRemotePhoto(buildCommonsFilePathUrl(fileName), fileName.replace(/[_-]+/g, ' '));
}

function serializeFallbackSrcs(fallbackSrcs = []) {
    return fallbackSrcs.join('||');
}

function advanceImageFallback(image) {
    const pendingFallbacks = (image?.dataset?.fallbackSrcs || '')
        .split('||')
        .map((value) => value.trim())
        .filter(Boolean);

    if (!pendingFallbacks.length) return false;

    const nextSrc = pendingFallbacks.shift();
    image.dataset.fallbackSrcs = pendingFallbacks.join('||');
    image.setAttribute('src', nextSrc);
    return true;
}

function safeExternalUrl(value, fallback = '#') {
    if (!value) return fallback;

    try {
        const url = new URL(value, window.location.href);
        if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
    } catch {
        // Fall through to the inert fallback.
    }

    return fallback;
}

function buildMapsSearchUrl(query = '') {
    const searchParams = new URLSearchParams({ q: String(query || '').replace(/\+/g, ' ') });
    return `https://maps.google.com/?${searchParams.toString()}`;
}

function getRouteCardCoverPhotos(route) {
    const photos = [];
    const seen = new Set();

    appendUniquePhotos(photos, seen, [
        route.image ? buildRemotePhoto(route.image, route.title, route.imageFallback ? [route.imageFallback] : []) : null,
        route.imageFallback ? buildRemotePhoto(route.imageFallback, route.title) : null,
    ].filter(Boolean), 2);

    return photos;
}

function getRouteCardInitialIndex(slideCount) {
    if (slideCount <= 1) return 0;
    return Math.floor(Math.random() * slideCount);
}

function renderRouteCardSlides(route, photos, initialIndex = 0) {
    return photos.map((photo, index) => `
        <figure class="route-card-slide${index === initialIndex ? ' is-active' : ''}">
            <img src="${escapeHtml(photo.src)}"${photo.fallbackSrcs?.length ? ` data-fallback-srcs="${escapeHtml(serializeFallbackSrcs(photo.fallbackSrcs))}"` : ''} alt="${escapeHtml(photo.alt || route.title)}" loading="lazy" decoding="async" referrerpolicy="${REMOTE_IMAGE_REFERRER_POLICY}" class="w-full h-full object-cover transition-all duration-700" />
        </figure>
    `).join('');
}

function initializeRouteCardCarousel(card, route, photos = getRouteCardCoverPhotos(route)) {
    routeCardCarouselCleanup.get(card)?.();

    const carousel = card.querySelector('[data-route-card-carousel]');
    const track = card.querySelector('[data-route-card-track]');
    const prevButton = card.querySelector('[data-route-card-prev]');
    const nextButton = card.querySelector('[data-route-card-next]');

    if (!carousel || !track || !prevButton || !nextButton) return;

    const safePhotos = photos.length ? photos : getRouteCardCoverPhotos(route);
    const initialIndex = getRouteCardInitialIndex(safePhotos.length);
    track.innerHTML = renderRouteCardSlides(route, safePhotos, initialIndex);
    carousel.classList.toggle('route-card-fallback', !safePhotos.length);

    const slides = Array.from(track.querySelectorAll('.route-card-slide'));
    if (!slides.length) return;

    const slideImages = slides.map((slide) => slide.querySelector('img'));
    const failedIndices = new Set();
    let currentIndex = initialIndex;
    let autoplayTimer = null;

    function getAvailableSlideCount() {
        return slides.length - failedIndices.size;
    }

    function updateNavVisibility() {
        const hasMultipleSlides = getAvailableSlideCount() > 1;
        prevButton.hidden = !hasMultipleSlides;
        nextButton.hidden = !hasMultipleSlides;
    }

    function findNextAvailableIndex(startIndex, direction = 1) {
        for (let step = 0; step < slides.length; step += 1) {
            const candidateIndex = (startIndex + (direction * step) + slides.length * 2) % slides.length;
            if (!failedIndices.has(candidateIndex)) return candidateIndex;
        }

        return -1;
    }

    function setActive(nextIndex, direction = 1) {
        const resolvedIndex = findNextAvailableIndex((nextIndex + slides.length) % slides.length, direction);
        if (resolvedIndex < 0) {
            carousel.classList.add('route-card-fallback');
            updateNavVisibility();
            return;
        }

        currentIndex = resolvedIndex;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('is-active', slideIndex === currentIndex);
            slide.hidden = failedIndices.has(slideIndex);
        });
        carousel.classList.remove('route-card-fallback');
        updateNavVisibility();
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            window.clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function startAutoplay() {
        if (prefersReducedMotion || getAvailableSlideCount() < 2) return;
        stopAutoplay();
        autoplayTimer = window.setInterval(() => {
            setActive(currentIndex + 1, 1);
        }, ROUTE_CARD_AUTOPLAY_MS);
    }

    function stepSlides(direction) {
        stopAutoplay();
        setActive(currentIndex + direction, direction);
        startAutoplay();
    }

    const handlePrevClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        stepSlides(-1);
    };
    const handleNextClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        stepSlides(1);
    };
    const handleArrowKeydown = (event) => {
        event.stopPropagation();
    };
    const handlePointerEnter = () => stopAutoplay();
    const handlePointerLeave = () => startAutoplay();
    const handleFocusIn = () => stopAutoplay();
    const handleFocusOut = (event) => {
        if (!carousel.contains(event.relatedTarget)) {
            startAutoplay();
        }
    };

    prevButton.addEventListener('click', handlePrevClick);
    nextButton.addEventListener('click', handleNextClick);
    prevButton.addEventListener('keydown', handleArrowKeydown);
    nextButton.addEventListener('keydown', handleArrowKeydown);
    carousel.addEventListener('mouseenter', handlePointerEnter);
    carousel.addEventListener('mouseleave', handlePointerLeave);
    carousel.addEventListener('focusin', handleFocusIn);
    carousel.addEventListener('focusout', handleFocusOut);

    slideImages.forEach((image, index) => {
        image?.addEventListener('error', () => {
            if (advanceImageFallback(image)) return;

            failedIndices.add(index);
            slides[index]?.classList.remove('is-active');
            slides[index] && (slides[index].hidden = true);

            if (!getAvailableSlideCount()) {
                stopAutoplay();
                carousel.classList.add('route-card-fallback');
                updateNavVisibility();
                return;
            }

            if (currentIndex === index) {
                setActive(index + 1, 1);
            } else {
                updateNavVisibility();
            }
        });
    });

    setActive(currentIndex, 1);
    startAutoplay();

    routeCardCarouselCleanup.set(card, () => {
        stopAutoplay();
        prevButton.removeEventListener('click', handlePrevClick);
        nextButton.removeEventListener('click', handleNextClick);
        prevButton.removeEventListener('keydown', handleArrowKeydown);
        nextButton.removeEventListener('keydown', handleArrowKeydown);
        carousel.removeEventListener('mouseenter', handlePointerEnter);
        carousel.removeEventListener('mouseleave', handlePointerLeave);
        carousel.removeEventListener('focusin', handleFocusIn);
        carousel.removeEventListener('focusout', handleFocusOut);
    });
}

function createRouteCard(route, index) {
    const card = document.createElement('div');
    card.dataset.routeId = String(route.id);
    card.className = `route-card group ${route.ready ? 'cursor-pointer' : 'coming-soon opacity-70 grayscale'}`;
    card.style.transitionDelay = `${index * 90}ms`;

    card.innerHTML = `
        <div class="route-card-media relative mb-6 rounded-2xl overflow-hidden aspect-[3/4] bg-primary/5 route-card-shadow">
            <div class="route-card-carousel" data-route-card-carousel>
                <div class="route-card-carousel-track" data-route-card-track></div>
                <button type="button" class="route-card-nav prev" data-route-card-prev aria-label="Previous route photo for ${escapeHtml(route.title)}" hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button type="button" class="route-card-nav next" data-route-card-next aria-label="Next route photo for ${escapeHtml(route.title)}" hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
                </button>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent"></div>
            <div class="absolute top-5 left-5">
                <span class="text-[#b8953e] font-serif font-bold text-5xl leading-none opacity-50">${String(index + 1).padStart(2, '0')}</span>
            </div>
            <div class="absolute bottom-5 left-5 right-5">
                <span class="inline-block bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] text-white/90 uppercase border border-white/10">${escapeHtml(route.category)}</span>
            </div>
            ${!route.ready ? '<div class="absolute inset-0 flex items-center justify-center bg-primary/40 backdrop-blur-sm"><span class="bg-white/90 px-5 py-2 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] text-primary">Скоро</span></div>' : ''}
        </div>
        <div class="space-y-3 px-1">
            <h3 class="route-card-title text-2xl md:text-[1.7rem] font-serif font-bold text-primary leading-tight">${escapeHtml(route.title)}</h3>
            <p class="text-on-surface-variant text-sm leading-relaxed">${escapeHtml(route.subtitle)}</p>
            <div class="route-card-meta pt-4 flex items-center gap-6 border-t border-primary/8">
                <span class="text-[10px] font-bold text-tertiary tracking-[0.15em] uppercase">${escapeHtml(route.duration)}</span>
                <span class="text-[10px] font-medium text-primary/30 uppercase tracking-[0.15em]">${escapeHtml(route.distance || '--')}</span>
            </div>
        </div>
    `;

    if (route.ready) {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.onclick = () => openRoute(route);
        card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRoute(route); } };
    }

    return card;
}

function mountRouteGrid(gridNode, routeList) {
    const fragment = document.createDocumentFragment();
    const cards = routeList.map((route, index) => {
        const card = createRouteCard(route, index);
        fragment.appendChild(card);
        return { card, route };
    });

    gridNode.replaceChildren(fragment);

    cards.forEach(({ card, route }) => {
        initializeRouteCardCarousel(card, route);

        if (prefersReducedMotion) {
            card.classList.add('is-visible');
        } else {
            revealObserver.observe(card);
        }
    });
}

mountRouteGrid(grid, routes.filter((route) => route.ready));

const galleryPhotoCache = new Map();

// ======= Lazy Leaflet loader =======
let leafletLoadPromise = null;
function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletLoadPromise) return leafletLoadPromise;
    leafletLoadPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.async = true;
        s.onload = () => resolve(window.L);
        s.onerror = () => { leafletLoadPromise = null; reject(new Error('Leaflet failed to load')); };
        document.head.appendChild(s);
    });
    return leafletLoadPromise;
}

function renderGalleryShell(routeId, placeIndex, place) {
    return `
        <div class="place-gallery" data-gallery-root data-route-id="${routeId}" data-place-index="${placeIndex}">
            <div class="place-gallery-shell">
                <div class="place-gallery-stage">
                    <div class="place-gallery-slides">
                        <div class="place-gallery-skeleton is-active"></div>
                        <div class="place-gallery-skeleton"></div>
                        <div class="place-gallery-skeleton"></div>
                    </div>
                    <span class="place-gallery-badge">Фото локации</span>
                    <span class="place-gallery-status">Загрузка...</span>
                    <button type="button" class="place-gallery-nav prev" data-gallery-prev hidden aria-label="Предыдущее фото для ${escapeHtml(place.nameRu)}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <button type="button" class="place-gallery-nav next" data-gallery-next hidden aria-label="Следующее фото для ${escapeHtml(place.nameRu)}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                </div>
                <div class="place-gallery-preview">
                    <div class="place-gallery-thumb-skeleton"></div>
                    <div class="place-gallery-thumb-skeleton"></div>
                    <div class="place-gallery-thumb-skeleton"></div>
                    <div class="place-gallery-thumb-skeleton"></div>
                </div>
                <div class="place-gallery-credit">
                    <span>${place.nameRu}</span>
                    <span>${place.galleryFiles?.length ? 'Подборка редактора' : 'Wikimedia Commons'}</span>
                </div>
            </div>
        </div>
    `;
}

function buildCommonsApiUrl(params) {
    const searchParams = new URLSearchParams({
        action: 'query',
        format: 'json',
        formatversion: '2',
        origin: '*',
        ...params,
    });

    return `https://commons.wikimedia.org/w/api.php?${searchParams.toString()}`;
}

function runQueuedCommonsRequest(task) {
    return new Promise((resolve, reject) => {
        const run = () => {
            commonsApiActiveRequests += 1;

            task()
                .then(resolve, reject)
                .finally(() => {
                    commonsApiActiveRequests -= 1;
                    const next = commonsApiQueue.shift();
                    if (next) next();
                });
        };

        if (commonsApiActiveRequests < COMMONS_API_CONCURRENCY) {
            run();
        } else {
            commonsApiQueue.push(run);
        }
    });
}

async function fetchCommonsJson(params, errorMessage) {
    const response = await runQueuedCommonsRequest(() => fetchWithTimeout(
        buildCommonsApiUrl(params),
        COMMONS_API_TIMEOUT_MS
    ));

    if (!response.ok) {
        throw new Error(errorMessage);
    }

    return response.json();
}

function isUsableCommonsPhoto(page) {
    const info = page.imageinfo?.[0];
    const title = (page.title || '').toLowerCase();

    if (!info || !(info.mime || '').startsWith('image/')) return false;
    if (!info.thumburl && !info.url) return false;
    if (/\.(svg|gif|tif|tiff|pdf)$/i.test(page.title || '')) return false;
    if (/(map|plan|scheme|logo|flag|coat of arms|locator|icon|symbol|seal)/i.test(title)) return false;

    return true;
}

function scoreCommonsPhoto(page, keywords = []) {
    const info = page.imageinfo?.[0] || {};
    const title = (page.title || '').toLowerCase();
    const width = info.thumbwidth || info.width || 0;
    const height = info.thumbheight || info.height || 0;
    const ratio = width && height ? width / height : 1;
    let score = width + height;

    if (ratio > 0.9 && ratio < 2.2) score += 900;
    if (/panorama|sunset|night|view|lisbon|lisboa|tejo|tagus|rossio|augusta|carmo|parque|porto|douro|gaia|foz|ribeira|serralves|clerigos|clérigos|bento|tram/.test(title)) score += 700;
    if (/cropped|poster|detail|drawing|logo|map/.test(title)) score -= 1800;
    keywords.forEach((keyword) => {
        if (title.includes(keyword.toLowerCase())) {
            score += 1100;
        }
    });

    return score;
}

function appendUniquePhotos(target, seen, photos, limit = 4) {
    photos.forEach((photo) => {
        if (!photo?.src || seen.has(photo.src) || target.length >= limit) return;
        seen.add(photo.src);
        target.push(photo);
    });
}

function buildGallerySearchQueries(place) {
    const keywords = (place.galleryKeywords || []).filter(Boolean).slice(0, 3);
    const queries = [
        place.gallerySearchQuery,
        place.mapsQuery ? place.mapsQuery.replace(/\+/g, ' ') : '',
        place.name,
        [place.name, ...keywords].filter(Boolean).join(' '),
    ];

    return [...new Set(
        queries
            .map((value) => (value || '').replace(/\s+/g, ' ').trim())
            .filter(Boolean)
    )];
}

async function fetchCommonsCategoryPhotos(categoryTitle, limit = 4, keywords = []) {
    const data = await fetchCommonsJson({
        generator: 'categorymembers',
        gcmtitle: `Category:${categoryTitle}`,
        gcmtype: 'file',
        gcmlimit: '12',
        prop: 'imageinfo',
        iiprop: 'url|mime|size',
        iiurlwidth: '1600',
    }, `Failed to load gallery for category ${categoryTitle}`);
    const pages = data.query?.pages || [];

    return pages
        .filter(isUsableCommonsPhoto)
        .sort((a, b) => scoreCommonsPhoto(b, keywords) - scoreCommonsPhoto(a, keywords))
        .map((page) => {
            const info = page.imageinfo[0];
            return buildRemotePhoto(info.thumburl || info.url, page.title.replace(/^File:/, '').replace(/[_-]+/g, ' '));
        })
        .filter(Boolean)
        .slice(0, limit);
}

async function fetchCommonsSearchPhotos(searchQuery, limit = 4, keywords = []) {
    const data = await fetchCommonsJson({
        generator: 'search',
        gsrsearch: searchQuery,
        gsrnamespace: '6',
        gsrlimit: '12',
        prop: 'imageinfo',
        iiprop: 'url|mime|size',
        iiurlwidth: '1600',
    }, `Failed to search gallery for ${searchQuery}`);
    const pages = data.query?.pages || [];

    return pages
        .filter(isUsableCommonsPhoto)
        .sort((a, b) => scoreCommonsPhoto(b, keywords) - scoreCommonsPhoto(a, keywords))
        .map((page) => {
            const info = page.imageinfo[0];
            return buildRemotePhoto(info.thumburl || info.url, page.title.replace(/^File:/, '').replace(/[_-]+/g, ' '));
        })
        .filter(Boolean)
        .slice(0, limit);
}

async function fetchCommonsFiles(fileTitles = []) {
    if (!fileTitles.length) return [];

    const data = await fetchCommonsJson({
        titles: fileTitles.join('|'),
        prop: 'imageinfo',
        iiprop: 'url|mime|size',
        iiurlwidth: '1600',
        redirects: '1',
    }, 'Failed to load curated gallery files');
    const pages = data.query?.pages || [];
    const pageMap = new Map(
        pages
            .filter((page) => !page.missing)
            .map((page) => [normalizeCommonsFileTitle(page.title).toLowerCase(), page])
    );

    return fileTitles
        .map((title) => pageMap.get(normalizeCommonsFileTitle(title).toLowerCase()))
        .filter(Boolean)
        .filter(isUsableCommonsPhoto)
        .map((page) => {
            const info = page.imageinfo[0];
            return buildRemotePhoto(info.thumburl || info.url, page.title.replace(/^File:/, '').replace(/[_-]+/g, ' '));
        });
}

async function getPlaceGalleryPhotos(place) {
    const fileList = place.galleryFiles || [];
    const categoryList = place.galleryCategories || [];
    const keywords = place.galleryKeywords || [];
    const searchQueries = buildGallerySearchQueries(place);
    const cacheKey = `${fileList.join('|')}::${categoryList.join('|')}::${keywords.join('|')}::${searchQueries.join('|')}`;

    if (!cacheKey) return [];
    if (galleryPhotoCache.has(cacheKey)) return galleryPhotoCache.get(cacheKey);

    const cached = readGalleryCache(cacheKey);
    if (cached && cached.length) {
        const resolved = Promise.resolve(cached);
        galleryPhotoCache.set(cacheKey, resolved);
        return resolved;
    }

    const loader = (async () => {
        const collected = [];
        const seen = new Set();

        if (fileList.length) {
            appendUniquePhotos(collected, seen, fileList.map(buildCuratedCommonsFilePhoto));
        }

        if (fileList.length && collected.length < 4) {
            try {
                const curatedPhotos = await fetchCommonsFiles(fileList);
                appendUniquePhotos(collected, seen, curatedPhotos);
            } catch (error) {
                console.warn('Gallery file selection failed', place.nameRu, error);
            }
        }

        for (const category of categoryList) {
            try {
                const photos = await fetchCommonsCategoryPhotos(category, 6, keywords);
                appendUniquePhotos(collected, seen, photos);
            } catch (error) {
                console.warn('Gallery category failed', category, error);
            }

            if (collected.length >= 4) break;
        }

        if (collected.length < 4) {
            for (const searchQuery of searchQueries) {
                try {
                    const photos = await fetchCommonsSearchPhotos(searchQuery, 8, keywords);
                    appendUniquePhotos(collected, seen, photos);
                } catch (error) {
                    console.warn('Gallery search fallback failed', searchQuery, error);
                }

                if (collected.length >= 4) break;
            }
        }

        const final = collected.slice(0, 4);
        if (final.length) writeGalleryCache(cacheKey, final);
        return final;
    })();

    galleryPhotoCache.set(cacheKey, loader);
    loader.then((photos) => {
        if (!photos.length) galleryPhotoCache.delete(cacheKey);
    }, () => {
        galleryPhotoCache.delete(cacheKey);
    });
    return loader;
}

function renderGalleryFallback(root, place) {
    const stage = root.querySelector('.place-gallery-slides');
    const preview = root.querySelector('.place-gallery-preview');
    const status = root.querySelector('.place-gallery-status');

    stage.innerHTML = `
        <div class="place-gallery-empty">
            <div>
                <strong>${escapeHtml(place.nameRu)}</strong>
                <span>Фотографии можно будет догрузить позже, но описание и точка на карте уже готовы.</span>
            </div>
        </div>
    `;
    preview.innerHTML = '';
    status.textContent = 'Фото позже';
}

function mountPlaceGallery(root, place, photos) {
    if (!root) return;

    const stage = root.querySelector('.place-gallery-slides');
    const preview = root.querySelector('.place-gallery-preview');
    const status = root.querySelector('.place-gallery-status');
    const prevButton = root.querySelector('[data-gallery-prev]');
    const nextButton = root.querySelector('[data-gallery-next]');

    if (!photos.length) {
        renderGalleryFallback(root, place);
        return;
    }

    let currentIndex = 0;

    stage.innerHTML = photos.map((photo, index) => `
        <figure class="place-gallery-slide${index === 0 ? ' is-active' : ''}">
            <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(place.nameRu)} — фото ${index + 1}" loading="lazy" decoding="async" referrerpolicy="${REMOTE_IMAGE_REFERRER_POLICY}" />
        </figure>
    `).join('');

    preview.innerHTML = photos.map((photo, index) => `
        <button type="button" class="place-gallery-thumb${index === 0 ? ' is-active' : ''}" data-gallery-thumb="${index}" aria-label="Показать фото ${index + 1} для ${escapeHtml(place.nameRu)}">
            <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(place.nameRu)} — превью ${index + 1}" loading="lazy" decoding="async" referrerpolicy="${REMOTE_IMAGE_REFERRER_POLICY}" />
        </button>
    `).join('');

    Array.from(root.querySelectorAll('.place-gallery-slide img')).forEach((image, index) => {
        if (photos[index]?.fallbackSrcs?.length) {
            image.dataset.fallbackSrcs = serializeFallbackSrcs(photos[index].fallbackSrcs);
        }
    });

    Array.from(root.querySelectorAll('.place-gallery-thumb img')).forEach((image, index) => {
        if (photos[index]?.fallbackSrcs?.length) {
            image.dataset.fallbackSrcs = serializeFallbackSrcs(photos[index].fallbackSrcs);
        }
    });

    Array.from(root.querySelectorAll('.place-gallery-slide img, .place-gallery-thumb img')).forEach((image) => {
        const originalSrc = image.getAttribute('src');
        image.referrerPolicy = REMOTE_IMAGE_REFERRER_POLICY;

        if (!originalSrc) return;

        image.removeAttribute('src');
        image.setAttribute('src', originalSrc);
    });

    const slides = Array.from(stage.querySelectorAll('.place-gallery-slide'));
    const thumbs = Array.from(preview.querySelectorAll('.place-gallery-thumb'));
    const slideImages = slides.map((slide) => slide.querySelector('img'));
    const thumbImages = thumbs.map((thumb) => thumb.querySelector('img'));
    const failedIndices = new Set();

    function findNextAvailableIndex(startIndex, direction = 1) {
        for (let step = 0; step < photos.length; step += 1) {
            const candidateIndex = (startIndex + (direction * step) + photos.length * 2) % photos.length;
            if (!failedIndices.has(candidateIndex)) return candidateIndex;
        }

        return -1;
    }

    function updateGallery(nextIndex, direction = 1) {
        const resolvedIndex = findNextAvailableIndex((nextIndex + photos.length) % photos.length, direction);
        if (resolvedIndex < 0) return;

        currentIndex = resolvedIndex;
        slides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === currentIndex);
        });
        thumbs.forEach((thumb, index) => {
            thumb.classList.toggle('is-active', index === currentIndex);
            thumb.hidden = failedIndices.has(index);
        });
        status.textContent = `${currentIndex + 1} / ${photos.length}`;
    }

    slideImages.forEach((image, index) => {
        image?.addEventListener('error', () => {
            if (advanceImageFallback(image)) return;

            failedIndices.add(index);
            slides[index]?.classList.remove('is-active');
            thumbs[index]?.classList.remove('is-active');
            thumbs[index] && (thumbs[index].hidden = true);
            image.remove();

            if (failedIndices.size >= photos.length) {
                renderGalleryFallback(root, place);
                return;
            }

            if (currentIndex === index) {
                updateGallery(index + 1, 1);
            }
        });
    });

    thumbImages.forEach((image, index) => {
        image?.addEventListener('error', () => {
            if (advanceImageFallback(image)) return;
            thumbs[index] && (thumbs[index].hidden = true);
        });
    });

    status.textContent = `1 / ${photos.length}`;

    if (photos.length > 1) {
        prevButton.hidden = false;
        nextButton.hidden = false;
        prevButton.addEventListener('click', () => updateGallery(currentIndex - 1, -1));
        nextButton.addEventListener('click', () => updateGallery(currentIndex + 1, 1));
    }

    thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => {
            updateGallery(Number(thumb.dataset.galleryThumb), 1);
        });
    });
}

async function hydratePlaceGalleries(route) {
    const galleryRoots = Array.from(modalContent.querySelectorAll('[data-gallery-root]'));

    await Promise.all(galleryRoots.map(async (root) => {
        const placeIndex = Number(root.dataset.placeIndex);
        const place = route.places[placeIndex];
        if (!place) return;

        try {
            const photos = await getPlaceGalleryPhotos(place);
            mountPlaceGallery(root, place, photos);
        } catch (error) {
            console.warn('Place gallery failed', place.nameRu, error);
            renderGalleryFallback(root, place);
        }
    }));
}

const overlay = document.getElementById('modalOverlay');
const panel = document.getElementById('modalPanel');
let closeBtn = document.getElementById('modalCloseBtn');
let modalCloseTitle = document.getElementById('modalCloseTitle');
const modalMap = document.getElementById('modalMap');
const modalContent = document.getElementById('modalContent');
const modalHeader = closeBtn.parentElement;
modalHeader.className = 'sticky top-0 z-[700] bg-surface/84 backdrop-blur-lg border-b border-tertiary/10 px-4 sm:px-8 py-4';
modalHeader.innerHTML = `
    <div class="modal-topbar">
        <button class="modal-back-btn" id="modalCloseBtn" aria-label="\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A \u0432\u044B\u0431\u043E\u0440\u0443 \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u043E\u0432">
            <span class="modal-back-arrow" aria-hidden="true">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 18l-6-6 6-6"></path>
                </svg>
            </span>
            <span>\u041A \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430\u043C</span>
        </button>
        <span class="font-serif italic font-bold text-primary text-lg" id="modalCloseTitle">\u041C\u0430\u0440\u0448\u0440\u0443\u0442</span>
    </div>
`;
closeBtn = document.getElementById('modalCloseBtn');
modalCloseTitle = document.getElementById('modalCloseTitle');
closeBtn.setAttribute('title', '\u041D\u0430\u0437\u0430\u0434 \u043A \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430\u043C');
let map = null;
let mapTimer = null;
let closeTimer = null;
let lastFocusedElement = null;
const enableMapScrollZoom = () => {
    if (map) map.scrollWheelZoom.enable();
};
const disableMapScrollZoom = () => {
    if (map) map.scrollWheelZoom.disable();
};

modalMap.addEventListener('mouseenter', enableMapScrollZoom);
modalMap.addEventListener('mouseleave', disableMapScrollZoom);

function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = panel.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"]), input, select, textarea');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
}

function openRoute(route, opts = {}) {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    if (mapTimer) { clearTimeout(mapTimer); mapTimer = null; }

    if (!opts.skipHash) {
        const newHash = '#route=' + route.id;
        if (window.location.hash !== newHash) {
            history.pushState({ routeId: route.id }, '', newHash);
        }
    }

    lastFocusedElement = document.activeElement;
    document.body.classList.add('body-locked');
    overlay.classList.remove('invisible');
    panel.setAttribute('aria-label', route.title);
    modalCloseTitle.textContent = route.title;
    panel.scrollTop = 0;
    modalMap.innerHTML = '';

    modalContent.innerHTML = `
        <div class="modal-rise text-center mb-16" style="--delay: 80ms;">
            <div class="flex items-center justify-center gap-4 mb-6">
                <div class="w-8 h-px bg-tertiary"></div>
                <span class="text-tertiary font-bold tracking-[0.25em] uppercase text-[10px]">${escapeHtml(route.category)}</span>
                <div class="w-8 h-px bg-tertiary"></div>
            </div>
            <h2 class="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary mb-4 leading-tight">${escapeHtml(route.title)}</h2>
            <p class="text-xl text-on-surface-variant italic font-serif mb-10">${escapeHtml(route.subtitle)}</p>
            <div class="flex justify-center gap-8 sm:gap-14 flex-wrap">
                <div class="modal-rise text-center" style="--delay: 150ms;">
                    <span class="block text-primary font-serif font-bold text-2xl">${escapeHtml(route.duration)}</span>
                    <span class="text-[9px] uppercase tracking-[0.2em] text-tertiary font-bold mt-1 block">Длительность</span>
                </div>
                <div class="modal-rise text-center" style="--delay: 220ms;">
                    <span class="block text-primary font-serif font-bold text-2xl">${escapeHtml(route.distance)}</span>
                    <span class="text-[9px] uppercase tracking-[0.2em] text-tertiary font-bold mt-1 block">Дистанция</span>
                </div>
                <div class="modal-rise text-center" style="--delay: 290ms;">
                    <span class="block text-primary font-serif font-bold text-2xl">${escapeHtml(route.difficulty)}</span>
                    <span class="text-[9px] uppercase tracking-[0.2em] text-tertiary font-bold mt-1 block">Сложность</span>
                </div>
            </div>
        </div>

        <div class="space-y-16 relative">
            <div class="modal-rise absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-tertiary/20 via-tertiary/10 to-transparent hidden md:block" style="--delay: 260ms;"></div>
            ${route.places.map((place, i) => `
                ${i > 0 && place.transit ? renderTransitConnector(place.transit, 300 + (i * 95), route.places[i - 1].coords, place.coords) : ''}
                <div id="place-${i}" class="modal-place flex flex-col md:flex-row gap-8 relative" style="--delay: ${340 + (i * 95)}ms;">
                    <div class="place-step hidden md:flex absolute left-0 -translate-x-1/2 w-12 h-12 rounded-full bg-surface border-2 border-tertiary/25 items-center justify-center font-bold text-tertiary z-10 shadow-sm text-base leading-none">
                        ${i + 1}
                    </div>
                    <div class="place-body md:pl-16">
                        ${renderGalleryShell(route.id, i, place)}
                        <div class="place-copy space-y-4">
                            <div>
                                <h4 class="text-2xl font-serif font-bold text-primary">${escapeHtml(place.name)}</h4>
                                <p class="text-secondary font-serif italic text-lg">${escapeHtml(place.nameRu)}</p>
                            </div>
                            <p class="text-on-surface-variant leading-relaxed">${escapeHtml(place.description)}</p>
                            <div class="flex gap-4 pt-2 flex-wrap">
                                <a href="${escapeHtml(safeExternalUrl(place.sourceUrl || place.wikiUrl))}" target="_blank" rel="noopener noreferrer" class="text-[10px] font-bold uppercase tracking-[0.15em] text-tertiary/70 hover:text-secondary transition-all flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
                                    ${escapeHtml(place.sourceLabel || 'Wikipedia')}
                                </a>
                                <a href="${escapeHtml(buildMapsSearchUrl(place.mapsQuery))}" target="_blank" rel="noopener noreferrer" class="text-[10px] font-bold uppercase tracking-[0.15em] text-tertiary/70 hover:text-secondary transition-all flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                ${i < route.places.length - 1 && !route.places[i + 1]?.transit ? `<div class="manuscript-divider" style="--delay: ${420 + (i * 95)}ms;"></div>` : ''}
            `).join('')}
        </div>

        <div class="modal-rise mt-20 p-8 rounded-2xl bg-primary/[0.03] border border-tertiary/15" style="--delay: ${420 + (route.places.length * 95)}ms;">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-9 h-9 rounded-full bg-tertiary/15 flex items-center justify-center text-tertiary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
                </div>
                <h5 class="font-serif font-bold text-primary text-xl">Советы Куратора</h5>
            </div>
            <p class="text-on-surface-variant italic font-serif leading-relaxed">${escapeHtml(route.tip)}</p>
        </div>
    `;

    hydratePlaceGalleries(route).catch((error) => {
        console.warn('Route galleries failed', route.title, error);
    });

    overlay.classList.remove('invisible');
    requestAnimationFrame(() => {
        overlay.classList.add('opacity-100');
        panel.classList.remove('translate-y-full');
        closeBtn.focus();
    });
    document.addEventListener('keydown', trapFocus);

    mapTimer = setTimeout(() => {
        mapTimer = null;
        initMap(route);
    }, 700);
}

async function initMap(route) {
    try { await loadLeaflet(); } catch (e) { console.warn('Leaflet load failed', e); modalMap.innerHTML = '<div style="padding:2rem;text-align:center;color:#5a5a52;font-family:Plus Jakarta Sans,sans-serif">Не удалось загрузить карту. Описания маршрута и фото ниже доступны.</div>'; return; }
    if (map) map.remove();
    modalMap.innerHTML = '';
    map = L.map(modalMap, { scrollWheelZoom: false }).setView(route.mapCenter, route.mapZoom);
    map.attributionControl.setPrefix(false);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(map);

    const coords = [];
    route.places.forEach((place, i) => {
        const icon = L.divIcon({
            className: '',
            html: `<div class="custom-marker">${i + 1}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        L.marker(place.coords, { icon }).addTo(map).bindPopup(`<div class="font-serif font-bold popup-link" style="cursor:pointer" data-place-index="${i}">${place.nameRu}</div>`);
        coords.push(place.coords);
    });

    L.polyline(coords, { color: '#b8953e', weight: 2.5, opacity: 0.45, dashArray: '8, 12' }).addTo(map);
    map.fitBounds(coords, { padding: [50, 50] });

    map.on('popupopen', () => {
        document.querySelectorAll('.popup-link').forEach(el => {
            el.onclick = () => {
                const target = document.getElementById('place-' + el.dataset.placeIndex);
                if (target) {
                    const header = panel.querySelector('.sticky');
                    const offset = header ? header.offsetHeight + 20 : 20;
                    const top = target.getBoundingClientRect().top + panel.scrollTop - panel.getBoundingClientRect().top - offset;
                    panel.scrollTo({ top, behavior: 'smooth' });
                }
                map.closePopup();
            };
        });
    });
}

function closeRoute(opts = {}) {
    if (mapTimer) { clearTimeout(mapTimer); mapTimer = null; }
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    document.removeEventListener('keydown', trapFocus);

    if (!opts.skipHash && window.location.hash.startsWith('#route=')) {
        history.replaceState({ routeId: null }, '', window.location.pathname + window.location.search);
    }

    panel.classList.add('translate-y-full');
    overlay.classList.remove('opacity-100');
    closeTimer = setTimeout(() => {
        closeTimer = null;
        overlay.classList.add('invisible');
        document.body.classList.remove('body-locked');
        if (map) map.remove();
        map = null;
    }, 500);

    if (lastFocusedElement) { lastFocusedElement.focus(); lastFocusedElement = null; }
}

closeBtn.onclick = closeRoute;
overlay.onclick = closeRoute;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeRoute(); });

// ======= Porto routes =======
const portoGrid = document.getElementById('portoRoutesGrid');
mountRouteGrid(portoGrid, portoRoutes.filter((route) => route.ready));

// ======= Deep-link sync (popstate + initial load) =======
const allRoutes = [...routes, ...portoRoutes];

function routeFromHash() {
    const m = window.location.hash.match(/#route=(\d+)/);
    if (!m) return null;
    return allRoutes.find(r => r.id === Number(m[1]) && r.ready) || null;
}

window.addEventListener('popstate', () => {
    const r = routeFromHash();
    if (r) openRoute(r, { skipHash: true });
    else if (!panel.classList.contains('translate-y-full')) closeRoute({ skipHash: true });
});

// Open initial route from hash after a short delay so UI is ready
window.addEventListener('load', () => {
    const r = routeFromHash();
    if (r) setTimeout(() => openRoute(r, { skipHash: true }), 200);
});

// ======= Pause decorative animations when off-screen =======
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const animTargets = document.querySelectorAll('.hero-gradient, .azulejo-pattern');
    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            e.target.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
            // also pause pseudo-element animations via class
            e.target.classList.toggle('anim-paused', !e.isIntersecting);
        });
    }, { rootMargin: '80px' });
    animTargets.forEach(t => animObserver.observe(t));
}

