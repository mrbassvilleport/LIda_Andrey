import { lisbonHistorical } from './routes/lisbon-historical.js';
import { lisbonBelem } from './routes/lisbon-belem.js';
import { lisbonSintra } from './routes/lisbon-sintra.js';
import { lisbonAjuda } from './routes/lisbon-ajuda.js?v=20260727-two-gardens-2';
import { lisbonCastle } from './routes/lisbon-castle.js';
import { lisbonNorthMuseums } from './routes/lisbon-north-museums.js';
import { cacilhasAlmada } from './routes/cacilhas-almada.js';
import { lisbonFreeSunday } from './routes/lisbon-free-sunday.js';
import { sesimbraAtlantic } from './routes/sesimbra-atlantic.js';
import { setubalArrabida } from './routes/setubal-arrabida.js';
import { penicheBerlengas } from './routes/peniche-berlengas.js';
import { monsarazAlqueva } from './routes/monsaraz-alqueva.js';
import { piodaoAcor } from './routes/piodao-acor.js';
import { serraEstrela } from './routes/serra-estrela.js';
import { mafraEriceira } from './routes/mafra-ericeira.js';
import { batalhaMiraFatima } from './routes/batalha-mira-fatima.js?v=20260805-audit';
import { coimbraConimbriga } from './routes/coimbra-conimbriga.js?v=20260805-audit';
import { casteloVideMarvao } from './routes/castelo-vide-marvao.js?v=20260805-audit';
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
    mafraEriceira,
    batalhaMiraFatima,
    coimbraConimbriga,
    casteloVideMarvao,
];
export const portoRoutes = [portoRibeira, portoHistorical, portoFoz];
export const allRoutes = [...routes, ...getawayRoutes, ...portoRoutes];
