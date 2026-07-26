const KM_PER_MILE = 1.609344;

const distancePresets = {
  5: { label: "5K", defaultGoalTime: { hours: 0, minutes: 20, seconds: 0 } },
  10: { label: "10K", defaultGoalTime: { hours: 0, minutes: 40, seconds: 0 } },
  21.0975: { label: "Half marathon", defaultGoalTime: { hours: 1, minutes: 30, seconds: 0 } },
  42.195: { label: "Marathon", defaultGoalTime: { hours: 3, minutes: 0, seconds: 0 } },
  50: { label: "50K", defaultGoalTime: { hours: 4, minutes: 30, seconds: 0 } },
  100: { label: "100K", defaultGoalTime: { hours: 12, minutes: 0, seconds: 0 } },
  160.9344: { label: "100 miles", defaultGoalTime: { hours: 24, minutes: 0, seconds: 0 } },
};

const distances = {
  distance: document.querySelector("#distance"),
  goalHours: document.querySelector("#goal-hours"),
  goalMinutes: document.querySelector("#goal-minutes"),
  goalSeconds: document.querySelector("#goal-seconds"),
  paceMinutes: document.querySelector("#pace-minutes"),
  paceSeconds: document.querySelector("#pace-seconds"),
  paceUnit: document.querySelector("#pace-unit"),
  converterPreset: document.querySelector("#converter-preset"),
  converterKm: document.querySelector("#converter-km"),
  converterMi: document.querySelector("#converter-mi"),
  message: document.querySelector("#message"),
  finishTime: document.querySelector("#finish-time"),
  paceKm: document.querySelector("#pace-km"),
  paceMi: document.querySelector("#pace-mi"),
  splitBody: document.querySelector("#split-body"),
  splitDistanceHeading: document.querySelector("#split-distance-heading"),
  paceResults: document.querySelector("[data-section='pace-results']"),
  splitsPanel: document.querySelector("[data-section='splits']"),
  converterLegend: document.querySelector("#converter-legend"),
  converterPanel: document.querySelector("[data-field='distance-converter']"),
  converterPresetField: document.querySelector(".converter-preset"),
};

let mode = "time";
let splitUnit = "km";
let holdTimeout;
let holdInterval;
let ignoreNextClick = false;
let isSyncingDistance = false;
let distanceHoldTimeout;
let distanceHoldInterval;
let ignoreNextDistanceClick = false;

function parseTimePart(field) {
  if (field.value.trim() === "") {
    return null;
  }

  const number = Number(field.value);
  if (!Number.isInteger(number) || number < 0) {
    return null;
  }

  return number;
}

