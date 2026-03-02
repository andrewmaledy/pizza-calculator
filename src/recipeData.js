import config from './calculator-config.json';

export const doughSizes = config.doughSizes;
export const ovenAdjustments = config.ovenAdjustments;
export const processGuide = config.processGuide;

export const recipes = Object.fromEntries(
  Object.entries(config.styles).map(([id, style]) => [
    id,
    {
      id,
      name: style.name,
      tagline: style.tagline,
      oven: style.oven,
      flourLabel: style.flourType,
      flourNote: `Default flour: ${style.flourType}`,
      ingredients: {
        flour: 100,
        water: style.baseHydration,
        salt: style.salt,
        oil: style.oil,
        sugar: style.sugar,
      },
      notes: style.notes,
      fermentationOptions: style.fermentationOptions,
      workflow: style.workflow,
    },
  ]),
);
