/* Cron — 5-field expression builder with presets, plain-English
   description, and next-execution preview. Ported from omni's Cron app.
   Classic script (no modules) so it works over file://. */
(function () {
  'use strict';

  var FIELD_KEYS = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
  var FIELD_LABELS = {
    minute: 'Min',
    hour: 'Hour',
    dayOfMonth: 'Day',
    month: 'Month',
    dayOfWeek: 'DOW',
  };
  var FIELD_RANGES = {
    minute: '0-59',
    hour: '0-23',
    dayOfMonth: '1-31',
    month: '1-12',
    dayOfWeek: '0-7',
  };
  var MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var PRESETS = [
    { label: 'Every min', value: '* * * * *' },
    { label: 'Every 5m', value: '*/5 * * * *' },
    { label: 'Every 30m', value: '*/30 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every day', value: '0 0 * * *' },
    { label: 'Every week', value: '0 0 * * 0' },
    { label: 'Every month', value: '0 0 1 * *' },
  ];

  var expr = '* * * * *';
  var editing = false;

  /* ---- parser ---- */

  function parseField(raw, min, max) {
    var values = {};
    raw.split(',').forEach(function (token) {
      var t = token.trim();
      if (!t) return;
      if (t === '*') {
        for (var k = min; k <= max; k++) values[k] = true;
        return;
      }
      var step = t.match(/^(\*|\d+(?:-\d+)?)\/(\d+)$/);
      if (step) {
        var lo = min;
        var hi = max;
        if (step[1] !== '*') {
          var parts = step[1].split('-').map(Number);
          lo = parts[0];
          hi = parts.length === 2 ? parts[1] : max;
        }
        for (var i = lo; i <= hi; i += parseInt(step[2], 10)) values[i] = true;
        return;
      }
      var range = t.match(/^(\d+)-(\d+)$/);
      if (range) {
        for (var j = parseInt(range[1], 10); j <= parseInt(range[2], 10); j++)
          values[j] = true;
        return;
      }
      var n = parseInt(t, 10);
      if (!isNaN(n) && n >= min && n <= max) values[n] = true;
    });
    return Object.keys(values).map(Number);
  }

  function parse(expression) {
    var parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return null;
    return {
      minute: parseField(parts[0], 0, 59),
      hour: parseField(parts[1], 0, 23),
      dayOfMonth: parseField(parts[2], 1, 31),
      month: parseField(parts[3], 1, 12),
      dayOfWeek: parseField(parts[4], 0, 7),
    };
  }

  function hasAll(field, max) {
    // True when the field covers its whole range (wildcard).
    return field.length >= max;
  }

  function matches(f, d) {
    if (f.minute.indexOf(d.getMinutes()) === -1) return false;
    if (f.hour.indexOf(d.getHours()) === -1) return false;
    var domWild = hasAll(f.dayOfMonth, 31);
    var dowWild = hasAll(f.dayOfWeek, 8);
    var dowMatch =
      f.dayOfWeek.indexOf(d.getDay()) !== -1 || f.dayOfWeek.indexOf(7) !== -1;
    if (!domWild && !dowWild) {
      if (f.dayOfMonth.indexOf(d.getDate()) === -1 && !dowMatch) return false;
    } else {
      if (!domWild && f.dayOfMonth.indexOf(d.getDate()) === -1) return false;
      if (!dowWild && !dowMatch) return false;
    }
    if (f.month.indexOf(d.getMonth() + 1) === -1) return false;
    return true;
  }

  function nextTimes(expression, count) {
    var f = parse(expression);
    if (!f) return [];
    var result = [];
    var cursor = new Date();
    cursor.setSeconds(0, 0);
    cursor.setMinutes(cursor.getMinutes() + 1);
    var guard = 0;
    while (result.length < (count || 5) && guard < 525600) {
      if (matches(f, cursor)) result.push(new Date(cursor));
      cursor.setMinutes(cursor.getMinutes() + 1);
      guard++;
    }
    return result;
  }

  /* ---- formatting ---- */

  function sortedNums(list) {
    return list.slice().sort(function (a, b) {
      return a - b;
    });
  }

  function isStep(list) {
    if (list.length < 3) return null;
    var d = list[1] - list[0];
    if (d <= 1) return null;
    for (var i = 1; i < list.length; i++) {
      if (list[i] - list[i - 1] !== d) return null;
    }
    return d;
  }

  function cronToDescription(expression) {
    var parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return 'Invalid expression';
    if (
      parts.every(function (p) {
        return p === '*';
      })
    )
      return 'Every minute';
    if (
      parts[0].indexOf('*/') === 0 &&
      parts.slice(1).every(function (p) {
        return p === '*';
      })
    )
      return 'Every ' + parts[0].slice(2) + ' minutes';
    if (
      parts[0] === '0' &&
      parts.slice(2).every(function (p) {
        return p === '*';
      })
    )
      return 'Every hour';
    if (
      parts[0] === '0' &&
      parts[1] === '0' &&
      parts[2] === '*' &&
      parts[3] === '*' &&
      parts[4] === '*'
    )
      return 'At midnight';
    if (
      parts[0] === '0' &&
      parts[1] === '0' &&
      parts[2] === '*' &&
      parts[3] === '*'
    ) {
      var dow = parts[4];
      if (dow === '0' || dow === '7') return 'At midnight, only on Sunday';
      if (/^[0-6]$/.test(dow))
        return 'At midnight, only on ' + DAY_NAMES[Number(dow)];
      if (dow.indexOf(',') !== -1) {
        return (
          'At midnight, only on ' +
          dow
            .split(',')
            .map(Number)
            .sort()
            .map(function (d) {
              return DAY_NAMES[d];
            })
            .join(', ')
        );
      }
      return 'At midnight, on day ' + dow;
    }
    var fields = parse(expression);
    if (!fields) return expression;
    var out = [];

    var minutes = sortedNums(fields.minute);
    if (minutes.length > 0 && minutes.length < 60) {
      if (fields.hour.length > 0 && fields.hour.length < 24) {
        out.push(
          'At ' +
            minutes
              .map(function (m) {
                return ':' + String(m).padStart(2, '0');
              })
              .join(',')
        );
      } else if (minutes.length === 1) {
        out.push('At minute ' + minutes[0]);
      } else {
        var md = isStep(minutes);
        out.push(
          md ? 'Every ' + md + ' minutes' : 'At minutes ' + minutes.join(',')
        );
      }
    }

    var hours = sortedNums(fields.hour);
    if (hours.length > 0 && hours.length < 24) {
      if (hours.length === 1) {
        out.push('past hour ' + hours[0]);
      } else {
        var hd = isStep(hours);
        out.push(
          hd ? 'every ' + hd + ' hours' : 'past hours ' + hours.join(',')
        );
      }
    }

    var dom = sortedNums(fields.dayOfMonth);
    if (dom.length > 0 && dom.length < 31) {
      out.push(
        dom.length === 1 ? 'on day ' + dom[0] : 'on days ' + dom.join(',')
      );
    }

    var months = sortedNums(fields.month);
    if (months.length > 0 && months.length < 12) {
      out.push(
        months.length === 1
          ? 'in ' + MONTH_NAMES[months[0] - 1]
          : 'in ' +
              months
                .map(function (m) {
                  return MONTH_NAMES[m - 1];
                })
                .join(',')
      );
    }

    var dowSet = {};
    fields.dayOfWeek.forEach(function (d) {
      dowSet[d === 7 ? 0 : d] = true;
    });
    var dows = Object.keys(dowSet)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      });
    if (dows.length > 0 && dows.length < 7) {
      out.push(
        dows.length === 1
          ? 'on ' + DAY_NAMES[dows[0]]
          : 'on ' +
              dows
                .map(function (d) {
                  return DAY_NAMES[d];
                })
                .join(',')
      );
    }

    return out.length ? out.join(' ') : expression;
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatNext(d) {
    return (
      DAY_NAMES[d.getDay()] +
      ', ' +
      MONTH_NAMES[d.getMonth()] +
      ' ' +
      d.getDate() +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes())
    );
  }

  /* ---- DOM ---- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function fieldValues() {
    return expr.trim().split(/\s+/);
  }

  function renderPresets() {
    var wrap = document.getElementById('presets');
    wrap.replaceChildren();
    PRESETS.forEach(function (p) {
      var b = el(
        'button',
        'preset' + (expr === p.value ? ' active' : ''),
        p.label
      );
      b.type = 'button';
      b.addEventListener('click', function () {
        apply(p.value);
      });
      wrap.appendChild(b);
    });
  }

  function renderExpr() {
    var view = document.getElementById('expr-view');
    var fields = document.getElementById('expr-fields');
    fields.replaceChildren();
    var parts = fieldValues();
    var valid = parse(expr) !== null;
    for (var i = 0; i < 5; i++) {
      var f = el('div', 'expr-field' + (valid ? '' : ' invalid'));
      f.appendChild(el('span', 'value', parts[i] || '—'));
      f.appendChild(el('span', 'name', FIELD_LABELS[FIELD_KEYS[i]]));
      fields.appendChild(f);
    }
    document.getElementById('description').textContent =
      cronToDescription(expr);

    var upcoming = document.getElementById('upcoming');
    var times = document.getElementById('times');
    times.replaceChildren();
    var next = valid ? nextTimes(expr, 5) : [];
    if (next.length === 0) {
      upcoming.hidden = true;
    } else {
      upcoming.hidden = false;
      next.forEach(function (t) {
        times.appendChild(el('div', 'time', formatNext(t)));
      });
    }

    var hint = document.getElementById('next-hint');
    hint.textContent = next.length ? 'Next: ' + formatNext(next[0]) : '';
  }

  function renderEdit() {
    var wrap = document.getElementById('edit-fields');
    wrap.replaceChildren();
    var valid = parse(expr) !== null;
    var parts = fieldValues();
    FIELD_KEYS.forEach(function (key, i) {
      var f = el('div', 'edit-field' + (valid ? '' : ' invalid'));
      f.appendChild(el('span', 'name', FIELD_LABELS[key]));
      var input = document.createElement('input');
      input.type = 'text';
      input.value = parts[i] || '';
      input.placeholder = '*';
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.addEventListener('input', function () {
        var p = fieldValues();
        p[i] = input.value;
        while (p.length < 5) p.push('*');
        expr = p.slice(0, 5).join(' ');
        // Don't re-render the edit fields — that would drop focus.
        renderPresets();
      });
      f.appendChild(input);
      f.appendChild(el('span', 'range', FIELD_RANGES[key]));
      wrap.appendChild(f);
    });
  }

  function renderAll() {
    renderPresets();
    if (editing) {
      renderEdit();
    } else {
      renderExpr();
    }
  }

  function apply(value) {
    expr = value;
    editing = false;
    document.getElementById('expr-edit').hidden = true;
    document.getElementById('expr-view').hidden = false;
    document.getElementById('edit-toggle').textContent = 'Edit';
    document.getElementById('edit-toggle').classList.remove('active');
    renderAll();
  }

  function init() {
    document
      .getElementById('edit-toggle')
      .addEventListener('click', function () {
        editing = !editing;
        document.getElementById('expr-edit').hidden = !editing;
        document.getElementById('expr-view').hidden = editing;
        this.textContent = editing ? 'Done' : 'Edit';
        this.classList.toggle('active', editing);
        renderAll();
      });
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
