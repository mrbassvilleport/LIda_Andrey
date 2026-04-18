import { escapeHtml } from './utils.js';

export const TRANSIT_MODES = {
    walk:      { label: 'Пешком',    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="1.6"/><path d="M9.5 21l2-6 -2.5-3 1-6 3 2 3 1"/><path d="M8 10l1.5-2.5 4-1"/><path d="M14 13l2 2 1 4"/></svg>' },
    metro:     { label: 'Метро',     icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M8 9l2 4 2-4 2 4 2-4"/><path d="M8 20l-1.5 1.5M16 20l1.5 1.5"/></svg>' },
    tram:      { label: 'Трамвай',   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="13" rx="2"/><path d="M9 17l-2 4M15 17l2 4"/><circle cx="9" cy="13" r="0.8" fill="currentColor"/><circle cx="15" cy="13" r="0.8" fill="currentColor"/><path d="M5 8h14"/><path d="M12 4V2"/></svg>' },
    bus:       { label: 'Автобус',   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="13" rx="2.5"/><path d="M4 10h16"/><path d="M8 17l-1.5 3M16 17l1.5 3"/><circle cx="8" cy="14" r="0.9" fill="currentColor"/><circle cx="16" cy="14" r="0.9" fill="currentColor"/></svg>' },
    taxi:      { label: 'Такси',     icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 14l1.6-4.5a2 2 0 012-1.3h6.8a2 2 0 012 1.3L19 14"/><path d="M4 14h16v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z"/><circle cx="8" cy="17" r="0.8" fill="currentColor"/><circle cx="16" cy="17" r="0.8" fill="currentColor"/><path d="M10 5h4V3h-4z"/></svg>' },
    train:     { label: 'Поезд',     icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 12h14"/><circle cx="9" cy="14.5" r="0.7" fill="currentColor"/><circle cx="15" cy="14.5" r="0.7" fill="currentColor"/><path d="M8 17l-1.5 3M16 17l1.5 3"/><path d="M9 7h6"/></svg>' },
    funicular: { label: 'Фуникулёр', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L20 4"/><rect x="6" y="12" width="7" height="5" rx="1" transform="rotate(-45 9.5 14.5)"/><path d="M3 21h4M17 7h4"/></svg>' },
    cable:     { label: 'Канатка',   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l18 3"/><path d="M9 8v3M9 11h4l-1 6h-2z"/></svg>' },
};

const GMAPS_TRAVEL_MODE = {
    walk: 'walking',
    metro: 'transit',
    tram: 'transit',
    bus: 'transit',
    train: 'transit',
    funicular: 'transit',
    cable: 'transit',
    taxi: 'driving',
};

export function buildDirectionsUrl(from, to, modeKey) {
    if (!from || !to) return null;
    const travelmode = GMAPS_TRAVEL_MODE[modeKey] || 'walking';
    return `https://www.google.com/maps/dir/?api=1`
        + `&origin=${from[0]},${from[1]}`
        + `&destination=${to[0]},${to[1]}`
        + `&travelmode=${travelmode}`;
}

function renderTransitOption(option, from, to) {
    const modeKey = option.mode in TRANSIT_MODES ? option.mode : 'walk';
    const mode = TRANSIT_MODES[modeKey];
    const recommended = option.recommended ? ' is-recommended' : '';
    const lineBadge = option.line
        ? `<span class="transit-line-badge">№ ${escapeHtml(option.line)}</span>`
        : '';
    const durationParts = (option.duration || '').match(/^(\d+[\d–\-]*)\s*(.*)$/);
    const durationHtml = durationParts
        ? `${durationParts[1]}<small> ${escapeHtml(durationParts[2] || 'мин')}</small>`
        : escapeHtml(option.duration || '');
    const metaBits = [];
    if (option.distance) metaBits.push(escapeHtml(option.distance));
    if (option.detail) metaBits.push(escapeHtml(option.detail));
    const metaHtml = metaBits.length
        ? `<div class="transit-meta">${metaBits.join('<span class="dot"></span>')}</div>`
        : '';
    const href = buildDirectionsUrl(from, to, modeKey);
    const aria = `Открыть маршрут в Google Maps: ${mode.label}${option.duration ? ', ' + option.duration : ''}`;

    return `
        <a href="${href}" target="_blank" rel="noopener noreferrer" class="transit-option${recommended}" data-mode="${modeKey}" aria-label="${escapeHtml(aria)}">
            <div class="transit-mode-icon" aria-hidden="true">${mode.icon}</div>
            <div class="transit-mode-label">${mode.label}${lineBadge}</div>
            <div class="transit-duration">${durationHtml}</div>
            ${metaHtml}
            <svg class="transit-open-icon" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M9 7h8v8"/></svg>
        </a>
    `;
}

export function renderTransitConnector(transit, delay, from, to) {
    if (!transit || !Array.isArray(transit.options) || !transit.options.length) return '';

    const options = transit.options.map((option) => renderTransitOption(option, from, to)).join('');
    const note = transit.note ? `<div class="transit-note">${escapeHtml(transit.note)}</div>` : '';
    const headerLabel = transit.options.length > 1 ? 'Варианты пути' : 'В пути';

    return `
        <div class="transit-connector" style="--delay: ${delay}ms;" aria-label="Переход к следующей точке">
            <div class="transit-rule">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></svg>
                <span>${headerLabel}</span>
            </div>
            <div class="transit-options">${options}</div>
            ${note}
        </div>
    `;
}
