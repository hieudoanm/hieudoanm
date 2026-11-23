/* Epoch Convert — two-way Unix timestamp (ms) ↔ date & time.
   Ported from omni's EpochConvert. Classic script (no modules). */
(function () {
  'use strict';

  var DAY_MS = 86400000;
  var mode = 'toDate'; // 'toDate' | 'toEpoch'

  function $(id) {
    return document.getElementById(id);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // "YYYY-MM-DD HH:mm:ss" in UTC, matching omni's output format.
  function toUtcString(ms) {
    var d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }

  // datetime-local -> epoch ms (interpreted in local time).
  function toEpoch(localStr) {
    var d = new Date(localStr);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  function showResult(label, value) {
    var box = $('result');
    if (value == null || value === '') {
      box.hidden = true;
      return;
    }
    $('result-label').textContent = label;
    $('result-value').textContent = value;
    box.hidden = false;
  }

  function convert() {
    if (mode === 'toDate') {
      var raw = $('epoch').value.trim();
      var ms = Number(raw);
      if (raw === '' || isNaN(ms)) {
        showResult('', '');
        return;
      }
      showResult('Human date (UTC)', toUtcString(ms) || 'Invalid timestamp');
    } else {
      var ms2 = toEpoch($('datetime').value);
      showResult('Epoch (ms)', ms2 == null ? '' : String(ms2));
    }
  }

  function setMode(next) {
    mode = next;
    $('mode-to-date').classList.toggle('active', next === 'toDate');
    $('mode-to-epoch').classList.toggle('active', next === 'toEpoch');
    $('field-epoch').hidden = next !== 'toDate';
    $('field-date').hidden = next !== 'toEpoch';
    convert();
  }

  function fillEpoch(ms) {
    $('epoch').value = String(ms);
    if (mode !== 'toDate') setMode('toDate');
    else convert();
  }

  function fillNow() {
    fillEpoch(Date.now());
  }

  function init() {
    $('mode-to-date').addEventListener('click', function () {
      setMode('toDate');
    });
    $('mode-to-epoch').addEventListener('click', function () {
      setMode('toEpoch');
    });
    $('epoch').addEventListener('input', convert);
    $('datetime').addEventListener('input', convert);
    $('now').addEventListener('click', fillNow);

    $('q-now').addEventListener('click', function () {
      fillEpoch(Date.now());
    });
    $('q-day').addEventListener('click', function () {
      fillEpoch(DAY_MS);
    });
    $('q-yesterday').addEventListener('click', function () {
      fillEpoch(Date.now() - DAY_MS);
    });
    $('q-zero').addEventListener('click', function () {
      fillEpoch(0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
