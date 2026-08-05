import { lisbonHistorical } from './routes/lisbon-historical.js';
import { lisbonBelem } from './routes/lisbon-belem.js';
import { lisbonSintra } from './routes/lisbon-sintra.js';
import { lisbonAjuda } from './routes/lisbon-ajuda.js?v=20260727-two-gardens-2';
import { lisbonCastle } from './routes/lisbon-castle.js';
import { lisbonNorthMuseums } from './routes/lisbon-north-museums.js';
import { cacilhasAlmada } from './routes/cacilhas-almada.js';
import { lisbonFreeSunday } from './routes/lisbon-free-sunday.js';
import { sesimbraAtlantic } from './routes/sesimbra-atlantic.js?v=20260805-dinosaurs';
import { setubalArrabida } from './routes/setubal-arrabida.js';
import { penicheBerlengas } from './routes/peniche-berlengas.js';
import { monsarazAlqueva } from './routes/monsaraz-alqueva.js';
import { piodaoAcor } from './routes/piodao-acor.js';
import { serraEstrela } from './routes/serra-estrela.js';
import { mafraTapada } from './routes/mafra-tapada.js?v=20260805-dinosaurs';
import { batalhaMiraFatima } from './routes/batalha-mira-fatima.js?v=20260805-audit';
import { coimbraConimbriga } from './routes/coimbra-conimbriga.js?v=20260805-audit';
import { casteloVideMarvao } from './routes/castelo-vide-marvao.js?v=20260805-audit';
import { lourinhaDinosaurs } from './routes/lourinha-dinosaurs.js?v=20260805-dinosaurs';
import { serraAireDinosaurs } from './routes/serra-aire-dinosaurs.js?v=20260805-dinosaurs';
import { portoRibeira } from './routes/porto-ribeira.js';
import { portoHistorical } from './routes/porto-historical.js';
import { portoFoz } from './routes/porto-foz.js';

export const routes = [
    lisbonHistorical,
    lisbonBelem,
    lisbonSintra,
    lisbonAjuda,
    lisbonCastle,
    lisbonNorthMuseums,
    cacilhasAlmada,
    lisbonFreeSunday,
];
export const getawayRoutes = [
    sesimbraAtlantic,
    setubalArrabida,
    penicheBerlengas,
    monsarazAlqueva,
    piodaoAcor,
    serraEstrela,
    mafraTapada,
    batalhaMiraFatima,
    coimbraConimbriga,
    casteloVideMarvao,
    lourinhaDinosaurs,
    serraAireDinosaurs,
];
export const portoRoutes = [portoRibeira, portoHistorical, portoFoz];
export const allRoutes = [...routes, ...getawayRoutes, ...portoRoutes];

export const routeGroups = [
    {
        id: 'lisbon',
        eyebrow: 'В городе',
        title: 'Лиссабон',
        description: 'Пешие дни, музеи, сады и переправа через Тежу.',
        routes,
        open: true,
    },
    {
        id: 'coast',
        eyebrow: 'До двух часов от города',
        title: 'Океан и побережье',
        description: 'Аррабида и Пениши — море, скалы и небольшие города.',
        routes: [setubalArrabida, penicheBerlengas],
    },
    {
        id: 'dinosaurs',
        eyebrow: 'Доисторическая Португалия',
        title: 'Динозавры и геология',
        description: 'Полноразмерные модели, настоящие окаменелости и следовые дорожки юрского периода.',
        routes: [lourinhaDinosaurs, serraAireDinosaurs, sesimbraAtlantic],
    },
    {
        id: 'history',
        eyebrow: 'Однодневные поездки',
        title: 'Дворцы и старые города',
        description: 'Мафра, монастыри, римские руины, университетские улицы и крепости.',
        routes: [mafraTapada, batalhaMiraFatima, coimbraConimbriga, monsarazAlqueva, casteloVideMarvao],
    },
    {
        id: 'long-trips',
        eyebrow: 'Дальние маршруты',
        title: 'Горы и деревни',
        description: 'Поездки, которым нужен очень ранний старт или отдельная ночёвка.',
        routes: [piodaoAcor, serraEstrela],
    },
    {
        id: 'porto',
        eyebrow: 'Три дня на севере',
        title: 'Порту',
        description: 'Исторический центр, Дору, Сералвеш и атлантический Фош.',
        routes: portoRoutes,
    },
];
