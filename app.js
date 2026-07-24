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
  pace: document.querySelector("#pace"),
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

function parseClock(value, defaultHours = 0) {
  const parts = value.trim().split(":");
  if (parts.length === 0 || parts.length > 3 || parts.some((part) => part === "")) {
    return null;
  }

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((number) => !Number.isFinite(number) || number < 0)) {
    return null;
  }

  if (parts.length === 1) {
    return numbers[0] * 60;
  }

  if (parts.length === 2) {
    return defaultHours * 3600 + numbers[0] * 60 + numbers[1];
  }

  return numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
}

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
    const paceSeconds = parseClock(distances.pace.value);
    if (paceSeconds === null || paceSeconds <= 0) {
      return { error: "Enter a pace as mm:ss, such as 05:00." };
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

const goalTimeFields = [distances.goalHours, distances.goalMinutes, distances.goalSeconds];

goalTimeFields.forEach((field) => {
  field.addEventListener("wheel", scrollStepTimePart, { passive: false });
});

[...goalTimeFields, distances.pace, distances.paceUnit].forEach((field) => {
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
