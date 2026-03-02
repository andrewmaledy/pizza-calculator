import config from './calculator-config.json';

export const appConfig = config.config;
export const doughSizes = config.doughSizes;
export const ovenAdjustments = config.ovenAdjustments;

export const recipes = Object.fromEntries(
  Object.entries(config.styles).map(([id, style]) => [
    id,
    {
      id,
      name: style.name,
      flourLabel: id === 'neapolitan' ? 'Type 00 Flour' : 'High-Protein Bread Flour',
      ingredients: {
        flour: 100,
        water: style.baseHydration,
        salt: style.salt,
        oil: style.oil,
        sugar: style.sugar,
      },
      fermentationOptions: style.fermentationOptions,
    },
  ]),
);
