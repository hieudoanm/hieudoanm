/* Renders the project listings on this page. Classic script (no modules)
   so it also works over file://. */
(function () {
  'use strict';

  var APPS = [
    {
      slug: 'api',
      title: 'API',
      imgAlt: 'API screenshot',
      desc: 'Convert OpenAPI 3.x specs into ready-to-import collections for Postman, Bruno, Insomnia, and 7 more clients.',
      url: 'https://hieudoanm.github.io/api/',
      repo: 'https://github.com/hieudoanm/api',
    },
    {
      slug: 'backers',
      title: 'Backers',
      imgAlt: 'Backers screenshot',
      desc: 'Back-end as a Service — auth, database, realtime, webhooks and MCP in one Rust binary.',
      url: 'https://hieudoanm.github.io/backers/',
      repo: 'https://github.com/hieudoanm/backers',
    },
    {
      slug: 'browsers',
      title: 'Browsers',
      imgAlt: 'Browsers screenshot',
      desc: 'A Servo-powered browser runtime as a library, CLI, and HTTP server — headless screenshots, scraping, and MCP tools.',
      url: 'https://hieudoanm.github.io/browsers/',
      repo: 'https://github.com/hieudoanm/browsers',
    },
    {
      slug: 'chess',
      title: 'Chess',
      imgAlt: 'Chess screenshot',
      desc: 'UCI chess engine in Rust — alpha-beta search, NNUE evaluation, and an MCP server.',
      url: 'https://hieudoanm.github.io/chess/',
      repo: 'https://github.com/hieudoanm/chess',
    },
    {
      slug: 'design.system.design',
      title: 'Design (System) Design',
      imgAlt: 'Design System Design screenshot',
      desc: 'A design system monorepo for consistent, accessible UI components.',
      url: 'https://hieudoanm.github.io/design.system.design/',
      repo: 'https://github.com/hieudoanm/design.system.design',
    },
    {
      slug: 'fdr',
      title: 'Food & Drink',
      imgAlt: 'Food & Drink screenshot',
      desc: 'A fast food-picker: country wheel, dish reel, menus, and weekly schedules.',
      url: 'https://hieudoanm.github.io/fdr/',
      repo: 'https://github.com/hieudoanm/fdr',
    },
    {
      slug: 'fr55',
      title: 'Forerunner 55',
      imgAlt: 'Forerunner 55 screenshot',
      desc: 'Connect IQ watch faces for the Garmin Forerunner 55.',
      url: 'https://hieudoanm.github.io/fr55/',
      repo: 'https://github.com/hieudoanm/fr55',
    },
    {
      slug: 'linguae',
      title: 'Linguae',
      imgAlt: 'Linguae screenshot',
      desc: 'Detect the language of text with a local character-level model.',
      url: 'https://hieudoanm.github.io/linguae/',
      repo: 'https://github.com/hieudoanm/linguae',
    },
    {
      slug: 'mars',
      title: 'Mars',
      imgAlt: 'Mars screenshot',
      desc: 'Interactive computing platform in Rust — notebooks, six language runtimes, and a machine-learning studio.',
      url: 'https://hieudoanm.github.io/mars/',
      repo: 'https://github.com/hieudoanm/mars',
    },
    {
      slug: 'markers',
      title: 'Markers',
      imgAlt: 'Markers screenshot',
      desc: 'Rust static site generator plus a GROBID PDF-to-Markdown pipeline — searchable corpus, MCP server, and Tauri desktop app.',
      url: 'https://hieudoanm.github.io/markers/',
      repo: 'https://github.com/hieudoanm/markers',
    },
    {
      slug: 'monkey',
      title: 'Monkey',
      imgAlt: 'Monkey screenshot',
      desc: 'Rust-powered toolchain for Garmin Connect IQ and Monkey C — formatter, linter, parser, CLI, and editor extensions.',
      url: 'https://hieudoanm.github.io/monkey/',
      repo: 'https://github.com/hieudoanm/monkey',
    },
    {
      slug: 'neo.bank',
      title: 'NEO Bank',
      imgAlt: 'NEO Bank screenshot',
      desc: 'Full-stack banking demo: Go microservices, Cassandra, Kafka, React.',
      url: 'https://hieudoanm.github.io/neo.bank/',
      repo: 'https://github.com/hieudoanm/neo.bank',
    },
    {
      slug: 'neuro.imagers',
      title: 'Neuroimager',
      imgAlt: 'Neuroimager screenshot',
      desc: 'Local-first desktop workspace for EEG, MEG, and MRI research data.',
      url: 'https://hieudoanm.github.io/neuro.imagers/',
      repo: 'https://github.com/hieudoanm/neuro.imagers',
    },
    {
      slug: 'resume',
      title: 'Resume',
      imgAlt: 'Resume screenshot',
      desc: 'Rust CLI that renders YAML resumes to Markdown, HTML, and PDF — plus a browser resume editor on GitHub Pages.',
      url: 'https://hieudoanm.github.io/resume/',
      repo: 'https://github.com/hieudoanm/resume',
    },
    {
      slug: 'tracers',
      title: 'Tracers',
      imgAlt: 'Tracers screenshot',
      desc: 'High-performance, multi-language code intelligence and graph analysis.',
      url: 'https://hieudoanm.github.io/tracers/',
      repo: 'https://github.com/hieudoanm/tracers',
      ci: 'ci.yml',
    },
    {
      slug: 'transcribers',
      title: 'Transcribers',
      imgAlt: 'Transcribers screenshot',
      desc: 'Extract transcripts from video and audio locally with ffmpeg and whisper.cpp.',
      url: 'https://hieudoanm.github.io/transcribers/',
      repo: 'https://github.com/hieudoanm/transcribers',
    },
    {
      slug: 'vectors',
      title: 'Vectors',
      imgAlt: 'Vectors screenshot',
      desc: 'Turn PNG and JPEG images into clean SVG paths — entirely offline.',
      url: 'https://hieudoanm.github.io/vectors/',
      repo: 'https://github.com/hieudoanm/vectors',
    },
  ];

  var CONTRIB = {
    slug: 'opensesame',
    title: 'OpenSesame',
    about: 'Open-source experiment builder for psychology and neuroscience',
    prs: [
      {
        label: 'PR #837',
        url: 'https://github.com/open-cogsci/OpenSesame/pull/837',
        text: '— added a macOS installer script for Apple Silicon',
      },
      {
        label: 'PR #838',
        url: 'https://github.com/open-cogsci/OpenSesame/pull/838',
        text: '— fixed the help extension/plugin commands in the embedded browser',
      },
      {
        label: 'PR #839',
        url: 'https://github.com/open-cogsci/OpenSesame/pull/839',
        text: '— added GitHub Actions CI: pytest matrix and codespell',
      },
    ],
  };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function extLink(className, href, text) {
    var a = el('a', className, text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  function radio(id, name) {
    var input = document.createElement('input');
    input.className = 'sr-only';
    input.type = 'checkbox';
    input.name = name;
    input.id = id;
    return input;
  }

  function badge(href, imgSrc, alt) {
    var a = extLink('card-badge', href, '');
    var img = document.createElement('img');
    img.className = 'card-badge-img';
    img.src = imgSrc;
    img.alt = alt;
    img.loading = 'lazy';
    a.appendChild(img);
    return a;
  }

  function appItem(app) {
    var li = document.createElement('li');
    li.appendChild(radio('acc-' + app.slug, 'acc-apps'));

    var card = el('div', 'card glass');
    var img = document.createElement('img');
    img.src = 'images/landing/' + app.slug + '.png';
    img.alt = app.imgAlt;
    img.width = 1280;
    img.height = 640;
    img.loading = 'lazy';
    card.appendChild(img);

    var body = el('span', 'card-body');
    var titleId = 'acc-' + app.slug;

    var wf = app.ci || 'ci.yaml';
    var badges = el('span', 'card-badges');
    badges.appendChild(
      badge(
        'https://github.com/hieudoanm/' +
          app.slug +
          '/actions/workflows/' +
          wf +
          '?branch=master&query=branch%3Amaster',
        'https://github.com/hieudoanm/' +
          app.slug +
          '/actions/workflows/' +
          wf +
          '/badge.svg?branch=master',
        app.title + ' CI status'
      )
    );
    badges.appendChild(
      badge(
        app.repo + '/blob/master/LICENSE',
        'https://img.shields.io/github/license/hieudoanm/' + app.slug,
        app.title + ' license'
      )
    );
    badges.appendChild(
      badge(
        app.repo,
        'https://img.shields.io/github/stars/hieudoanm/' + app.slug,
        app.title + ' stars'
      )
    );
    badges.appendChild(
      badge(
        app.repo + '/releases',
        'https://img.shields.io/github/v/release/hieudoanm/' + app.slug,
        app.title + ' latest release'
      )
    );
    body.appendChild(badges);

    var title = el('label', 'card-title', app.title);
    title.setAttribute('for', titleId);
    body.appendChild(title);
    body.appendChild(el('span', 'card-desc', app.desc));

    var actions = el('span', 'card-actions');
    actions.appendChild(extLink('visit', app.url, 'Visit site'));
    actions.appendChild(extLink('repo', app.repo, 'Source'));
    actions.appendChild(extLink('repo', app.repo + '/releases', 'Releases'));
    body.appendChild(actions);

    card.appendChild(body);
    li.appendChild(card);
    return li;
  }

  function contribItem(c) {
    var li = document.createElement('li');
    li.appendChild(radio('acc-' + c.slug, 'acc-contrib'));

    var card = el('div', 'card glass');
    var body = el('div', 'card-body');

    var head = el('div', 'card-head');
    var title = el('label', 'card-title', c.title);
    title.setAttribute('for', 'acc-' + c.slug);
    head.appendChild(title);
    head.appendChild(el('span', 'card-about', c.about));
    body.appendChild(head);

    var desc = el('div', 'card-desc');
    var list = document.createElement('ul');
    c.prs.forEach(function (pr) {
      var item = document.createElement('li');
      item.appendChild(extLink('', pr.url, pr.label));
      item.appendChild(document.createTextNode(' ' + pr.text));
      list.appendChild(item);
    });
    desc.appendChild(list);
    body.appendChild(desc);

    card.appendChild(body);
    li.appendChild(card);
    return li;
  }

  function render(id, items) {
    var list = document.getElementById(id);
    if (!list) return;
    list.replaceChildren.apply(list, items);
  }

  var countEl = document.getElementById('app-count');
  if (countEl) countEl.textContent = '(' + APPS.length + ')';

  var searchInput = document.getElementById('app-search');

  var contribHaystack =
    (CONTRIB.title + ' ' + CONTRIB.about + ' ' + CONTRIB.slug).toLowerCase() +
    CONTRIB.prs
      .map(function (pr) {
        return (pr.label + ' ' + pr.text).toLowerCase();
      })
      .join(' ');

  var minorItems = Array.prototype.slice.call(
    document.querySelectorAll('.minor-list li')
  );
  var miniCountEl = document.getElementById('mini-count');
  if (miniCountEl) miniCountEl.textContent = '(' + minorItems.length + ')';

  function appMatches(app, q) {
    var haystack = (app.title + ' ' + app.desc + ' ' + app.slug).toLowerCase();
    return haystack.indexOf(q) !== -1;
  }

  function sectionOf(listId) {
    var list = document.getElementById(listId);
    return list ? list.closest('section') : null;
  }

  function renderApps(q) {
    var list = document.getElementById('app-list');
    if (!list) return;
    var items = q
      ? APPS.filter(function (app) {
          return appMatches(app, q);
        })
      : APPS;
    if (items.length === 0) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No projects match "' + searchInput.value.trim() + '".';
      list.replaceChildren(li);
      return;
    }
    list.replaceChildren.apply(list, items.map(appItem));
  }

  function applySearch() {
    var q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    renderApps(q);

    // Open Contribution: single card, hide the whole section on no match.
    var contribSection = sectionOf('contrib-list');
    if (contribSection) {
      var showContrib = !q || contribHaystack.indexOf(q) !== -1;
      contribSection.hidden = !showContrib;
    }

    // Minor Apps: static list, filter items and hide section if none match.
    var minorSection = document.querySelector(
      'section[aria-labelledby="mini"]'
    );
    var minorVisible = 0;
    minorItems.forEach(function (li) {
      var show = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
      li.hidden = !show;
      if (show) minorVisible++;
    });
    if (minorSection) minorSection.hidden = q !== '' && minorVisible === 0;
  }

  if (searchInput) {
    searchInput.addEventListener('input', applySearch);
  }

  // Theme toggle — flips data-theme on <html>, persists to localStorage.
  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next =
        document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
      var meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#0f1115' : '#0d9488');
    });
  }

  // Glass mode toggle — flips data-glass on <html>, persists to localStorage.
  var glassToggle = document.getElementById('glass-toggle');
  if (glassToggle) {
    glassToggle.addEventListener('click', function () {
      var next =
        document.documentElement.dataset.glass === 'flat' ? 'liquid' : 'flat';
      document.documentElement.dataset.glass = next;
      try {
        localStorage.setItem('glass', next);
      } catch (e) {}
    });
  }

  // Liquid glass: animate the SVG turbulence for a subtle liquid shimmer and
  // track the pointer so the specular highlight follows the cursor.
  var glassNoise = document.getElementById('liquid-noise');
  var glassReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (glassNoise && !glassReduced) {
    var glassT0 = performance.now();
    (function animateGlass(now) {
      if (document.documentElement.dataset.glass === 'flat') {
        requestAnimationFrame(animateGlass);
        return;
      }
      var t = (now - glassT0) / 1000;
      glassNoise.setAttribute(
        'baseFrequency',
        (0.01 + Math.sin(t * 0.5) * 0.002).toFixed(4) +
          ' ' +
          (0.016 + Math.cos(t * 0.37) * 0.003).toFixed(4)
      );
      requestAnimationFrame(animateGlass);
    })(glassT0);
  }

  var glassPx = 0.5;
  var glassPy = 0.1;
  var glassRaf = null;
  window.addEventListener(
    'pointermove',
    function (e) {
      glassPx = e.clientX / window.innerWidth;
      glassPy = e.clientY / window.innerHeight;
      if (glassRaf) return;
      glassRaf = requestAnimationFrame(function () {
        glassRaf = null;
        var style = document.documentElement.style;
        style.setProperty('--px', (glassPx * 100).toFixed(1) + '%');
        style.setProperty('--py', (glassPy * 100).toFixed(1) + '%');
      });
    },
    { passive: true }
  );

  render('contrib-list', [contribItem(CONTRIB)]);
  applySearch();
})();
