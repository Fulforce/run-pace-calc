# Target Pace Spec

Target Pace is a lightweight static running pace calculator.

## Aim

The website helps runners quickly answer either of these questions:

- What pace do I need to run for a target race finish time?
- What finish time will I run if I hold a known pace?
- What is a distance in kilometers or miles?

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

Preset distances:

- 5K
- 10K
- Half marathon
- Marathon
- 50K
- 100K
- 100 miles

Custom distances are supported through shared kilometer and mile fields.

## Modes

### Goal Time

Inputs:

- preset or custom distance
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

- preset or custom distance
- pace minutes
- pace seconds
- pace unit: per km or per mile

Outputs:

- finish time
- pace per km
- pace per mile
- optional cumulative splits

### Distance Converter

Inputs:

- preset distance
- kilometers
- miles

Behavior:

- choosing a preset updates kilometers and miles immediately
- editing kilometers updates miles immediately
- editing miles updates kilometers immediately
- custom distances carry across to the pace calculator
- no pace cards or split table are shown in this mode

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
