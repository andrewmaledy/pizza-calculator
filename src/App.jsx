import { useEffect, useState } from 'react';
import { calculateRecipe, getBallWeight, getOvenAdjustment } from './calculations';
import { doughSizes, ovenAdjustments, recipes } from './recipeData';

const recipeList = Object.values(recipes);
const DEFAULT_STYLE_ID = 'neapolitan';
const DEFAULT_FERMENTATION_VALUE = '24h-rt';
const DEFAULT_SIZE_VALUE = '12';
const DEFAULT_CUSTOM_BALL_WEIGHT = 260;
const DEFAULT_PIZZA_COUNT = 4;
const OVEN_TEMP_OPTIONS = [450, 500, 700, 900];
const DEFAULT_OVEN_TEMP = 500;

function formatGrams(value, decimals = 1) {
  return `${Number(value).toFixed(decimals)} g`;
}

function parseInitialState() {
  const params = new URLSearchParams(window.location.search);
  const styleId = params.get('style');
  const validStyleId = recipes[styleId] ? styleId : DEFAULT_STYLE_ID;
  const validFermentations = recipes[validStyleId].fermentationOptions.map((option) => option.value);
  const fermentationValue = params.get('fermentation');
  const sizeValue = params.get('size');
  const validSizes = doughSizes.map((option) => option.value);
  const parsedOvenTemp = Number(params.get('ovenTemp'));

  return {
    styleId: validStyleId,
    fermentationValue: validFermentations.includes(fermentationValue)
      ? fermentationValue
      : recipes[validStyleId].fermentationOptions.find(
          (option) => option.value === DEFAULT_FERMENTATION_VALUE,
        )?.value || recipes[validStyleId].fermentationOptions[0].value,
    sizeValue: validSizes.includes(sizeValue) ? sizeValue : DEFAULT_SIZE_VALUE,
    customBallWeight: Number(params.get('customBallWeight')) || DEFAULT_CUSTOM_BALL_WEIGHT,
    pizzaCount: Number(params.get('count')) || DEFAULT_PIZZA_COUNT,
    ovenTemp: OVEN_TEMP_OPTIONS.includes(parsedOvenTemp) ? parsedOvenTemp : DEFAULT_OVEN_TEMP,
  };
}

