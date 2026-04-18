const GALLERY_CACHE_PREFIX = 'pt-gallery-v1:';
const GALLERY_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const GALLERY_FETCH_TIMEOUT = 6000;

export function readGalleryCache(key) {
    try {
        const raw = localStorage.getItem(GALLERY_CACHE_PREFIX + key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || Date.now() - parsed.t > GALLERY_CACHE_TTL) return null;
        return parsed.v;
    } catch {
        return null;
    }
}

export function writeGalleryCache(key, value) {
    try {
        localStorage.setItem(GALLERY_CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
    } catch {
        // Ignore quota and storage errors.
    }
}

export function fetchWithTimeout(url, ms = GALLERY_FETCH_TIMEOUT) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
}

export function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
