/* Tax — personal income tax calculators: Vietnam PIT (ported from omni),
   UK, US federal, and Germany (§32a EStG 2025). Classic script, no modules. */
(function () {
  'use strict';

  function $(id) {
    return document.getElementById(id);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function num(id) {
    var v = parseFloat($(id).value);
    return isNaN(v) ? 0 : v;
  }

  function money(value, currency) {
    if (value == null || isNaN(value)) return '—';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: value < 1000 ? 2 : 0,
      }).format(value);
    } catch (e) {
      return value.toFixed(0) + ' ' + currency;
    }
  }

  function row(k, v, cls) {
    var r = el('div', 'row' + (cls ? ' ' + cls : ''));
    r.appendChild(el('span', 'k', k));
    r.appendChild(el('span', 'v', v));
    return r;
  }

  // boxes: [{title, rows:[[k,v]...], note?, table?: {head, body}}]
  function renderResults(containerId, boxes) {
    var box = $(containerId);
    box.replaceChildren();
    boxes.forEach(function (b) {
      var div = el('div', 'box');
      div.appendChild(el('h3', '', b.title));
      (b.rows || []).forEach(function (r) {
        div.appendChild(row(r[0], r[1], r[2]));
      });
      if (b.table) {
        var t = document.createElement('table');
        var thead = document.createElement('thead');
        var hr = document.createElement('tr');
        b.table.head.forEach(function (h) {
          hr.appendChild(el('th', '', h));
        });
        thead.appendChild(hr);
        t.appendChild(thead);
        var tbody = document.createElement('tbody');
        b.table.body.forEach(function (cells) {
          var tr = document.createElement('tr');
          cells.forEach(function (c) {
            tr.appendChild(el('td', '', c));
          });
          tbody.appendChild(tr);
        });
        t.appendChild(tbody);
        div.appendChild(t);
      }
      if (b.note) div.appendChild(el('p', 'note-line', b.note));
      box.appendChild(div);
    });
  }

  /* Progressive tax on `taxable` given cumulative upper bounds + rates. */
  function bracketTax(taxable, brackets) {
    var tax = 0;
    var prev = 0;
    var detail = [];
    for (var i = 0; i < brackets.length; i++) {
      var b = brackets[i];
      if (taxable <= prev) break;
      var applied = Math.min(taxable, b.upTo) - prev;
      if (applied <= 0) {
        prev = b.upTo === Infinity ? taxable : b.upTo;
        continue;
      }
      var t = applied * b.rate;
      tax += t;
      detail.push({ rate: b.rate, taxable: applied, tax: t });
      prev = b.upTo === Infinity ? taxable : b.upTo;
    }
    return { tax: tax, detail: detail };
  }

  /* ================= Vietnam PIT (ported from omni Tax) ================= */

  var VN_PERSONAL_DEDUCTION = 11000000;
  var VN_DEPENDENT_DEDUCTION = 4400000;
  var VN_INSURANCE_CAP = 36000000;
  var VN_EMPLOYEE_INSURANCE = { BHXH: 0.08, BHYT: 0.015, BHTN: 0.01 };
  var VN_EMPLOYER_INSURANCE = { BHXH: 0.175, BHYT: 0.03, BHTN: 0.01 };
  var VN_BRACKETS = [
    { limit: 5000000, rate: 0.05 },
    { limit: 5000000, rate: 0.1 },
    { limit: 8000000, rate: 0.15 },
    { limit: 14000000, rate: 0.2 },
    { limit: 20000000, rate: 0.25 },
    { limit: 28000000, rate: 0.3 },
    { limit: Infinity, rate: 0.35 },
  ];

  function sumRates(rates) {
    return Object.keys(rates).reduce(function (a, k) {
      return a + rates[k];
    }, 0);
  }

  function vnInsuranceBase(gross, enabled) {
    return enabled ? Math.min(gross, VN_INSURANCE_CAP) : 0;
  }

  function vnBreakdown(taxableIncome) {
    var remaining = taxableIncome;
    var totalTax = 0;
    var detail = [];
    for (var i = 0; i < VN_BRACKETS.length; i++) {
      var b = VN_BRACKETS[i];
      if (remaining <= 0) break;
      var applied = Math.min(b.limit, remaining);
      var tax = applied * b.rate;
      detail.push({ rate: b.rate, taxable: applied, tax: tax });
      totalTax += tax;
      remaining -= applied;
    }
    return { detail: detail, totalTax: totalTax };
  }

  function vnSolveGrossFromNet(targetNet, dependents, insuranceEnabled) {
    var gross = targetNet;
    for (var i = 0; i < 20; i++) {
      var base = vnInsuranceBase(gross, insuranceEnabled);
      var insurance = base * sumRates(VN_EMPLOYEE_INSURANCE);
      var deductions =
        VN_PERSONAL_DEDUCTION +
        dependents * VN_DEPENDENT_DEDUCTION +
        insurance;
      var taxable = Math.max(0, gross - deductions);
      var res = vnBreakdown(taxable);
      var net = gross - insurance - res.totalTax;
      gross += targetNet - net;
    }
    return Math.max(0, gross);
  }

  function renderVn() {
    var period = $('vn-period').value;
    var mode = $('vn-mode').dataset.mode || 'gross';
    var dependents = Math.max(0, num('vn-dependents'));
    var insuranceEnabled = $('vn-insurance').checked;
    var income = num('vn-income');

    var grossBase =
      mode === 'gross'
        ? income
        : vnSolveGrossFromNet(income, dependents, insuranceEnabled);
    var grossMonthly = period === 'annual' ? grossBase / 12 : grossBase;

    var base = vnInsuranceBase(grossMonthly, insuranceEnabled);
    var employeeInsurance = base * sumRates(VN_EMPLOYEE_INSURANCE);
    var employerInsurance = base * sumRates(VN_EMPLOYER_INSURANCE);
    var dependentDeduction = dependents * VN_DEPENDENT_DEDUCTION;
    var totalDeductions =
      VN_PERSONAL_DEDUCTION + dependentDeduction + employeeInsurance;
    var taxable = Math.max(0, grossMonthly - totalDeductions);
    var res = vnBreakdown(taxable);
    var netMonthly = grossMonthly - employeeInsurance - res.totalTax;
    var effective = grossMonthly ? res.totalTax / grossMonthly : 0;
    var laborCost = grossMonthly + employerInsurance;

    var moneyVnd = function (v) {
      return money(v, 'VND');
    };
    var pct = function (v) {
      return (v * 100).toFixed(2) + '%';
    };

    renderResults('vn-results', [
      {
        title: 'Deductions',
        rows: [
          ['Personal', moneyVnd(VN_PERSONAL_DEDUCTION)],
          ['Dependents (' + dependents + ')', moneyVnd(dependentDeduction)],
          ['Employee insurance', moneyVnd(employeeInsurance)],
          ['Total deductions', moneyVnd(totalDeductions), 'total'],
        ],
        note:
          insuranceEnabled && base < grossMonthly
            ? 'Insurance capped at ₫36,000,000/month base'
            : null,
      },
      {
        title: 'Result (monthly)',
        rows: [
          ['Gross', moneyVnd(grossMonthly)],
          ['Taxable income', moneyVnd(taxable)],
          ['Income tax', moneyVnd(res.totalTax)],
          ['Effective rate', pct(effective)],
          ['Net take-home', moneyVnd(netMonthly), 'net'],
          ['Employer labor cost', moneyVnd(laborCost)],
        ],
      },
      {
        title: 'Tax brackets',
        table: {
          head: ['Rate', 'Taxable', 'Tax'],
          body: res.detail.map(function (b) {
            return [
              (b.rate * 100) + '%',
              moneyVnd(b.taxable),
              moneyVnd(b.tax),
            ];
          }),
        },
      },
    ]);
  }

  /* ================= United Kingdom (2025/26, England/NI/Wales) ========= */

  function renderUk() {
    var income = Math.max(0, num('uk-income'));

    // Personal allowance tapers £1 per £2 above £100k → 0 at £125,140.
    var pa = income > 100000 ? Math.max(0, 12570 - (income - 100000) / 2) : 12570;
    var taxable = Math.max(0, income - pa);

    // Bands on taxable income (thresholds relative to allowance).
    var res = bracketTax(taxable, [
      { upTo: 50270 - pa, rate: 0.2 },
      { upTo: 125140 - pa, rate: 0.4 },
      { upTo: Infinity, rate: 0.45 },
    ]);

    // Employee NIC: 8% £12,584–£50,284, 2% above.
    var ni =
      0.08 * Math.min(Math.max(income - 12584, 0), 50284 - 12584) +
      0.02 * Math.max(0, income - 50284);

    var net = income - res.tax - ni;
    var effective = income ? (res.tax + ni) / income : 0;

    renderResults('uk-results', [
      {
        title: 'Income tax',
        rows: [
          ['Personal allowance', money(pa, 'GBP')],
          ['Taxable income', money(taxable, 'GBP')],
          ['Income tax', money(res.tax, 'GBP')],
        ],
        table: {
          head: ['Band', 'Taxable', 'Tax'],
          body: res.detail.map(function (b, i) {
            var names = ['Basic 20%', 'Higher 40%', 'Additional 45%'];
            return [names[i] || '', money(b.taxable, 'GBP'), money(b.tax, 'GBP')];
          }),
        },
      },
      {
        title: 'National Insurance (employee)',
        rows: [
          ['Class 1 NIC', money(ni, 'GBP')],
          ['Net take-home', money(net, 'GBP'), 'net'],
          ['Effective rate (tax + NIC)', (effective * 100).toFixed(1) + '%'],
        ],
        note: 'Excludes employer NIC (15% over £4,992/yr) and Scotland bands',
      },
    ]);
  }

  /* ================= United States (2025 federal) ====================== */

  var US_BRACKETS = {
    single: [
      { upTo: 11925, rate: 0.1 },
      { upTo: 48475, rate: 0.12 },
      { upTo: 103350, rate: 0.22 },
      { upTo: 197300, rate: 0.24 },
      { upTo: 250525, rate: 0.32 },
      { upTo: 626350, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    mfj: [
      { upTo: 23850, rate: 0.1 },
      { upTo: 96950, rate: 0.12 },
      { upTo: 206700, rate: 0.22 },
      { upTo: 394600, rate: 0.24 },
      { upTo: 501050, rate: 0.32 },
      { upTo: 751600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
  };
  var US_STD_DEDUCTION = { single: 15750, mfj: 31500 };
  var US_SS_WAGE_BASE = 176100;
  var US_MEDICARE_THRESHOLD = { single: 200000, mfj: 250000 };

  function renderUs() {
    var status = $('us-status').value;
    var gross = Math.max(0, num('us-income'));
    var stdDed = US_STD_DEDUCTION[status];
    var taxable = Math.max(0, gross - stdDed);

    var fed = bracketTax(taxable, US_BRACKETS[status]);

    // FICA: Social Security 6.2% up to wage base; Medicare 1.45% + 0.9% over threshold.
    var ss = 0.062 * Math.min(gross, US_SS_WAGE_BASE);
    var medicare =
      0.0145 * gross +
      0.009 * Math.max(0, gross - US_MEDICARE_THRESHOLD[status]);
    var fica = ss + medicare;

    var net = gross - fed.tax - fica;
    var effective = gross ? (fed.tax + fica) / gross : 0;

    var names = ['10%', '12%', '22%', '24%', '32%', '35%', '37%'];

    renderResults('us-results', [
      {
        title: 'Federal income tax',
        rows: [
          ['Standard deduction', money(stdDed, 'USD')],
          ['Taxable income', money(taxable, 'USD')],
          ['Federal tax', money(fed.tax, 'USD')],
        ],
        table: {
          head: ['Bracket', 'Taxable', 'Tax'],
          body: fed.detail.map(function (b, i) {
            return [names[i] || '', money(b.taxable, 'USD'), money(b.tax, 'USD')];
          }),
        },
      },
      {
        title: 'Payroll taxes (FICA)',
        rows: [
          ['Social Security 6.2%', money(ss, 'USD')],
          ['Medicare 1.45% (+0.9% high earner)', money(medicare, 'USD')],
          ['Net take-home', money(net, 'USD'), 'net'],
          ['Effective rate', (effective * 100).toFixed(1) + '%'],
        ],
        note: 'Federal only — excludes state/local income tax and credits',
      },
    ]);
  }

  /* ================= Germany (§32a EStG, 2025) ========================= */

  var DE_GF = 12096; // Grundfreibetrag
  var DE_WKP_SA = 1266; // Werbekosten- + Sonderausgaben-Pauschale (approx.)
  var DE_ZV2 = 17443;
  var DE_ZV3 = 68480;
  var DE_ZV4 = 277825;
  var DE_SOCIAL_RATE = 0.196; // approx. employee social contributions
  var DE_SOCIAL_CAP = 66150; // approx. social-insurance ceiling (KV-based)

  function deIncomeTax(zvE) {
    zvE = Math.floor(zvE);
    if (zvE <= DE_GF) return 0;
    if (zvE <= 17443) {
      var y = (zvE - DE_GF) / 10000;
      return Math.floor((932.3 * y + 1400) * y);
    }
    if (zvE <= DE_ZV3) {
      var z = (zvE - DE_ZV2) / 10000;
      return Math.floor((176.64 * z + 2397) * z + 1015.13);
    }
    if (zvE <= DE_ZV4) return Math.floor(0.42 * zvE - 10911.92);
    return Math.floor(0.45 * zvE - 19246.67);
  }

  function renderDe() {
    var gross = Math.max(0, num('de-income'));
    var socialEnabled = $('de-social').checked;

    // Approximate zvE: gross minus standard employee lump-sum deductions.
    var zvE = Math.max(0, gross - DE_WKP_SA);
    var est = deIncomeTax(zvE);
    var soli = Math.floor(est * 0.055); // simplified Soli
    var social = socialEnabled
      ? DE_SOCIAL_RATE * Math.min(gross, DE_SOCIAL_CAP)
      : 0;
    var totalDeductions = est + soli + social;
    var net = gross - totalDeductions;
    var effective = gross ? totalDeductions / gross : 0;

    renderResults('de-results', [
      {
        title: 'Income tax (§32a EStG 2025)',
        rows: [
          ['Assumed zvE', money(zvE, 'EUR')],
          ['Einkommensteuer', money(est, 'EUR')],
          ['Solidaritätszuschlag (~5.5%)', money(soli, 'EUR')],
          ['Total tax', money(est + soli, 'EUR'), 'total'],
        ],
        note: 'zvE approximated as gross − €1,266 standard deductions',
      },
      {
        title: 'Take-home',
        rows: [
          ['Employee social insurance', money(social, 'EUR')],
          ['Net take-home', money(net, 'EUR'), 'net'],
          ['Effective rate', (effective * 100).toFixed(1) + '%'],
        ],
        note: 'Social ~19.6% capped at €66,150/yr — church tax excluded',
      },
    ]);
  }

  /* ================= tabs + wiring ================= */

  function renderActive() {
    var active = document.querySelector('#country-tabs .tab.active');
    var country = active ? active.dataset.country : 'vn';
    if (country === 'uk') renderUk();
    else if (country === 'us') renderUs();
    else if (country === 'de') renderDe();
    else renderVn();
  }

  function init() {
    Array.prototype.forEach.call(
      document.querySelectorAll('#country-tabs .tab'),
      function (b) {
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(
            document.querySelectorAll('#country-tabs .tab'),
            function (t) {
              t.classList.toggle('active', t === b);
            }
          );
          ['vn', 'uk', 'us', 'de'].forEach(function (c) {
            $('panel-' + c).hidden = c !== b.dataset.country;
          });
          renderActive();
        });
      }
    );

    $('vn-period').addEventListener('change', renderVn);
    $('vn-income').addEventListener('input', renderVn);
    $('vn-dependents').addEventListener('input', renderVn);
    $('vn-insurance').addEventListener('change', renderVn);
    $('vn-mode').addEventListener('click', function () {
      var mode = this.dataset.mode === 'net' ? 'gross' : 'net';
      this.dataset.mode = mode;
      $('vn-income-label').textContent =
        mode === 'gross'
          ? 'Gross income (₫)'
          : 'Net income (₫)';
      this.textContent = mode === 'gross' ? 'Gross → Net' : 'Net → Gross';
      renderVn();
    });

    $('uk-income').addEventListener('input', renderUk);
    $('us-status').addEventListener('change', renderUs);
    $('us-income').addEventListener('input', renderUs);
    $('de-income').addEventListener('input', renderDe);
    $('de-social').addEventListener('change', renderDe);

    renderActive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
