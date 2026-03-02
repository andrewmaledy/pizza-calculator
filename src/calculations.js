const roundToTenth = (value) => Math.round(value * 10) / 10;
const roundToHundredth = (value) => Math.round(value * 100) / 100;

export function getBallWeight(sizeOption, customBallWeight) {
  if (sizeOption.weight) {
    return sizeOption.weight;
  }

  return Number(customBallWeight) || 0;
}

export function calculateRecipe(
  recipe,
  fermentation,
  yeastType,
  count,
  ballWeight,
  hydrationPercent = recipe.ingredients.water,
) {
  const yeastMultiplier = yeastType === 'ady' ? 1.25 : 1;
  const yeastPercent = fermentation.yeast * yeastMultiplier;

  const totalPercent =
    recipe.ingredients.flour +
    hydrationPercent +
    recipe.ingredients.salt +
    recipe.ingredients.oil +
    recipe.ingredients.sugar +
    yeastPercent;

  const totalDoughWeight = count * ballWeight;
  const flourWeight = totalDoughWeight / (totalPercent / 100);
  const yeastWeight = flourWeight * (yeastPercent / 100);

  const ingredientWeights = {
    flour: roundToTenth(flourWeight),
    water: roundToTenth(flourWeight * (hydrationPercent / 100)),
    salt: roundToTenth(flourWeight * (recipe.ingredients.salt / 100)),
    oil: roundToTenth(flourWeight * (recipe.ingredients.oil / 100)),
    sugar: roundToTenth(flourWeight * (recipe.ingredients.sugar / 100)),
    yeast: roundToHundredth(yeastWeight),
  };

  return {
    hydrationPercent: roundToTenth(hydrationPercent),
    yeastPercent: roundToHundredth(yeastPercent),
    totalDoughWeight: roundToTenth(totalDoughWeight),
    ingredientWeights,
    precisionNotes: {
      yeastNeedsFineScale: recipe.id === 'neapolitan' && fermentation.durationHours >= 48,
    },
  };
}

export function getOvenAdjustment(ovenTemp, ovenAdjustments) {
  const parsedTemp = Number(ovenTemp);
  if (!Number.isFinite(parsedTemp)) {
    return null;
  }

  return (
    ovenAdjustments.find(
      (adjustment) => parsedTemp >= adjustment.min && parsedTemp <= adjustment.max,
    ) || null
  );
}
