import { lisbonHistorical } from './routes/lisbon-historical.js';
import { lisbonBelem } from './routes/lisbon-belem.js';
import { lisbonSintra } from './routes/lisbon-sintra.js';
import { lisbonAjuda } from './routes/lisbon-ajuda.js?v=20260727-two-gardens-2';
import { lisbonCastle } from './routes/lisbon-castle.js';
import { portoRibeira } from './routes/porto-ribeira.js';
import { portoHistorical } from './routes/porto-historical.js';
import { portoFoz } from './routes/porto-foz.js';

export const routes = [lisbonHistorical, lisbonBelem, lisbonSintra, lisbonAjuda, lisbonCastle];
export const portoRoutes = [portoRibeira, portoHistorical, portoFoz];
export const allRoutes = [...routes, ...portoRoutes];
