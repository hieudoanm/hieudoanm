/* Legislation — hemicycle visualization of legislative seat distributions.
   Ported from omni's Legislation. Classic script (no modules). */
(function () {
  'use strict';



var COUNTRIES = [
  {
    name: 'United States',
    flag: '🇺🇸',
    chambers: {
      Senate: {
        name: 'Senate',
        totalSeats: 100,
        parties: [
          {
            name: 'Republican',
            abbreviation: 'R',
            color: '#ef4444',
            seats: 53,
          },
          { name: 'Democrat', abbreviation: 'D', color: '#3b82f6', seats: 45 },
          {
            name: 'Independent',
            abbreviation: 'I',
            color: '#8b5cf6',
            seats: 2,
          },
        ],
      },
      'House of Representatives': {
        name: 'House of Representatives',
        totalSeats: 435,
        parties: [
          {
            name: 'Republican',
            abbreviation: 'R',
            color: '#ef4444',
            seats: 220,
          },
          { name: 'Democrat', abbreviation: 'D', color: '#3b82f6', seats: 213 },
          {
            name: 'Independent',
            abbreviation: 'I',
            color: '#8b5cf6',
            seats: 2,
          },
        ],
      },
    },
  },
  {
    name: 'United Kingdom',
    flag: '🇬🇧',
    chambers: {
      'House of Commons': {
        name: 'House of Commons',
        totalSeats: 650,
        parties: [
          { name: 'Labour', abbreviation: 'Lab', color: '#ef4444', seats: 412 },
          {
            name: 'Conservative',
            abbreviation: 'Con',
            color: '#3b82f6',
            seats: 121,
          },
          {
            name: 'Liberal Democrats',
            abbreviation: 'LD',
            color: '#f59e0b',
            seats: 72,
          },
          {
            name: 'Scottish National',
            abbreviation: 'SNP',
            color: '#eab308',
            seats: 9,
          },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 36 },
        ],
      },
      'House of Lords': {
        name: 'House of Lords',
        totalSeats: 784,
        parties: [
          {
            name: 'Conservative',
            abbreviation: 'Con',
            color: '#3b82f6',
            seats: 273,
          },
          { name: 'Labour', abbreviation: 'Lab', color: '#ef4444', seats: 170 },
          {
            name: 'Crossbenchers',
            abbreviation: 'CB',
            color: '#6b7280',
            seats: 180,
          },
          { name: 'Lib Dems', abbreviation: 'LD', color: '#f59e0b', seats: 82 },
          { name: 'Others', abbreviation: 'Oth', color: '#94a3b8', seats: 79 },
        ],
      },
    },
  },
  {
    name: 'Germany',
    flag: '🇩🇪',
    chambers: {
      Bundestag: {
        name: 'Bundestag',
        totalSeats: 736,
        parties: [
          { name: 'SPD', abbreviation: 'SPD', color: '#ef4444', seats: 206 },
          {
            name: 'CDU/CSU',
            abbreviation: 'CDU',
            color: '#1e293b',
            seats: 197,
          },
          {
            name: 'Greens',
            abbreviation: 'Grüne',
            color: '#22c55e',
            seats: 118,
          },
          { name: 'FDP', abbreviation: 'FDP', color: '#eab308', seats: 91 },
          { name: 'AfD', abbreviation: 'AfD', color: '#3b82f6', seats: 77 },
          { name: 'Left', abbreviation: 'Linke', color: '#7c3aed', seats: 28 },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 19 },
        ],
      },
      Bundesrat: {
        name: 'Bundesrat',
        totalSeats: 69,
        parties: [
          {
            name: 'SPD-led states',
            abbreviation: 'SPD',
            color: '#ef4444',
            seats: 24,
          },
          {
            name: 'CDU/CSU-led states',
            abbreviation: 'CDU',
            color: '#1e293b',
            seats: 21,
          },
          {
            name: 'Coalition states',
            abbreviation: 'Mix',
            color: '#8b5cf6',
            seats: 24,
          },
        ],
      },
    },
  },
  {
    name: 'France',
    flag: '🇫🇷',
    chambers: {
      'Assemblée Nationale': {
        name: 'Assemblée Nationale',
        totalSeats: 577,
        parties: [
          { name: 'RN', abbreviation: 'RN', color: '#1e40af', seats: 143 },
          {
            name: 'NFP (Left)',
            abbreviation: 'NFP',
            color: '#ef4444',
            seats: 193,
          },
          {
            name: 'Renaissance',
            abbreviation: 'Ren',
            color: '#f59e0b',
            seats: 99,
          },
          { name: 'UDR', abbreviation: 'UDR', color: '#3b82f6', seats: 16 },
          { name: 'MoDem', abbreviation: 'MoDem', color: '#eab308', seats: 36 },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 90 },
        ],
      },
      Sénat: {
        name: 'Sénat',
        totalSeats: 348,
        parties: [
          { name: 'LR', abbreviation: 'LR', color: '#3b82f6', seats: 133 },
          { name: 'PS', abbreviation: 'PS', color: '#ef4444', seats: 64 },
          { name: 'RDPI', abbreviation: 'RDPI', color: '#f59e0b', seats: 21 },
          { name: 'UC', abbreviation: 'UC', color: '#8b5cf6', seats: 50 },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 80 },
        ],
      },
    },
  },
  {
    name: 'Japan',
    flag: '🇯🇵',
    chambers: {
      'House of Representatives': {
        name: 'House of Representatives',
        totalSeats: 465,
        parties: [
          { name: 'LDP', abbreviation: 'LDP', color: '#3b82f6', seats: 191 },
          {
            name: 'Komeito',
            abbreviation: 'Kome',
            color: '#f59e0b',
            seats: 24,
          },
          { name: 'CDP', abbreviation: 'CDP', color: '#ef4444', seats: 98 },
          { name: 'Nippon', abbreviation: 'Nipp', color: '#8b5cf6', seats: 38 },
          { name: 'Ishin', abbreviation: 'Ish', color: '#f97316', seats: 38 },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 76 },
        ],
      },
      'House of Councillors': {
        name: 'House of Councillors',
        totalSeats: 248,
        parties: [
          { name: 'LDP', abbreviation: 'LDP', color: '#3b82f6', seats: 107 },
          {
            name: 'Komeito',
            abbreviation: 'Kome',
            color: '#f59e0b',
            seats: 27,
          },
          { name: 'CDP', abbreviation: 'CDP', color: '#ef4444', seats: 40 },
          { name: 'Ishin', abbreviation: 'Ish', color: '#f97316', seats: 21 },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 53 },
        ],
      },
    },
  },
  {
    name: 'Canada',
    flag: '🇨🇦',
    chambers: {
      'House of Commons': {
        name: 'House of Commons',
        totalSeats: 338,
        parties: [
          {
            name: 'Liberal',
            abbreviation: 'Lib',
            color: '#ef4444',
            seats: 153,
          },
          {
            name: 'Conservative',
            abbreviation: 'Con',
            color: '#3b82f6',
            seats: 120,
          },
          { name: 'NDP', abbreviation: 'NDP', color: '#f97316', seats: 25 },
          {
            name: 'Bloc Québécois',
            abbreviation: 'BQ',
            color: '#3b82f6',
            seats: 33,
          },
          { name: 'Green', abbreviation: 'Grn', color: '#22c55e', seats: 2 },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 5 },
        ],
      },
      Senate: {
        name: 'Senate',
        totalSeats: 105,
        parties: [
          {
            name: 'ISG (Independent)',
            abbreviation: 'ISG',
            color: '#8b5cf6',
            seats: 39,
          },
          { name: 'CSG', abbreviation: 'CSG', color: '#3b82f6', seats: 17 },
          { name: 'PSG', abbreviation: 'PSG', color: '#ef4444', seats: 21 },
          {
            name: 'Non-affiliated',
            abbreviation: 'NA',
            color: '#6b7280',
            seats: 15,
          },
          { name: 'Others', abbreviation: 'Oth', color: '#94a3b8', seats: 13 },
        ],
      },
    },
  },
  {
    name: 'Australia',
    flag: '🇦🇺',
    chambers: {
      'House of Representatives': {
        name: 'House of Representatives',
        totalSeats: 151,
        parties: [
          { name: 'Labor', abbreviation: 'ALP', color: '#ef4444', seats: 78 },
          {
            name: 'Coalition',
            abbreviation: 'LNP',
            color: '#3b82f6',
            seats: 58,
          },
          { name: 'Greens', abbreviation: 'Grn', color: '#22c55e', seats: 4 },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 11 },
        ],
      },
      Senate: {
        name: 'Senate',
        totalSeats: 76,
        parties: [
          { name: 'Labor', abbreviation: 'ALP', color: '#ef4444', seats: 26 },
          {
            name: 'Coalition',
            abbreviation: 'LNP',
            color: '#3b82f6',
            seats: 30,
          },
          { name: 'Greens', abbreviation: 'Grn', color: '#22c55e', seats: 11 },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 9 },
        ],
      },
    },
  },
  {
    name: 'India',
    flag: '🇮🇳',
    chambers: {
      'Lok Sabha': {
        name: 'Lok Sabha',
        totalSeats: 543,
        parties: [
          { name: 'BJP', abbreviation: 'BJP', color: '#f97316', seats: 240 },
          { name: 'INC', abbreviation: 'INC', color: '#3b82f6', seats: 99 },
          { name: 'SP', abbreviation: 'SP', color: '#ef4444', seats: 37 },
          { name: 'AITC', abbreviation: 'TMC', color: '#22c55e', seats: 29 },
          { name: 'DMK', abbreviation: 'DMK', color: '#ef4444', seats: 22 },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 116 },
        ],
      },
      'Rajya Sabha': {
        name: 'Rajya Sabha',
        totalSeats: 245,
        parties: [
          { name: 'BJP', abbreviation: 'BJP', color: '#f97316', seats: 93 },
          { name: 'INC', abbreviation: 'INC', color: '#3b82f6', seats: 26 },
          { name: 'AITC', abbreviation: 'TMC', color: '#22c55e', seats: 13 },
          { name: 'Others', abbreviation: 'Oth', color: '#6b7280', seats: 113 },
        ],
      },
    },
  },
];

  /* ---- Hemicycle (ported from omni) ---- */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function buildHemicycle(parties, totalSeats) {
    var seatColors = [];
    parties.forEach(function (p) {
      for (var i = 0; i < p.seats; i++) seatColors.push(p.color);
    });
    var dots = [];
    var ROWS = 6,
      CX = 50,
      CY = 54,
      R_INNER = 22,
      R_OUTER = 46;
    var rowWeights = [1, 1.4, 1.8, 2.2, 2.6, 3.0];
    var totalWeight = rowWeights.reduce(function (a, b) {
      return a + b;
    }, 0);
    var rowCounts = rowWeights.map(function (w) {
      return Math.round((w / totalWeight) * seatColors.length);
    });
    rowCounts[rowCounts.length - 1] +=
      seatColors.length -
      rowCounts.reduce(function (a, b) {
        return a + b;
      }, 0);
    var seatIdx = 0;
    for (var row = 0; row < ROWS; row++) {
      var t = row / (ROWS - 1);
      var r = R_INNER + t * (R_OUTER - R_INNER);
      var count = rowCounts[row];
      for (var i = 0; i < count; i++) {
        if (seatIdx >= seatColors.length) break;
        var angle = (Math.PI * i) / (count - 1 || 1);
        dots.push({
          x: CX - r * Math.cos(angle),
          y: CY - r * Math.sin(angle),
          color: seatColors[seatIdx++],
        });
      }
    }
    return dots;
  }

  /* ---- UI ---- */

  function $(id) {
    return document.getElementById(id);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var countryIdx = 0;
  var chamberKey = null;

  function currentCountry() {
    return COUNTRIES[countryIdx];
  }

  function chamberKeys() {
    return Object.keys(currentCountry().chambers);
  }

  function currentChamber() {
    var c = currentCountry();
    var keys = chamberKeys();
    return c.chambers[chamberKey] || c.chambers[keys[0]];
  }

  function renderHemicycle(chamber) {
    var svg = $('hemicycle');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var dots = buildHemicycle(chamber.parties, chamber.totalSeats);
    var dotR = Math.max(0.8, Math.min(2.0, 40 / Math.sqrt(chamber.totalSeats)));

    var base = document.createElementNS(SVG_NS, 'line');
    base.setAttribute('x1', '2');
    base.setAttribute('y1', '54');
    base.setAttribute('x2', '98');
    base.setAttribute('y2', '54');
    base.setAttribute('stroke', 'currentColor');
    base.setAttribute('stroke-width', '0.3');
    base.setAttribute('opacity', '0.15');
    svg.appendChild(base);

    dots.forEach(function (d) {
      var c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', d.x);
      c.setAttribute('cy', d.y);
      c.setAttribute('r', dotR);
      c.setAttribute('fill', d.color);
      c.setAttribute('opacity', '0.9');
      svg.appendChild(c);
    });
  }

  function renderStats(chamber) {
    var majority = Math.floor(chamber.totalSeats / 2) + 1;
    var largest = chamber.parties.slice().sort(function (a, b) {
      return b.seats - a.seats;
    })[0];
    $('stat-total').textContent = chamber.totalSeats;
    $('stat-majority').textContent = majority;
    var l = $('stat-largest');
    l.textContent = largest.seats;
    l.style.color = largest.color;
  }

  function renderParties(chamber) {
    var list = $('party-list');
    while (list.firstChild) list.removeChild(list.firstChild);
    var majority = Math.floor(chamber.totalSeats / 2) + 1;
    chamber.parties.forEach(function (p) {
      var pct = ((p.seats / chamber.totalSeats) * 100).toFixed(1);
      var row = el('div', 'party-row');

      var dot = el('span', 'party-dot');
      dot.style.backgroundColor = p.color;
      row.appendChild(dot);

      var name = el('span', 'party-name');
      name.textContent = p.name;
      if (p.seats >= majority) {
        name.appendChild(el('span', 'badge', 'Majority'));
      }
      row.appendChild(name);

      var track = el('span', 'party-track');
      var fill = el('span', 'party-fill');
      fill.style.width = pct + '%';
      fill.style.backgroundColor = p.color;
      track.appendChild(fill);
      row.appendChild(track);

      var seats = el('span', 'party-seats');
      seats.textContent = p.seats + ' (' + pct + '%)';
      row.appendChild(seats);

      list.appendChild(row);
    });
  }

  function renderCountries() {
    var wrap = $('country-buttons');
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    COUNTRIES.forEach(function (c, i) {
      var b = el('button', 'country-btn' + (i === countryIdx ? ' active' : ''), c.flag + ' ' + c.name);
      b.type = 'button';
      b.addEventListener('click', function () {
        countryIdx = i;
        chamberKey = chamberKeys()[0];
        renderAll();
      });
      wrap.appendChild(b);
    });
  }

  function renderChambers() {
    var wrap = $('chamber-tabs');
    var keys = chamberKeys();
    wrap.hidden = keys.length <= 1;
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    keys.forEach(function (key) {
      var b = el('button', 'chamber-tab' + (key === chamberKey ? ' active' : ''), key);
      b.type = 'button';
      b.addEventListener('click', function () {
        chamberKey = key;
        renderChambers();
        renderAll();
      });
      wrap.appendChild(b);
    });
  }

  function renderAll() {
    renderCountries();
    renderChambers();
    var chamber = currentChamber();
    renderHemicycle(chamber);
    renderStats(chamber);
    renderParties(chamber);
  }

  function init() {
    chamberKey = chamberKeys()[0];
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
