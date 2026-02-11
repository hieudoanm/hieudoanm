/* Renders the project listings on this page. Classic script (no modules)
   so it also works over file://. */
(function () {
  'use strict';

  var APPS = [
    {
      slug: 'blazers',
      title: 'Blazers',
      imgAlt: 'Blazers screenshot',
      desc: 'Blazing fast Back-end as a Service — auth, database, realtime, webhooks and MCP in one Rust binary.',
      url: 'https://hieudoanm.github.io/blazers/',
      repo: 'https://github.com/hieudoanm/blazers',
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
      desc: 'Connect IQ watchfaces and Monkey C tooling for the Garmin Forerunner 55.',
      url: 'https://hieudoanm.github.io/fr55/',
      repo: 'https://github.com/hieudoanm/fr55',
    },
    {
      slug: 'grobid.rs',
      title: 'Grobid.rs',
      imgAlt: 'Grobid.rs screenshot',
      desc: 'Convert PDF articles to Markdown via GROBID TEI XML — locally.',
      url: 'https://hieudoanm.github.io/grobid.rs/',
      repo: 'https://github.com/hieudoanm/grobid.rs',
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
      slug: 'llm.rs',
      title: 'llm.rs',
      imgAlt: 'llm.rs screenshot',
      desc: 'Train ML models from CSV files and export portable ONNX models — all locally.',
      url: 'https://hieudoanm.github.io/llm.rs/',
      repo: 'https://github.com/hieudoanm/llm.rs',
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
      slug: 'neuro.lab',
      title: 'Neuroimaging Lab',
      imgAlt: 'Neuroimaging Lab screenshot',
      desc: 'Local-first desktop workspace for EEG, MEG, and MRI research data.',
      url: 'https://hieudoanm.github.io/neuro.lab/',
      repo: 'https://github.com/hieudoanm/neuro.lab',
    },
    {
      slug: 'pagers',
      title: 'Pagers',
      imgAlt: 'Pagers screenshot',
      desc: 'Rust static site generator — Markdown folder to clean-URL site with themes, a page-link graph, and Wikipedia import.',
      url: 'https://hieudoanm.github.io/pagers/',
      repo: 'https://github.com/hieudoanm/pagers',
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
    input.type = 'radio';
    input.name = name;
    input.id = id;
    return input;
  }

  function appItem(app) {
    var li = document.createElement('li');
    li.appendChild(radio('acc-' + app.slug, 'acc-apps'));

    var card = el('div', 'card');
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
    var badge = extLink(
      'ci-badge',
      'https://github.com/hieudoanm/' +
        app.slug +
        '/actions/workflows/' +
        wf +
        '?branch=master&query=branch%3Amaster',
      ''
    );
    var badgeImg = document.createElement('img');
    badgeImg.className = 'ci-badge-img';
    badgeImg.src =
      'https://github.com/hieudoanm/' +
      app.slug +
      '/actions/workflows/' +
      wf +
      '/badge.svg?branch=master';
    badgeImg.alt = app.title + ' CI status';
    badgeImg.loading = 'lazy';
    badge.appendChild(badgeImg);
    body.appendChild(badge);

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

    var card = el('div', 'card');
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

  render('contrib-list', [contribItem(CONTRIB)]);
  render('app-list', APPS.map(appItem));
})();
