import config from './calculator-config.json';

export const appConfig = config.config;
export const prefermentDefaults = config.prefermentDefaults;
export const prefermentOptions = config.prefermentOptions;
export const doughSizes = config.doughSizes;
export const ovenAdjustments = config.ovenAdjustments;

function inferEnvironment(option) {
  return option.value.endsWith('rt') ? 'Room temp' : 'Cold ferment';
}

function inferDurationHours(option) {
  const match = option.value.match(/^(\d+)h/);
  return match ? Number(match[1]) : null;
}

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
      fermentationOptions: style.fermentationOptions.map((option) => ({
        ...option,
        environment: option.environment || inferEnvironment(option),
        durationHours: option.durationHours || inferDurationHours(option),
      })),
    },
  ]),
);
