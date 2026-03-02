# Pizza Recipe Master Logic

This file contains the data architecture for the pizza dough calculator, separating static ingredient ratios from dynamic yeast percentages across fermentation timelines.

## 1. Neapolitan Style

- Best for high-heat (800F+) environments
- Default flour: Type 00 Flour
- No oil or sugar

### Static Ratios

- Water: 62%
- Salt: 2.5%
- Oil: 0%
- Sugar: 0%

### Dynamic Yeast (IDY)

| Fermentation Time | Yeast % | Temperature Environment |
| :--- | :--- | :--- |
| 8 Hours | 0.20% | Room Temp (70F) |
| 24 Hours | 0.05% | Room Temp (70F) |
| 24 Hours Cold | 0.10% | Cold Ferment (38F) |
| 48 Hours | 0.03% | Cold Ferment (38F) |
| 72 Hours | 0.01% | Cold Ferment (38F) |

## 2. New York Style

- Best for home ovens (500-550F)
- Default flour: High-Protein Bread Flour

### Static Ratios

- Water: 65%
- Salt: 2%
- Olive Oil: 2%
- Sugar: 1.5%

### Dynamic Yeast (IDY)

| Fermentation Time | Yeast % | Temperature Environment |
| :--- | :--- | :--- |
| 8 Hours | 0.50% | Room Temp (70F) |
| 24 Hours | 0.30% | Cold Ferment (38F) |
| 48 Hours | 0.20% | Cold Ferment (38F) |
| 72 Hours | 0.15% | Cold Ferment (38F) |

## 3. Implementation Rules

### Sugar Fail-Safe

If the user selects Neapolitan with fermentation beyond 48 hours, show this warning:

Long fermentation without sugar may result in a pale crust in home ovens. Consider switching to NY Style or adding 1% sugar.

### Yeast Precision

- Round yeast to the nearest 0.01g
- For long-ferment Neapolitan doughs, advise the user to use a jeweler's scale or estimate a small pinch
