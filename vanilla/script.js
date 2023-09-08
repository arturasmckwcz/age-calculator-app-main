const inputAll = document.getElementById('input-all');
const inputDay = document.getElementById('input-day');
const inputMonth = document.getElementById('input-month');
const inputYear = document.getElementById('input-year');
const form = document.querySelector('form');
const resultDays = document.getElementById('result-days');
const resultMonths = document.getElementById('result-months');
const resultYears = document.getElementById('result-years');
const textDays = document.getElementById('text-days');
const textMonths = document.getElementById('text-months');
const textYears = document.getElementById('text-years');

const state = {
  errorCommon: { error: '' },
  day: {
    node: document.querySelector('label[for="input-day"] p'),
    value: inputDay.value,
    error: '',
  },
  month: {
    node: document.querySelector('label[for="input-month"] p'),
    value: inputMonth.value,
    error: '',
  },
  year: {
    node: document.querySelector('label[for="input-year"] p'),
    value: inputYear.value,
    error: '',
  },
};
const stateKeys = Object.keys(state).filter(key => key !== 'errorCommon');

function setState(stateUpdates) {
  for (const prop in stateUpdates)
    if (prop in state) updateObject(state[prop], stateUpdates[prop]);

  renderInputError();
}

function renderInputError() {
  if (state.errorCommon.error) {
    {
      state.day.node.textContent = state.errorCommon.error;
      inputAll.classList.add('error');
    }
  } else if (
    stateKeys
      .map(input => {
        state[input].node.textContent = state[input].error;
        return state[input].error;
      })
      .some(error => error !== '')
  )
    inputAll.classList.add('error');
  else inputAll.classList.remove('error');
}

inputDay.addEventListener('input', e => handleInput('day', e));
inputDay.addEventListener('blur', () => handleBlur('day'));

inputMonth.addEventListener('input', e => handleInput('month', e));
inputMonth.addEventListener('blur', () => handleBlur('month'));

inputYear.addEventListener('input', e => handleInput('year', e));
inputYear.addEventListener('blur', () => handleBlur('year'));

function handleInput(input, e) {
  setState({ error: { value: '' } });
  const value = e.target.value;
  if (isNaN(value))
    setState({ [input]: { error: `Must be a valid ${input}` } });
  else setState({ [input]: { error: '', value } });
}

function handleBlur(input) {
  setState({ [input]: { error: getErrorOnBlur(input) } });
}

form.addEventListener('submit', e => {
  e.preventDefault();

  stateKeys.forEach(input => {
    if (!state[input].value)
      setState({ [input]: { error: 'This field is required' } });
  });

  if (stateKeys.some(input => !!state[input].error)) {
    resetResult();
    return;
  }

  const { isDateValid, isBeforeToday } = getStateValidations();

  if (!isDateValid || !isBeforeToday) {
    const error = !isDateValid
      ? 'Must be a valid date'
      : !isBeforeToday
      ? 'Must be in the past'
      : '';
    setState({ errorCommon: { error } });
    resetResult();
    return;
  }

  const { year, month, day } = state;
  const { days, months, years } = calcDateDifference(
    new Date(+year.value, +month.value - 1, +day.value),
  );

  resultDays.textContent = days;
  resultMonths.textContent = months;
  resultYears.textContent = years;

  textDays.textContent = isPlural(days) ? 'days' : 'day';
  textMonths.textContent = isPlural(months) ? 'months' : 'month';
  textYears.textContent = isPlural(years) ? 'years' : 'year';

  inputAll.classList.remove('error');
});

function getErrorOnBlur(input) {
  let error = 'This field is required';
  let value;
  switch (input) {
    case 'year':
      value = +state.year.value;
      if (value)
        error = value <= new Date().getFullYear() ? '' : 'Must be in the past';
      break;
    case 'month':
      value = +state.month.value;
      if (value)
        error = value >= 1 && value <= 12 ? '' : 'Must be a valid month';
      break;
    case 'day':
      value = +state.day.value;
      if (value) error = value >= 1 && value <= 31 ? '' : 'Must be a valid day';
      break;
  }

  return error;
}

function getStateValidations() {
  const day = +state.day.value;
  const month = +state.month.value - 1;
  const year = +state.year.value;

  const today = new Date();
  const dateToValidate = new Date(year, month, day);

  const isDateValid = dateToValidate.getDate() === day;

  const isBeforeToday = today - dateToValidate > 0;

  return {
    isDateValid,
    isBeforeToday,
  };
}

function resetResult() {
  resultDays.textContent = '- -';
  resultMonths.textContent = '- -';
  resultYears.textContent = '- -';
}

/**
 * Recursively update the properties of an object with values from another object.
 *
 * This function iterates through the properties of the 'updates' object and applies
 * the updates to the 'object' while maintaining the reference to the original object.
 *
 * @param {Object} object - The target object to be updated.
 * @param {Object} updates - An object containing properties and their updated values.
 * @returns {Object} - The original 'object' with updated properties.
 */
function updateObject(object, updates) {
  for (const prop in updates) {
    if (updates.hasOwnProperty(prop)) {
      if (
        typeof updates[prop] === 'object' &&
        typeof state[prop] === 'object'
      ) {
        object[prop] = updateObject(object[prop], updates[prop]);
      } else {
        object[prop] = updates[prop];
      }
    }
  }
}

/**
 * Calculates the difference in days, months, and years between two dates.
 *
 * @param {Date} from - The starting date.
 * @param {Date} [to=new Date()] - The ending date. Defaults to the current date if not provided.
 * @returns {Object} An object containing the difference in days, months, and years.
 * @throws {Error} If the 'from' date is after the 'to' date.
 */
function calcDateDifference(from, to = new Date()) {
  function nextDay(date) {
    return new Date(date).setDate(date.getDate() + 1);
  }

  function nextMonth(date) {
    return new Date(date).setMonth(date.getMonth() + 1);
  }

  function nextYear(date) {
    return new Date(date).setFullYear(date.getFullYear() + 1);
  }

  to.setHours(0, 0, 0, 0);

  let current = new Date(from);

  let days = 0;
  let months = 0;
  let years = 0;

  while (to > current) {
    const next = nextYear(current);
    if (to >= next) {
      current = new Date(next);
      years += 1;
    } else break;
  }

  while (to > current) {
    const next = nextMonth(current);
    if (to >= next) {
      current = new Date(next);
      months += 1;
    } else break;
  }

  while (to > current) {
    const next = nextDay(current);
    current = new Date(next);
    days += 1;
  }

  return { days, months, years };
}

/**
 * Check if a number indicates a plural form.
 *
 * @param {number} n - The number to check for plural form.
 * @returns {boolean} - True if the number indicates a plural form, false otherwise.
 */
function isPlural(n) {
  const endsNotWith1 = n % 10 !== 1;
  const endsWith11 = n % 100 === 11;

  return endsNotWith1 || endsWith11;
}
