const roundToTenth = (value) => Math.round(value * 10) / 10;
const roundToHundredth = (value) => Math.round(value * 100) / 100;

export function getRoomTempAdjustment(fermentation, roomTemp) {
  const parsedRoomTemp = Number(roomTemp);
  const baselineYeast = fermentation.yeast;

  if (fermentation.environment !== 'Room temp' || !Number.isFinite(parsedRoomTemp)) {
    return {
      adjustedYeast: baselineYeast,
      suggestedWaterTemp: null,
      isAdjusted: false,
    };
  }

  const scaledYeast =
    baselineYeast * (1 - (((parsedRoomTemp - 70) / 5) * 0.10));
  const minYeast = fermentation.value === '8h-rt' ? 0.05 : 0;
  const adjustedYeast = Math.max(minYeast, scaledYeast);

  let suggestedWaterTemp = '90F - 95F';
  if (parsedRoomTemp < 65) {
    suggestedWaterTemp = '100F - 105F';
  } else if (parsedRoomTemp > 75) {
    suggestedWaterTemp = '75F - 80F';
  }

  return {
    adjustedYeast: roundToHundredth(adjustedYeast),
    suggestedWaterTemp,
    isAdjusted: true,
  };
}

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
