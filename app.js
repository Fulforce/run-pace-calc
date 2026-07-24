const KM_PER_MILE = 1.609344;

const defaultGoalTimes = {
  5: { hours: 0, minutes: 20, seconds: 0 },
  10: { hours: 0, minutes: 40, seconds: 0 },
  21.0975: { hours: 1, minutes: 30, seconds: 0 },
  42.195: { hours: 3, minutes: 0, seconds: 0 },
  50: { hours: 4, minutes: 30, seconds: 0 },
  100: { hours: 12, minutes: 0, seconds: 0 },
  160.9344: { hours: 24, minutes: 0, seconds: 0 },
};

const distances = {
  distance: document.querySelector("#distance"),
  goalHours: document.querySelector("#goal-hours"),
  goalMinutes: document.querySelector("#goal-minutes"),
  goalSeconds: document.querySelector("#goal-seconds"),
  paceMinutes: document.querySelector("#pace-minutes"),
  paceSeconds: document.querySelector("#pace-seconds"),
  paceUnit: document.querySelector("#pace-unit"),
  message: document.querySelector("#message"),
  finishTime: document.querySelector("#finish-time"),
  paceKm: document.querySelector("#pace-km"),
  paceMi: document.querySelector("#pace-mi"),
  splitBody: document.querySelector("#split-body"),
  splitDistanceHeading: document.querySelector("#split-distance-heading"),
};

let mode = "time";
let splitUnit = "km";
let holdTimeout;
let holdInterval;
let ignoreNextClick = false;

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

function setMode(nextMode) {
  mode = nextMode;

  document.querySelectorAll("[data-mode]").forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  document.querySelector("[data-field='goal-time']").classList.toggle("is-hidden", mode !== "time");
  document.querySelector("[data-field='pace']").classList.toggle("is-hidden", mode !== "pace");

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
  const distanceKm = Number(distances.distance.value);
  let finishSeconds;

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

[...timePartFields, distances.paceUnit].forEach((field) => {
  field.addEventListener("input", update);
  field.addEventListener("change", update);
});

distances.distance.addEventListener("change", () => {
  if (mode === "time") {
    setGoalTime(defaultGoalTimes[distances.distance.value]);
  }

  update();
});

update();
