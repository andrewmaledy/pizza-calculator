import { useEffect, useState } from 'react';
import {
  calculateRecipe,
  getBallWeight,
  getOvenAdjustment,
  getRoomTempAdjustment,
} from './calculations';
import {
  appConfig,
  doughSizes,
  ovenAdjustments,
  prefermentDefaults,
  prefermentOptions,
  recipes,
} from './recipeData';

const recipeList = Object.values(recipes);
const DEFAULT_STYLE_ID = 'neapolitan';
const DEFAULT_FERMENTATION_VALUE = '24h-rt';
const DEFAULT_SIZE_VALUE = '12';
const DEFAULT_CUSTOM_BALL_WEIGHT = 260;
const DEFAULT_PIZZA_COUNT = 4;
const OVEN_TEMP_OPTIONS = [450, 500, 700, 900];
const DEFAULT_OVEN_TEMP = 500;
const DEFAULT_ROOM_TEMP = 70;
const DEFAULT_PREFERMENT_TYPE = 'standard';

function formatGrams(value, decimals = 1) {
  return `${Number(value).toFixed(decimals)} g`;
}

function roundTo(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatDuration(duration, unit) {
  if (!duration || !unit) {
    return null;
  }

  const label = duration === 1 ? unit.replace(/s$/, '') : unit;
  return `${duration} ${label}`;
}

function rewriteStepDetailForPreferment(detail) {
  if (!detail) {
    return detail;
  }

  return detail
    .replace(/Add IDY yeast and mix, then add salt\./i, 'Add the poolish and mix, then add salt.')
    .replace(/Add IDY and salt\./i, 'Add the poolish, then add salt.')
    .replace(/Add IDY, then oil and salt\./i, 'Add the poolish, then oil and salt.')
    .replace(/Add IDY, oil, and salt\./i, 'Add the poolish, oil, and salt.');
}

function buildPrefermentMix(calculation, recipe) {
  const flour = roundTo(calculation.ingredientWeights.flour * prefermentDefaults.flourRatio);
  const water = roundTo(flour * (prefermentDefaults.hydration / 100));
  const yeast = calculation.ingredientWeights.yeast;

  return {
    label: prefermentDefaults.label,
    items: [
      { label: recipe.flourLabel, value: flour, percent: null, decimals: 1 },
      { label: 'Water', value: water, percent: null, decimals: 1 },
      { label: 'Instant Dry Yeast', value: yeast, percent: null, decimals: 2 },
    ],
  };
}

function buildMainMix(calculation, recipe, prefermentMix) {
  const prefermentFlour = prefermentMix.items.find((item) => item.label === recipe.flourLabel)?.value || 0;
  const prefermentWater = prefermentMix.items.find((item) => item.label === 'Water')?.value || 0;

  return {
    label: 'Main Mix',
    items: [
      {
        label: recipe.flourLabel,
        value: roundTo(calculation.ingredientWeights.flour - prefermentFlour),
        percent: null,
        decimals: 1,
      },
      {
        label: 'Water',
        value: roundTo(calculation.ingredientWeights.water - prefermentWater),
        percent: null,
        decimals: 1,
      },
      { label: 'Salt', value: calculation.ingredientWeights.salt, percent: null, decimals: 1 },
      { label: 'Olive Oil', value: calculation.ingredientWeights.oil, percent: null, decimals: 1 },
      { label: 'Sugar', value: calculation.ingredientWeights.sugar, percent: null, decimals: 1 },
    ].filter((item) => item.value > 0),
  };
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
  const prefermentEnabled = params.get('preferment') === '1';
  const roomTempParam = params.get('roomTemp');
  const parsedRoomTemp = roomTempParam === null ? NaN : Number(roomTempParam);
  const requestedPrefermentType = params.get('prefermentType');
  const prefermentType = prefermentOptions.some((option) => option.id === requestedPrefermentType)
    ? requestedPrefermentType
    : DEFAULT_PREFERMENT_TYPE;

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
    prefermentEnabled,
    roomTemp: Number.isFinite(parsedRoomTemp) ? parsedRoomTemp : DEFAULT_ROOM_TEMP,
    prefermentType,
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
  const [prefermentEnabled, setPrefermentEnabled] = useState(initialState.prefermentEnabled);
  const [roomTemp, setRoomTemp] = useState(initialState.roomTemp);
  const [prefermentType, setPrefermentType] = useState(initialState.prefermentType);

  const recipe = recipes[styleId];
  const fermentationOptions = recipe.fermentationOptions;
  const fermentation =
    fermentationOptions.find((option) => option.value === fermentationValue) ||
    fermentationOptions[0];
  const selectedPrefermentOption =
    prefermentOptions.find((option) => option.id === prefermentType) || prefermentOptions[0];
  const sizeOption =
    doughSizes.find((option) => option.value === sizeValue) || doughSizes[1];
  const roomTempAdjustment = getRoomTempAdjustment(fermentation, roomTemp);

  const ballWeight = getBallWeight(sizeOption, customBallWeight);
  const ovenAdjustment = getOvenAdjustment(ovenTemp, ovenAdjustments);
  const ovenTempIndex = OVEN_TEMP_OPTIONS.indexOf(Number(ovenTemp));
  const hydrationPercent = recipe.ingredients.water + (ovenAdjustment?.hydrationMod || 0);
  const targetDoughWeight =
    (Number(pizzaCount) || 0) * ballWeight * (appConfig?.wasteFactor || 1);
  const effectiveFermentation = prefermentEnabled
    ? {
        ...fermentation,
        yeast: roomTempAdjustment.adjustedYeast * selectedPrefermentOption.yeastMod,
      }
    : { ...fermentation, yeast: roomTempAdjustment.adjustedYeast };
  const calculation = calculateRecipe(
    recipe,
    effectiveFermentation,
    'idy',
    1,
    targetDoughWeight,
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
  const prefermentMix = prefermentEnabled ? buildPrefermentMix(calculation, recipe) : null;
  const mainMix = prefermentEnabled ? buildMainMix(calculation, recipe, prefermentMix) : null;

  const warnings = [];
  if (styleId === 'neapolitan' && fermentation.value === '72h-cf') {
    warnings.push(
      'Long fermentation without sugar may result in a pale crust in home ovens. Consider switching to NY Style or adding 1% sugar.',
    );
  }

  if (calculation.precisionNotes.yeastNeedsFineScale) {
    warnings.push(
      'Yeast is rounded to 0.01g. For tiny long-ferment doses, use a jeweler’s scale or approximate with a small pinch.',
    );
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

  if (prefermentEnabled && fermentation.value !== '8h-rt' && fermentation.value !== '24h-cf') {
    warnings.push(
      'Poolish is most useful for same-day dough. On longer cold ferments it can push the dough toward over-fermentation.',
    );
  }

  const handleStyleChange = (nextStyleId) => {
    const nextRecipe = recipes[nextStyleId];
    setStyleId(nextStyleId);
    setFermentationValue(nextRecipe.fermentationOptions[0].value);
  };

  const timelineItems = fermentation.timeline.flatMap((phase, phaseIndex) => {
    const phaseHeader = {
      id: `phase-${phaseIndex}`,
      kind: 'phase',
      phase: phase.phase,
    };

    const steps = phase.steps.flatMap((step, stepIndex) => {
      const detailParts = [];

      if (step.detail) {
        detailParts.push(
          prefermentEnabled ? rewriteStepDetailForPreferment(step.detail) : step.detail,
        );
      }

      if (step.temp) {
        detailParts.push(`Temp: ${step.temp}.`);
      }

      if (step.target) {
        detailParts.push(`Target: ${step.target}.`);
      }

      const durationLabel = formatDuration(step.duration, step.unit);

      return [
        {
          id: `phase-${phaseIndex}-step-${stepIndex}`,
          kind: 'step',
          stepType: step.type,
          label: step.label,
          detail: detailParts.join(' '),
          durationLabel,
        },
      ];
    });

    return [phaseHeader, ...steps];
  });

  if (prefermentEnabled) {
    timelineItems.unshift(
      {
        id: 'preferment-phase',
        kind: 'phase',
        phase: 'Preferment',
      },
      {
        id: 'preferment-mix',
        kind: 'step',
        stepType: 'action',
        label: `Mix ${prefermentDefaults.label}`,
        detail: `${formatGrams(prefermentMix.items[0].value)} ${recipe.flourLabel}, ${formatGrams(prefermentMix.items[1].value)} water, and ${formatGrams(prefermentMix.items[2].value, 2)} instant dry yeast.`,
        durationLabel: null,
      },
      {
        id: 'preferment-wait',
        kind: 'step',
        stepType: 'wait',
        label: 'Ferment Preferment',
        detail: `${selectedPrefermentOption.detail} Water temp: ${selectedPrefermentOption.waterTemp}.`,
        durationLabel: selectedPrefermentOption.duration,
      },
    );
  }

  if (ovenAdjustment?.proTip) {
    timelineItems.push({
      id: 'oven-note',
      kind: 'note',
      stepType: 'note',
      label: 'Oven Note',
      detail: ovenAdjustment.proTip,
      durationLabel: null,
    });
  }

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('style', styleId);
    params.set('fermentation', fermentationValue);
    params.set('size', sizeValue);
    params.set('count', String(pizzaCount));
    params.set('ovenTemp', String(ovenTemp));
    params.set('roomTemp', String(roomTemp));
    if (prefermentEnabled) {
      params.set('preferment', '1');
      params.set('prefermentType', prefermentType);
    }

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
    prefermentEnabled,
    prefermentType,
    roomTemp,
    sizeValue,
    styleId,
  ]);

  return (
    <main className="app">
      <header className="header">
        <div className="header-top">
          <h1>Pizza Dough Calculator</h1>
          <a
            className="support-link"
            href="https://buymeacoffee.com/andrewmaledy"
            target="_blank"
            rel="noreferrer"
          >
            <span className="coffee-icon" aria-hidden="true" />
            <span>Buy me a coffee</span>
          </a>
        </div>
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
        <div className="control-groups">
          <div className="control-group">
            <h3>Method</h3>
            <div className="controls">
              <label>
                <span className="field-label">Fermentation</span>
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

              <label className="toggle-field">
                <span className="field-label field-label-inline">
                  Preferment
                  <span className="tooltip">
                    <button
                      type="button"
                      className="tooltip-trigger"
                      aria-label="What does preferment do?"
                    >
                      ?
                    </button>
                    <span className="tooltip-content" role="tooltip">
                      A preferment is a small starter mixed ahead of time. It improves flavor,
                      extensibility, and fermentation strength before the main dough is mixed.
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  className={`switch ${prefermentEnabled ? 'on' : ''}`}
                  aria-pressed={prefermentEnabled}
                  onClick={() => setPrefermentEnabled((value) => !value)}
                >
                  <span className="switch-track">
                    <span className="switch-thumb" />
                  </span>
                  <span className="switch-copy">Use poolish preferment</span>
                </button>
              </label>

              {prefermentEnabled ? (
                <label className="control-full">
                  <span className="field-label">Poolish Type</span>
                  <select
                    value={prefermentType}
                    onChange={(event) => setPrefermentType(event.target.value)}
                  >
                    {prefermentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="control-help">
                    {selectedPrefermentOption.duration} at {selectedPrefermentOption.waterTemp}.{' '}
                    {selectedPrefermentOption.id === 'fast'
                      ? 'Fast same-day boost.'
                      : 'Best flavor overnight.'}
                  </p>
                </label>
              ) : null}
            </div>
          </div>

          <div className="control-group">
            <h3 className="field-label-inline">
              Temperature
              <span className="tooltip">
                <button
                  type="button"
                  className="tooltip-trigger"
                  aria-label="How temperature affects the calculator"
                >
                  ?
                </button>
                <span className="tooltip-content tooltip-content-wide" role="tooltip">
                  Temperature changes more than the instructions. Room temp adjusts yeast for
                  room-temp ferments, and oven temp adjusts hydration guidance plus some browning
                  warnings.
                </span>
              </span>
            </h3>
            <div className="controls">
              <label className={fermentation.environment !== 'Room temp' ? 'field-disabled' : ''}>
                <span className="field-label field-label-inline">
                  Room Temp (F): {roomTemp}
                  {fermentation.environment !== 'Room temp'
                    ? ' (disabled for cold ferment)'
                    : ''}
                  <span className="tooltip">
                    <button
                      type="button"
                      className="tooltip-trigger"
                      aria-label="How room temperature is used"
                    >
                      ?
                    </button>
                    <span className="tooltip-content tooltip-content-wide" role="tooltip">
                      Room temperature is only used for room-temp fermentation schedules. It scales
                      the yeast amount up or down from the 70F baseline and also changes the water
                      temperature guidance.
                    </span>
                  </span>
                </span>
                <input
                  type="range"
                  min="60"
                  max="85"
                  step="1"
                  value={roomTemp}
                  disabled={fermentation.environment !== 'Room temp'}
                  onChange={(event) => setRoomTemp(Number(event.target.value))}
                />
                {fermentation.environment !== 'Room temp' ? (
                  <p className="control-help">Used only for room-temp fermentation schedules.</p>
                ) : null}
              </label>

              <label>
                <span className="field-label field-label-inline">
                  Oven Temp (F): {ovenTemp}
                  <span className="tooltip">
                    <button
                      type="button"
                      className="tooltip-trigger"
                      aria-label="How oven temperature is used"
                    >
                      ?
                    </button>
                    <span className="tooltip-content tooltip-content-wide" role="tooltip">
                      Oven temperature changes the target hydration band and can trigger sugar or
                      browning guidance. Lower-temp home ovens push the dough wetter, while hotter
                      ovens push it leaner.
                    </span>
                  </span>
                </span>
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
            </div>
          </div>

          <div className="control-group">
            <h3>Batch Size</h3>
            <div className="controls">
              <label>
                <span className="field-label">Dough Ball Size</span>
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
                <span className="field-label">Pizza Count: {pizzaCount}</span>
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
                <label className="control-full">
                  <span className="field-label">Custom Ball Weight (g)</span>
                  <input
                    type="number"
                    min="1"
                    value={customBallWeight}
                    onChange={(event) => setCustomBallWeight(event.target.value)}
                  />
                </label>
              ) : null}
            </div>
          </div>
        </div>
        <div className="input-footer">
          <div className="inline-chips">
            <div className="inline-chip">
              <span>Ball Weight</span>
              <strong>{formatGrams(ballWeight)}</strong>
            </div>
            <div className="inline-chip">
              <span>Total Dough</span>
              <strong>{formatGrams((Number(pizzaCount) || 0) * ballWeight)}</strong>
            </div>
            {prefermentEnabled ? (
              <div className="inline-chip">
                <span>Poolish</span>
                <strong>{selectedPrefermentOption.label}</strong>
              </div>
            ) : null}
          </div>
          <a className="jump-link" href="#calculated-recipe">
            Jump to Recipe
          </a>
        </div>
      </section>

      <section className="section" id="calculated-recipe">
        <h2>Calculated Recipe</h2>
        <p className="summary-note">
          These are the actual ingredient weights for this dough setup.
        </p>
        {prefermentEnabled ? (
          <div className="recipe-split">
            {[prefermentMix, mainMix].map((mix) => (
              <div key={mix.label} className="recipe-card">
                <h3>{mix.label}</h3>
                <div className="ingredient-table">
                  {mix.items.map((row) => (
                    <div key={row.label} className="ingredient-row">
                      <div>
                        <span className="ingredient-label">{row.label}</span>
                      </div>
                      <strong>{formatGrams(row.value, row.decimals)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ingredient-table">
            {ingredientRows.map((row) => (
              <div key={row.label} className="ingredient-row">
                <div>
                  <span className="ingredient-label">{row.label}</span>
                  <span className="ingredient-percent">{row.percent}%</span>
                </div>
                <strong>{formatGrams(row.value, row.decimals)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Basic Instructions</h2>
        <div className="timeline">
          {timelineItems.map((item) => {
            if (item.kind === 'phase') {
              return (
                <div key={item.id} className="timeline-phase">
                  {item.phase}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`timeline-item ${item.stepType === 'wait' || item.stepType === 'ferment' ? 'delay' : ''} ${item.stepType === 'check' ? 'check' : ''} ${item.stepType === 'note' ? 'note' : ''}`}
              >
                <div className="timeline-marker" />
                <div className="timeline-card">
                  <div className="timeline-heading">
                    <strong className={item.label === 'Windowpane Test' ? 'timeline-label-inline' : ''}>
                      {item.label}
                      {item.label === 'Windowpane Test' ? (
                        <span className="tooltip">
                          <button
                            type="button"
                            className="tooltip-trigger"
                            aria-label="What to do if the windowpane test fails"
                          >
                            ?
                          </button>
                          <span className="tooltip-content tooltip-content-wide" role="tooltip">
                            If the dough tears instead of stretching thin, keep kneading for 2 to
                            3 more minutes, rest it briefly, and test again. The dough should look
                            smoother and stretch more easily on the next check.
                          </span>
                        </span>
                      ) : null}
                    </strong>
                    {item.durationLabel ? (
                      <span className="timeline-chip">{item.durationLabel}</span>
                    ) : null}
                  </div>
                  {item.detail ? <p>{item.detail}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
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