function App() {
  const [initialState] = useState(() => parseInitialState());
  const [styleId, setStyleId] = useState(initialState.styleId);
  const [fermentationValue, setFermentationValue] = useState(initialState.fermentationValue);
  const [sizeValue, setSizeValue] = useState(initialState.sizeValue);
  const [customBallWeight, setCustomBallWeight] = useState(initialState.customBallWeight);
  const [pizzaCount, setPizzaCount] = useState(initialState.pizzaCount);
  const [ovenTemp, setOvenTemp] = useState(initialState.ovenTemp);

  const recipe = recipes[styleId];
  const fermentationOptions = recipe.fermentationOptions;
  const fermentation =
    fermentationOptions.find((option) => option.value === fermentationValue) ||
    fermentationOptions[0];
  const sizeOption =
    doughSizes.find((option) => option.value === sizeValue) || doughSizes[1];

  const ballWeight = getBallWeight(sizeOption, customBallWeight);
  const ovenAdjustment = getOvenAdjustment(ovenTemp, ovenAdjustments);
  const ovenTempIndex = OVEN_TEMP_OPTIONS.indexOf(Number(ovenTemp));
  const hydrationPercent = recipe.ingredients.water + (ovenAdjustment?.hydrationMod || 0);
  const calculation = calculateRecipe(
    recipe,
    fermentation,
    'idy',
    Number(pizzaCount) || 0,
    ballWeight,
    hydrationPercent,
  );

  const ingredientRows = [
    {
      label: recipe.flourLabel,
      value: calculation.ingredientWeights.flour,
      percent: 100,
      decimals: 1,
    },
    {
      label: 'Water',
      value: calculation.ingredientWeights.water,
      percent: calculation.hydrationPercent,
      decimals: 1,
    },
    {
      label: 'Salt',
      value: calculation.ingredientWeights.salt,
      percent: recipe.ingredients.salt,
      decimals: 1,
    },
    {
      label: 'Olive Oil',
      value: calculation.ingredientWeights.oil,
      percent: recipe.ingredients.oil,
      decimals: 1,
    },
    {
      label: 'Sugar',
      value: calculation.ingredientWeights.sugar,
      percent: recipe.ingredients.sugar,
      decimals: 1,
    },
    {
      label: 'Instant Dry Yeast',
      value: calculation.ingredientWeights.yeast,
      percent: calculation.yeastPercent,
      decimals: 2,
    },
  ].filter((row) => row.percent > 0);

  const warnings = [];
  if (styleId === 'neapolitan' && fermentation.durationHours > 48) {
    warnings.push(
      'Long fermentation without sugar may result in a pale crust in home ovens. Consider switching to NY Style or adding 1% sugar.',
    );
  }

  if (calculation.precisionNotes.yeastNeedsFineScale) {
    warnings.push(
      'Yeast is rounded to 0.01g. For tiny long-ferment doses, use a jeweler’s scale or approximate with a small pinch.',
    );
  }

  if (fermentation.note) {
    warnings.push(fermentation.note);
  }

  if (ovenAdjustment?.forceSugar && recipe.ingredients.sugar === 0) {
    warnings.push(
      'Your oven temperature is in a lower home-oven range. Sugar-free dough may brown poorly, so consider adding 1% sugar or switching to New York style.',
    );
  }

  if (ovenAdjustment?.sugarLimit === 0 && recipe.ingredients.sugar > 0) {
    warnings.push(
      'At high oven temperatures, sugar can burn. Keep added sugar at 0% for this setup.',
    );
  }

  const handleStyleChange = (nextStyleId) => {
    const nextRecipe = recipes[nextStyleId];
    setStyleId(nextStyleId);
    setFermentationValue(nextRecipe.fermentationOptions[0].value);
  };

  const basicInstructions = [...(fermentation.steps || [])];

  if (ovenAdjustment?.proTip) {
    basicInstructions.push(`Oven note: ${ovenAdjustment.proTip}`);
  }

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('style', styleId);
    params.set('fermentation', fermentationValue);
    params.set('size', sizeValue);
    params.set('count', String(pizzaCount));
    params.set('ovenTemp', String(ovenTemp));

    if (sizeValue === 'custom') {
      params.set('customBallWeight', String(customBallWeight));
    }

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', nextUrl);
  }, [
    customBallWeight,
    fermentationValue,
    ovenTemp,
    pizzaCount,
    sizeValue,
    styleId,
  ]);

  return (
    <main className="app">
      <header className="header">
        <h1>Pizza Dough Calculator</h1>
        <p>Fast, mobile-friendly dough math for Neapolitan and New York styles.</p>
      </header>

      <section className="section">
        <h2>Style</h2>
        <div className="segmented-control">
          {recipeList.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === styleId ? 'active' : ''}
              onClick={() => handleStyleChange(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Inputs</h2>
        <div className="controls">
          <label>
            <span>Fermentation</span>
            <select
              value={fermentation.value}
              onChange={(event) => setFermentationValue(event.target.value)}
            >
              {fermentationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.environment}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Oven Temp (F): {ovenTemp}</span>
            <input
              type="range"
              min="0"
              max={String(OVEN_TEMP_OPTIONS.length - 1)}
              step="1"
              value={ovenTempIndex}
              onChange={(event) => setOvenTemp(OVEN_TEMP_OPTIONS[Number(event.target.value)])}
            />
            <div className="range-labels">
              {OVEN_TEMP_OPTIONS.map((temp) => (
                <span key={temp}>{temp}</span>
              ))}
            </div>
          </label>

          <label>
            <span>Dough Ball Size</span>
            <select
              value={sizeValue}
              onChange={(event) => setSizeValue(event.target.value)}
            >
              {doughSizes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.weight ? ` (${option.weight}g)` : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Pizza Count: {pizzaCount}</span>
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={pizzaCount}
              onChange={(event) => setPizzaCount(Number(event.target.value))}
            />
          </label>

          {sizeValue === 'custom' ? (
            <label>
              <span>Custom Ball Weight (g)</span>
              <input
                type="number"
                min="1"
                value={customBallWeight}
                onChange={(event) => setCustomBallWeight(event.target.value)}
              />
            </label>
          ) : null}
        </div>
      </section>

      <section className="section">
        <h2>Summary</h2>
        <div className="summary-list">
          <div className="summary-row">
            <span>Style</span>
            <strong>{recipe.name}</strong>
          </div>
          <div className="summary-row">
            <span>Environment</span>
            <strong>{fermentation.environment}</strong>
          </div>
          <div className="summary-row">
            <span>Oven Temp</span>
            <strong>{ovenTemp}F</strong>
          </div>
          <div className="summary-row">
            <span>Water Temp</span>
            <strong>{fermentation.targetWaterTemp || 'Use recipe default'}</strong>
          </div>
          <div className="summary-row">
            <span>Ball Weight</span>
            <strong>{formatGrams(ballWeight)}</strong>
          </div>
          <div className="summary-row">
            <span>Total Dough</span>
            <strong>{formatGrams(calculation.totalDoughWeight)}</strong>
          </div>
        </div>
        {ovenAdjustment ? (
          <p className="summary-note">
            {ovenAdjustment.label}. Hydration is adjusted in the calculated recipe below.
          </p>
        ) : null}
      </section>

      <section className="section">
        <h2>Calculated Recipe</h2>
        <p className="summary-note">
          These are the actual ingredient weights for this dough setup.
        </p>
        <div className="ingredient-table">
          {ingredientRows.map((row) => (
            <div key={row.label} className="ingredient-row">
              <div>
                <span className="ingredient-label">{row.label}</span>
                <span className="ingredient-percent">{row.percent}% baker&apos;s %</span>
              </div>
              <strong>{formatGrams(row.value, row.decimals)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Basic Instructions</h2>
        {fermentation.targetWaterTemp ? (
          <p className="summary-note">
            Water temperature target: {fermentation.targetWaterTemp}.
          </p>
        ) : null}
        <ol className="instruction-list">
          {basicInstructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      {warnings.length > 0 ? (
        <section className="section warning-section">
          <h2>Warnings</h2>
          <ul className="warning-list">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

export default App;