function getGoalSeconds() {
  const hours = parseTimePart(distances.goalHours);
  const minutes = parseTimePart(distances.goalMinutes);
  const seconds = parseTimePart(distances.goalSeconds);

  if (hours === null || minutes === null || seconds === null || minutes > 59 || seconds > 59) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

function getPaceSeconds() {
  const minutes = parseTimePart(distances.paceMinutes);
  const seconds = parseTimePart(distances.paceSeconds);

  if (minutes === null || seconds === null || minutes > 59 || seconds > 59) {
    return null;
  }

  return minutes * 60 + seconds;
}

function setGoalTime({ hours, minutes, seconds }) {
  distances.goalHours.value = hours;
  distances.goalMinutes.value = minutes;
  distances.goalSeconds.value = seconds;
}

function getSelectedDistanceKm() {
  if (distances.distance.value === "custom") {
    return parseDistance(distances.converterKm.value);
  }

  return Number(distances.distance.value);
}

function scrollStepTimePart(event) {
  if (document.activeElement !== event.currentTarget) {
    return;
  }

  event.preventDefault();

  if (event.deltaY < 0) {
    event.currentTarget.stepUp();
  } else {
    event.currentTarget.stepDown();
  }

  update();
}

function clampField(field) {
  const min = Number(field.min || 0);
  const max = Number(field.max || Number.MAX_SAFE_INTEGER);
  const fallback = Number(field.defaultValue || 0);
  const value = Number(field.value);

  if (!Number.isFinite(value)) {
    field.value = fallback;
    return;
  }

  field.value = Math.min(max, Math.max(min, value));
}

function stepTimePart(button) {
  const field = document.querySelector(`#${button.dataset.stepTarget}`);
  const direction = Number(button.dataset.step);

  if (!field || !Number.isFinite(direction)) {
    return;
  }

  const min = Number(field.min || 0);
  const max = Number(field.max || Number.MAX_SAFE_INTEGER);
  const value = Number(field.value || field.defaultValue || 0);
  const shouldWrap = field.dataset.wrap === "true";

  if (shouldWrap && direction < 0 && value <= min) {
    field.value = max;
  } else if (shouldWrap && direction > 0 && value >= max) {
    field.value = min;
  } else if (direction > 0) {
    field.stepUp();
  } else {
    field.stepDown();
  }

  clampField(field);
  update();
}

function stopHoldStep() {
  window.clearTimeout(holdTimeout);
  window.clearInterval(holdInterval);
}

function startHoldStep(event) {
  const button = event.currentTarget;

  stopHoldStep();

  holdTimeout = window.setTimeout(() => {
    ignoreNextClick = true;
    stepTimePart(button);
    holdInterval = window.setInterval(() => stepTimePart(button), 80);
  }, 350);
}

function startTouchStep(event) {
  event.preventDefault();
  ignoreNextClick = true;
  stepTimePart(event.currentTarget);
  startHoldStep(event);
}

function tapStep(event) {
  if (ignoreNextClick) {
    ignoreNextClick = false;
    return;
  }

  event.preventDefault();
  stopHoldStep();
  stepTimePart(event.currentTarget);
}

function formatDuration(totalSeconds) {
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatPace(secondsPerUnit, unit) {
  return `${formatDuration(secondsPerUnit)} /${unit}`;
}

function parseDistance(value) {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === "") {
    return null;
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?|\.\d+)\s*(?:k|km|kms|kilometer|kilometers|m|mi|mile|miles)?$/);
  if (!match) {
    return null;
  }

  const number = Number(match[1]);
  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number;
}

function formatDistance(value) {
  return Number(value.toFixed(4)).toString();
}

function setMode(nextMode) {
  mode = nextMode;

  if (mode === "distance" && distances.distance.value !== "custom") {
    distances.converterPreset.value = distances.distance.value;
    setConverterDistanceKm(Number(distances.distance.value));
  }

  document.querySelectorAll("[data-mode]").forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  const showCustomDistance = mode === "distance" || distances.distance.value === "custom";

  document.querySelector("[data-field='race-distance']").classList.toggle("is-hidden", mode === "distance");
  document.querySelector("[data-field='goal-time']").classList.toggle("is-hidden", mode !== "time");
  document.querySelector("[data-field='pace']").classList.toggle("is-hidden", mode !== "pace");
  distances.converterPanel.classList.toggle("is-hidden", !showCustomDistance);
  distances.converterPanel.classList.toggle("is-custom-distance", mode !== "distance");
  distances.converterPresetField.classList.toggle("is-hidden", mode !== "distance");
  distances.converterLegend.textContent = mode === "distance" ? "Distance converter" : "Custom distance";
  distances.paceResults.classList.toggle("is-hidden", mode === "distance");
  distances.splitsPanel.classList.toggle("is-hidden", mode === "distance");

  update();
}

