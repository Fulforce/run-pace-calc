# Target Pace Spec

Target Pace is a lightweight static running pace calculator.

## Aim

The website helps runners quickly answer either of these questions:

- What pace do I need to run for a target race finish time?
- What finish time will I run if I hold a known pace?

The experience should feel immediate. Changing any input should update the
results without a calculate button.

## Non-goals

- User accounts
- Saved workouts
- Server-side calculations
- Ads
- Tracking-heavy analytics
- External JavaScript or CSS dependencies
- Complex training-plan features

## Supported Distances

- 5K
- 10K
- Half marathon
- Marathon
- 50K
- 100K
- 100 miles

## Modes

### Goal Time

Inputs:

- distance
- hours
- minutes
- seconds

Outputs:

- finish time
- pace per km
- pace per mile
- optional cumulative splits

### Known Pace

Inputs:

- distance
- pace minutes
- pace seconds
- pace unit: per km or per mile

Outputs:

- finish time
- pace per km
- pace per mile
- optional cumulative splits

## Split Behavior

Splits are cumulative elapsed times. Users can toggle between:

- 1 km splits
- 1 mile splits

If the race distance does not end exactly on a full split unit, include a final
partial-distance row showing the finish time.

## Performance Principles

- Run entirely in the browser.
- Use small static assets.
- Avoid framework and package-manager overhead.
- Avoid blocking interactions while typing or tapping.
- Keep layout responsive for phone, tablet, and desktop screens.

## Hosting

The site is intended for GitHub Pages and should remain deployable from the repository root without a build step.
