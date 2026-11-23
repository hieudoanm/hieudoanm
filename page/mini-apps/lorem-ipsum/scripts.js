/* Lorem Ipsum — paragraphs / words / bytes / lists generator.
   Ported from omni's LoremIpsum. Classic script (no modules). */
(function () {
  'use strict';

  var WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
    'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore',
    'et', 'dolore', 'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim', 'veniam',
    'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'ut',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure',
    'dolor', 'in', 'reprehenderit', 'in', 'voluptate', 'velit', 'esse',
    'cillum', 'dolore', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur',
    'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'in', 'culpa',
    'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
  ];

  var UNIT_CONFIG = {
    paragraphs: {
      singular: 'paragraph',
      plural: 'paragraphs',
      min: 1,
      max: 20,
      step: 1,
    },
    words: { singular: 'word', plural: 'words', min: 10, max: 200, step: 1 },
    bytes: { singular: 'byte', plural: 'bytes', min: 100, max: 5000, step: 100 },
    lists: {
      singular: 'list item',
      plural: 'list items',
      min: 1,
      max: 20,
      step: 1,
    },
  };

  var unit = 'paragraphs';
  var count = 3;

  function rand(max) {
    return Math.floor(Math.random() * max);
  }

  function sentenceWords(wordCount) {
    var start = rand(WORDS.length - wordCount);
    return WORDS.slice(start, start + wordCount);
  }

  function sentence(wordCount) {
    var words = sentenceWords(wordCount);
    var line = words.join(' ');
    return line.charAt(0).toUpperCase() + line.slice(1) + '.';
  }

  function paragraph(sentences) {
    var parts = [];
    for (var i = 0; i < sentences; i++) {
      parts.push(sentence(8 + rand(6)));
    }
    return parts.join(' ');
  }

  function paragraphText() {
    return paragraph(3 + rand(4));
  }

  function generateParagraphs(n) {
    var parts = [];
    for (var i = 0; i < n; i++) parts.push(paragraphText());
    return parts.join('\n\n');
  }

  function generateWords(n) {
    var words = [];
    while (words.length < n) {
      sentenceWords(8 + rand(6)).forEach(function (w) {
        words.push(w);
      });
    }
    return words.slice(0, n).join(' ');
  }

  function byteLength(text) {
    return new TextEncoder().encode(text).length;
  }

  function generateBytes(n) {
    var text = '';
    while (byteLength(text) < n) {
      text = text ? text + ' ' + paragraphText() : paragraphText();
    }
    // Slice by UTF-8 bytes, not UTF-16 units.
    return new TextDecoder().decode(
      new TextEncoder().encode(text).slice(0, n)
    );
  }

  function generateLists(n) {
    var parts = [];
    for (var i = 0; i < n; i++) {
      parts.push('• ' + sentence(8 + rand(6)));
    }
    return parts.join('\n');
  }

  function generate(n, u) {
    if (u === 'words') return generateWords(n);
    if (u === 'bytes') return generateBytes(n);
    if (u === 'lists') return generateLists(n);
    return generateParagraphs(n);
  }

  /* ---- UI ---- */

  function $(id) {
    return document.getElementById(id);
  }

  function clampCount(n, cfg) {
    return Math.max(cfg.min, Math.min(cfg.max, n));
  }

  function render() {
    var cfg = UNIT_CONFIG[unit];
    var text = generate(count, unit);

    $('output').value = text;
    $('count').min = cfg.min;
    $('count').max = cfg.max;
    $('count').step = cfg.step;
    $('count').value = count;
    $('unit-label').textContent = count === 1 ? cfg.singular : cfg.plural;
    $('dec').disabled = count <= cfg.min;
    $('inc').disabled = count >= cfg.max;
    $('presets').hidden = !(unit === 'paragraphs' || unit === 'lists');

    var stats = $('stats');
    stats.replaceChildren();
    [
      text.length.toLocaleString() + ' chars',
      text.split(/\s+/).filter(Boolean).length.toLocaleString() + ' words',
      byteLength(text).toLocaleString() + ' bytes',
    ].forEach(function (s) {
      var span = document.createElement('span');
      span.textContent = s;
      stats.appendChild(span);
    });
  }

  function setUnit(next) {
    unit = next;
    count = clampCount(count, UNIT_CONFIG[unit]);
    Array.prototype.forEach.call(
      document.querySelectorAll('#tabs .tab'),
      function (b) {
        b.classList.toggle('active', b.dataset.unit === unit);
      }
    );
    render();
  }

  function init() {
    var tabs = $('tabs');
    Object.keys(UNIT_CONFIG).forEach(function (u) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab' + (u === unit ? ' active' : '');
      b.dataset.unit = u;
      b.setAttribute('role', 'tab');
      b.textContent = u;
      b.addEventListener('click', function () {
        setUnit(u);
      });
      tabs.appendChild(b);
    });

    $('dec').addEventListener('click', function () {
      var cfg = UNIT_CONFIG[unit];
      count = clampCount(count - cfg.step, cfg);
      render();
    });
    $('inc').addEventListener('click', function () {
      var cfg = UNIT_CONFIG[unit];
      count = clampCount(count + cfg.step, cfg);
      render();
    });
    $('count').addEventListener('input', function () {
      var cfg = UNIT_CONFIG[unit];
      var parsed = Number(this.value);
      if (!isFinite(parsed)) return;
      count = clampCount(parsed, cfg);
      render();
    });
    Array.prototype.forEach.call(
      document.querySelectorAll('.preset'),
      function (b) {
        b.addEventListener('click', function () {
          count = Number(b.dataset.n);
          render();
        });
      }
    );

    $('copy').addEventListener('click', function () {
      var btn = $('copy');
      var text = $('output').value;
      function done() {
        btn.textContent = '✓ Copied';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 1500);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        $('output').select();
        try {
          document.execCommand('copy');
        } catch (e) {}
        done();
      }
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
