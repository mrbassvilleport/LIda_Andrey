import { lisbonHistorical } from './routes/lisbon-historical.js';
import { lisbonBelem } from './routes/lisbon-belem.js';
import { lisbonSintra } from './routes/lisbon-sintra.js';
import { portoRibeira } from './routes/porto-ribeira.js';
import { portoHistorical } from './routes/porto-historical.js';
import { portoFoz } from './routes/porto-foz.js';

export const routes = [lisbonHistorical, lisbonBelem, lisbonSintra];
export const portoRoutes = [portoRibeira, portoHistorical, portoFoz];
export const allRoutes = [...routes, ...portoRoutes];