function setSplitUnit(nextUnit) {
  splitUnit = nextUnit;

  document.querySelectorAll("[data-split-unit]").forEach((button) => {
    const isActive = button.dataset.splitUnit === splitUnit;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  update();
}

function getCalculation() {
  const distanceKm = getSelectedDistanceKm();
  let finishSeconds;

  if (distanceKm === null || distanceKm <= 0) {
    return { error: "Enter a positive race distance." };
  }

  if (mode === "time") {
    finishSeconds = getGoalSeconds();
  } else {
    const paceSeconds = getPaceSeconds();
    if (paceSeconds === null || paceSeconds <= 0) {
      return { error: "Enter a pace with seconds between 0 and 59." };
    }

    const secondsPerKm = distances.paceUnit.value === "mi" ? paceSeconds / KM_PER_MILE : paceSeconds;
    finishSeconds = secondsPerKm * distanceKm;
  }

  if (finishSeconds === null || finishSeconds <= 0) {
    return { error: "Enter a finish time with minutes and seconds between 0 and 59." };
  }

  const secondsPerKm = finishSeconds / distanceKm;
  return {
    distanceKm,
    finishSeconds,
    secondsPerKm,
    secondsPerMile: secondsPerKm * KM_PER_MILE,
  };
}

function renderSplits(calculation) {
  const unitKm = splitUnit === "km" ? 1 : KM_PER_MILE;
  const totalUnits = calculation.distanceKm / unitKm;
  const fullSplits = Math.floor(totalUnits);
  const hasPartialFinal = totalUnits % 1 > 0.000001;
  const rows = [];

  for (let split = 1; split <= fullSplits; split += 1) {
    rows.push({ distance: split, seconds: calculation.secondsPerKm * unitKm * split });
  }

  if (hasPartialFinal) {
    rows.push({ distance: totalUnits, seconds: calculation.finishSeconds });
  }

  distances.splitDistanceHeading.textContent = splitUnit === "km" ? "Kilometer" : "Mile";
  distances.splitBody.innerHTML = rows
    .map((row) => {
      const label = Number.isInteger(row.distance) ? row.distance : row.distance.toFixed(2);
      return `<tr><td>${label}</td><td>${formatDuration(row.seconds)}</td></tr>`;
    })
    .join("");
}

function update() {
  if (mode === "distance") {
    distances.message.textContent = "";
    return;
  }

  const calculation = getCalculation();

  if (calculation.error) {
    distances.message.textContent = calculation.error;
    distances.finishTime.textContent = "--";
    distances.paceKm.textContent = "--";
    distances.paceMi.textContent = "--";
    distances.splitBody.innerHTML = "";
    return;
  }

  distances.message.textContent = "";
  distances.finishTime.textContent = formatDuration(calculation.finishSeconds);
  distances.paceKm.textContent = formatPace(calculation.secondsPerKm, "km");
  distances.paceMi.textContent = formatPace(calculation.secondsPerMile, "mi");
  renderSplits(calculation);
}

function syncDistanceConverter(source) {
  if (isSyncingDistance) {
    return;
  }

  const sourceField = source === "km" ? distances.converterKm : distances.converterMi;
  const targetField = source === "km" ? distances.converterMi : distances.converterKm;
  const value = parseDistance(sourceField.value);

  isSyncingDistance = true;
  distances.converterPreset.value = "";
  distances.distance.value = "custom";

  if (value === null) {
    targetField.value = "";
    distances.message.textContent = sourceField.value.trim() === "" ? "" : "Enter a positive distance.";
    isSyncingDistance = false;
    if (mode !== "distance") {
      update();
    }
    return;
  }

  targetField.value = formatDistance(source === "km" ? value / KM_PER_MILE : value * KM_PER_MILE);
  distances.message.textContent = "";
  isSyncingDistance = false;
  if (mode !== "distance") {
    update();
  }
}

function setConverterDistanceKm(distanceKm) {
  distances.converterKm.value = formatDistance(distanceKm);
  distances.converterMi.value = formatDistance(distanceKm / KM_PER_MILE);
  distances.message.textContent = "";
}

function selectPresetDistance(distanceKm) {
  const presetKey = String(distanceKm);

  distances.distance.value = presetKey;
  distances.converterPreset.value = presetKey;
  setConverterDistanceKm(distanceKm);

  if (mode === "time") {
    setGoalTime(distancePresets[presetKey].defaultGoalTime);
  }

  setMode(mode);
}

function stepDistance(button) {
  const field = document.querySelector(`#${button.dataset.distanceStepTarget}`);
  const step = Number(button.dataset.distanceStep);

  if (!field || !Number.isFinite(step)) {
    return;
  }

  const current = parseDistance(field.value) ?? 0;
  const next = Math.max(0, current + step);
  field.value = formatDistance(next);
  syncDistanceConverter(field.id === "converter-km" ? "km" : "mi");
}

function stopDistanceHoldStep() {
  window.clearTimeout(distanceHoldTimeout);
  window.clearInterval(distanceHoldInterval);
}

function startDistanceHoldStep(event) {
  const button = event.currentTarget;

  stopDistanceHoldStep();

  distanceHoldTimeout = window.setTimeout(() => {
    ignoreNextDistanceClick = true;
    stepDistance(button);
    distanceHoldInterval = window.setInterval(() => stepDistance(button), 80);
  }, 350);
}

function startDistanceTouchStep(event) {
  event.preventDefault();
  ignoreNextDistanceClick = true;
  stepDistance(event.currentTarget);
  startDistanceHoldStep(event);
}

function tapDistanceStep(event) {
  if (ignoreNextDistanceClick) {
    ignoreNextDistanceClick = false;
    return;
  }

  event.preventDefault();
  stopDistanceHoldStep();
  stepDistance(event.currentTarget);
}

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

document.querySelectorAll("[data-split-unit]").forEach((button) => {
  button.addEventListener("click", () => setSplitUnit(button.dataset.splitUnit));
});

const timePartFields = [
  distances.goalHours,
  distances.goalMinutes,
  distances.goalSeconds,
  distances.paceMinutes,
  distances.paceSeconds,
];

timePartFields.forEach((field) => {
  field.addEventListener("wheel", scrollStepTimePart, { passive: false });
  field.addEventListener("blur", () => {
    clampField(field);
    update();
  });
});

document.querySelectorAll("[data-step-target]").forEach((button) => {
  button.addEventListener("click", tapStep);
  button.addEventListener("mousedown", startHoldStep);
  button.addEventListener("mouseup", stopHoldStep);
  button.addEventListener("mouseleave", stopHoldStep);
  button.addEventListener("touchstart", startTouchStep, { passive: false });
  button.addEventListener("touchend", stopHoldStep);
  button.addEventListener("touchcancel", stopHoldStep);
});

document.querySelectorAll("[data-distance-step-target]").forEach((button) => {
  button.addEventListener("click", tapDistanceStep);
  button.addEventListener("mousedown", startDistanceHoldStep);
  button.addEventListener("mouseup", stopDistanceHoldStep);
  button.addEventListener("mouseleave", stopDistanceHoldStep);
  button.addEventListener("touchstart", startDistanceTouchStep, { passive: false });
  button.addEventListener("touchend", stopDistanceHoldStep);
  button.addEventListener("touchcancel", stopDistanceHoldStep);
});

[...timePartFields, distances.paceUnit].forEach((field) => {
  field.addEventListener("input", update);
  field.addEventListener("change", update);
});

distances.converterKm.addEventListener("input", () => syncDistanceConverter("km"));
distances.converterMi.addEventListener("input", () => syncDistanceConverter("mi"));
distances.converterPreset.addEventListener("change", () => {
  if (distances.converterPreset.value === "") {
    distances.distance.value = "custom";
    setMode(mode);
    return;
  }

  selectPresetDistance(Number(distances.converterPreset.value));
});

distances.distance.addEventListener("change", () => {
  if (distances.distance.value === "custom") {
    distances.converterPreset.value = "";
    setMode(mode);
    return;
  }

  selectPresetDistance(Number(distances.distance.value));
});

update();
