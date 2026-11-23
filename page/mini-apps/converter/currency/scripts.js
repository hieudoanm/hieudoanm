/* Currency Converter — base VND, live rates via open.er-api.com.
   Classic script (no modules) so it works over file://. */
(function () {
  'use strict';

  var API_URL = 'https://open.er-api.com/v6/latest/VND';

  // Fiat currencies offered in the picker (codes present in both the live
  // API and the offline snapshot).
  var FIAT = [
    'AUD',
    'BRL',
    'CAD',
    'CHF',
    'CNY',
    'CZK',
    'DKK',
    'EUR',
    'GBP',
    'HKD',
    'HUF',
    'IDR',
    'ILS',
    'INR',
    'ISK',
    'JPY',
    'KRW',
    'MXN',
    'MYR',
    'NOK',
    'NZD',
    'PHP',
    'PLN',
    'RON',
    'SEK',
    'SGD',
    'THB',
    'TRY',
    'USD',
    'VND',
    'ZAR',
  ];

  var NAMES = {
    AUD: 'Australian Dollar',
    BRL: 'Brazilian Real',
    CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    CZK: 'Czech Koruna',
    DKK: 'Danish Krone',
    EUR: 'Euro',
    GBP: 'British Pound',
    HKD: 'Hong Kong Dollar',
    HUF: 'Hungarian Forint',
    IDR: 'Indonesian Rupiah',
    ILS: 'Israeli Shekel',
    INR: 'Indian Rupee',
    ISK: 'Icelandic Króna',
    JPY: 'Japanese Yen',
    KRW: 'South Korean Won',
    MXN: 'Mexican Peso',
    MYR: 'Malaysian Ringgit',
    NOK: 'Norwegian Krone',
    NZD: 'New Zealand Dollar',
    PHP: 'Philippine Peso',
    PLN: 'Polish Złoty',
    RON: 'Romanian Leu',
    SEK: 'Swedish Krona',
    SGD: 'Singapore Dollar',
    THB: 'Thai Baht',
    TRY: 'Turkish Lira',
    USD: 'US Dollar',
    VND: 'Vietnamese Dong',
    ZAR: 'South African Rand',
  };

  var QUICK = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'SGD',
    'CNY',
    'AUD',
    'CAD',
    'CHF',
    'INR',
    'KRW',
    'HKD',
    'VND',
  ];

  // Offline fallback: fiat rates per 1 EUR (ECB snapshot 2026-03-27),
  // VND approximated at ~28,450 per EUR.
  var FALLBACK_EUR = {
    EUR: 1,
    AUD: 1.6731,
    BRL: 6.0535,
    CAD: 1.5974,
    CHF: 0.9178,
    CNY: 7.9626,
    CZK: 24.542,
    DKK: 7.4721,
    GBP: 0.8672,
    HKD: 9.0223,
    HUF: 389.73,
    IDR: 19559.03,
    ILS: 3.6329,
    INR: 109.1945,
    ISK: 143.6,
    JPY: 184.16,
    KRW: 1740.79,
    MXN: 20.7971,
    MYR: 4.6218,
    NOK: 11.1885,
    NZD: 2.0019,
    PHP: 69.752,
    PLN: 4.2875,
    RON: 5.0989,
    SEK: 10.878,
    SGD: 1.4831,
    THB: 37.949,
    TRY: 51.2001,
    USD: 1.1517,
    ZAR: 19.7984,
    VND: 28450,
  };

  var rates = null; // code -> units of code per 1 VND
  var live = false;
  var state = { amount: '1000000', from: 'VND', to: 'USD' };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Convert the EUR-based snapshot into units-per-VND.
  function fallbackRates() {
    var out = {};
    var vndPerEur = FALLBACK_EUR.VND;
    Object.keys(FALLBACK_EUR).forEach(function (code) {
      out[code] = FALLBACK_EUR[code] / vndPerEur;
    });
    out.VND = 1;
    return out;
  }

  function loadRates() {
    return fetch(API_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || data.result !== 'success' || !data.rates) {
          throw new Error('bad payload');
        }
        var out = {};
        Object.keys(data.rates).forEach(function (code) {
          if (typeof data.rates[code] === 'number')
            out[code] = data.rates[code];
        });
        if (!out.VND) out.VND = 1;
        rates = out;
        live = true;
        document.getElementById('source').textContent =
          'rates: open.er-api.com · base VND · updated ' +
          (data.time_last_update_utc || 'now');
      })
      .catch(function () {
        rates = fallbackRates();
        live = false;
        document.getElementById('source').textContent =
          'offline — fallback rates (ECB snapshot + approx VND)';
      })
      .then(render);
  }

  function currencies() {
    return FIAT.filter(function (c) {
      return rates && typeof rates[c] === 'number';
    }).sort();
  }

  function convert(amount, from, to) {
    if (!rates || !rates[from] || !rates[to]) return null;
    return (amount * rates[to]) / rates[from];
  }

  function fmt(value, minFrac, maxFrac) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
    });
  }

  // Locale-aware money formatting: "$39.00", "¥6,201", "₫25,800,000".
  // Falls back to a plain number + code for tiny values that would round
  // to zero under the currency's fraction digits.
  function money(value, code) {
    if (value == null || isNaN(value)) return '—';
    if (Math.abs(value) < 0.01) return fmt(value, 4, 8) + ' ' + code;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
      }).format(value);
    } catch (e) {
      return fmt(value, 2, 4) + ' ' + code;
    }
  }

  function fillSelect(select, codes, current) {
    select.replaceChildren();
    codes.forEach(function (code) {
      var opt = el('option', '', code + ' — ' + (NAMES[code] || code));
      opt.value = code;
      select.appendChild(opt);
    });
    select.value = codes.indexOf(current) !== -1 ? current : codes[0];
    state[select.id === 'from' ? 'from' : 'to'] = select.value;
  }

  function renderResult() {
    var root = document.getElementById('result');
    root.replaceChildren();
    var amount = parseFloat(state.amount);
    if (!state.amount || isNaN(amount) || amount < 0) {
      root.classList.add('empty');
      root.textContent = 'Enter a valid amount';
      return;
    }
    root.classList.remove('empty');

    var converted = convert(amount, state.from, state.to);
    if (converted == null) {
      root.textContent = 'Rate unavailable';
      return;
    }

    var equation = el(
      'p',
      'equation',
      fmt(amount, 0, 4) + ' ' + state.from + ' ='
    );
    var value = el('p', 'value');
    value.appendChild(document.createTextNode(money(converted, state.to)));
    value.appendChild(el('span', 'unit', state.to));
    var rate = el(
      'p',
      'rate',
      '1 ' +
        state.from +
        ' = ' +
        fmt(convert(1, state.from, state.to), 4, 6) +
        ' ' +
        state.to
    );

    root.appendChild(equation);
    root.appendChild(value);
    root.appendChild(rate);
  }

  function renderQuick() {
    var title = document.getElementById('quick-title');
    var amount = parseFloat(state.amount);
    if (!state.amount || isNaN(amount) || amount < 0) {
      title.textContent = 'vs majors';
      document.getElementById('quick-list').replaceChildren();
      return;
    }
    title.textContent = fmt(amount, 0, 4) + ' ' + state.from + ' vs majors';
    var list = document.getElementById('quick-list');
    list.replaceChildren();

    QUICK.filter(function (c) {
      return c !== state.from && rates && typeof rates[c] === 'number';
    }).forEach(function (code) {
      var row = el('div', 'row' + (code === state.to ? ' active' : ''));
      var left = el('div');
      left.appendChild(el('span', 'code', code));
      left.appendChild(
        el('span', 'name', (NAMES[code] || '').split(' ')[0] || '')
      );
      row.appendChild(left);
      var converted = convert(amount, state.from, code);
      row.appendChild(el('span', 'rate', money(converted, code)));
      row.addEventListener('click', function () {
        state.to = code;
        document.getElementById('to').value = code;
        renderAll();
      });
      list.appendChild(row);
    });
  }

  function renderAll() {
    if (!rates) return;
    renderResult();
    renderQuick();
  }

  function render() {
    if (!rates) return;
    var codes = currencies();
    var fromSel = document.getElementById('from');
    var toSel = document.getElementById('to');
    var prevFrom = state.from;
    var prevTo = state.to;
    fillSelect(fromSel, codes, prevFrom);
    fillSelect(toSel, codes, prevTo);
    renderAll();
  }

  function init() {
    var amount = document.getElementById('amount');
    amount.addEventListener('input', function () {
      state.amount = amount.value;
      renderAll();
    });

    document.getElementById('from').addEventListener('change', function (e) {
      state.from = e.target.value;
      renderAll();
    });

    document.getElementById('to').addEventListener('change', function (e) {
      state.to = e.target.value;
      renderAll();
    });

    document.getElementById('swap').addEventListener('click', function () {
      var tmp = state.from;
      state.from = state.to;
      state.to = tmp;
      document.getElementById('from').value = state.from;
      document.getElementById('to').value = state.to;
      renderAll();
    });

    // Show fallback rates immediately so the page is usable instantly.
    rates = fallbackRates();
    render();
    loadRates();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
