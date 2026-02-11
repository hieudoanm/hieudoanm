/* Awake — Screen Wake Lock API + elapsed timer.
   Classic script (no modules) so it works over file://. */
(function () {
  'use strict';

  var startTime = Date.now();
  var wakeLock = null;
  var userReleased = false;
  var supported = 'wakeLock' in navigator;

  var timerEl = document.getElementById('timer');
  var badgeEl = document.getElementById('status-badge');
  var dotEl = document.getElementById('status-dot');
  var labelEl = document.getElementById('status-label');
  var hintEl = document.getElementById('hint');
  var errorEl = document.getElementById('error');
  var toggleEl = document.getElementById('toggle');

  var STATUS = {
    checking: { label: 'Requesting', hint: 'Requesting the wake lock…' },
    active: { label: 'Active', hint: 'The screen is being kept awake.' },
    released: {
      label: 'Released',
      hint: 'The wake lock was released — likely because the tab was hidden.',
    },
    unsupported: {
      label: 'Unsupported',
      hint: 'The Wake Lock API is not available in this browser.',
    },
    denied: {
      label: 'Denied',
      hint: 'The wake lock request was denied — the screen may sleep.',
    },
  };

  function setStatus(status, error) {
    var meta = STATUS[status] || STATUS.checking;
    badgeEl.setAttribute('data-status', status);
    labelEl.textContent = meta.label;
    hintEl.textContent = meta.hint;
    if (error) {
      errorEl.textContent = error;
      errorEl.hidden = false;
    } else {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    toggleEl.textContent = status === 'active' ? 'Release' : 'Resume';
    toggleEl.disabled = status === 'unsupported' || status === 'checking';
  }

  function acquire() {
    if (!supported) {
      setStatus('unsupported');
      return Promise.resolve();
    }
    setStatus('checking');
    return navigator.wakeLock
      .request('screen')
      .then(function (sentinel) {
        wakeLock = sentinel;
        setStatus('active');
        sentinel.addEventListener('release', function () {
          if (wakeLock === sentinel) {
            wakeLock = null;
            if (!userReleased) setStatus('released');
          }
        });
      })
      .catch(function (err) {
        setStatus('denied', err && err.name ? err.name + ': ' + err.message : String(err));
      });
  }

  function release() {
    userReleased = true;
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
    setStatus('released', 'Released manually — click Resume to re-enable.');
  }

  toggleEl.addEventListener('click', function () {
    if (wakeLock) {
      release();
    } else {
      userReleased = false;
      acquire();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !userReleased) {
      acquire();
    }
  });

  function elapsed() {
    var total = Math.floor((Date.now() - startTime) / 1000);
    var units = [
      ['years', 365 * 24 * 3600],
      ['months', 30 * 24 * 3600],
      ['days', 24 * 3600],
      ['hours', 3600],
      ['minutes', 60],
      ['seconds', 1],
    ];
    var parts = [];
    units.forEach(function (u) {
      var value = Math.floor(total / u[1]);
      total -= value * u[1];
      if (value > 0 || parts.length > 0 || u[0] === 'seconds') {
        if (value > 0 || parts.length > 0) parts.push([u[0], value]);
      }
    });
    // Always show at least seconds; cap at 4 largest units.
    if (parts.length === 0) parts.push(['seconds', 0]);
    return parts.slice(-4);
  }

  function renderTimer() {
    var parts = elapsed();
    timerEl.replaceChildren();
    parts.forEach(function (p) {
      var unit = document.createElement('div');
      unit.className = 'unit';
      var value = document.createElement('span');
      value.className = 'value';
      value.textContent = String(p[1]).padStart(2, '0');
      var label = document.createElement('span');
      label.className = 'label';
      label.textContent = p[1] === 1 ? p[0].replace(/s$/, '') : p[0];
      unit.appendChild(value);
      unit.appendChild(label);
      timerEl.appendChild(unit);
    });
  }

  renderTimer();
  setInterval(renderTimer, 1000);

  if (!supported) {
    setStatus('unsupported');
  } else {
    acquire();
  }
})();
