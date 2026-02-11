const dataBase = 'data/downloads.json';
const APPS_BASE = 'https://hieudoanm.github.io';
const main = document.getElementById('main');
const summary = document.getElementById('summary');
const filter = document.getElementById('filter');

let downloads = [];

const APP_NAMES = {
  api: 'API',
  backers: 'Backers',
  browsers: 'Browsers',
  chess: 'Chess',
  fdr: 'Food & Drink',
  linguae: 'Linguae',
  mars: 'Mars',
  markers: 'Markers',
  monkey: 'Monkey',
  'neuro.imagers': 'Neuro Imagers',
  resume: 'Resume',
  tracers: 'Tracers',
  transcribers: 'Transcribers',
  vectors: 'Vectors',
};
const appName = (app) => APP_NAMES[app] || app;

function fileName(url) {
  return decodeURIComponent(url.split('/download/').pop());
}

function formatSize(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}
const lower = (url) => fileName(url).toLowerCase();

function groupByApp(list) {
  const apps = new Map();
  for (const l of list) {
    if (!apps.has(l.app)) apps.set(l.app, []);
    apps.get(l.app).push(l);
  }
  return [...apps.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

// ---- matrix tables: rows = apps, columns = platform buckets ----

const CLI_COLS = [
  {
    label: 'macOS (Silicon)',
    test: (f) =>
      f.startsWith('cli-') &&
      f.includes('apple-darwin') &&
      f.includes('aarch64'),
  },
  {
    label: 'macOS (Intel)',
    test: (f) =>
      f.startsWith('cli-') &&
      f.includes('apple-darwin') &&
      !f.includes('aarch64') &&
      !f.includes('arm64'),
  },
  {
    label: 'Linux',
    test: (f) => f.startsWith('cli-') && f.includes('linux-gnu'),
  },
  {
    label: 'Windows',
    test: (f) => f.startsWith('cli-') && f.includes('windows-msvc'),
  },
];

const isAppleDesktop = (f) =>
  /\.(dmg|app\.zip|pkg)$/.test(f) || f.includes('apple-darwin');
const DESKTOP_COLS = [
  {
    label: 'Apple Silicon',
    test: (f) => isAppleDesktop(f) && f.includes('aarch64'),
  },
  {
    label: 'Apple Intel',
    test: (f) =>
      isAppleDesktop(f) && !f.includes('aarch64') && !f.includes('arm64'),
  },
  {
    label: 'Linux',
    test: (f) =>
      /\.(deb|rpm|appimage)$/.test(f) ||
      (f.includes('linux') && !f.startsWith('cli-')),
  },
  {
    label: 'Windows',
    test: (f) => /\.(msi|exe)$/.test(f) && !f.startsWith('cli-'),
  },
];

const EXT_COLS = [
  { label: 'VS Code', test: (f) => f.endsWith('.vsix') },
  { label: 'Zed', test: (f) => f.includes('zed') },
  {
    label: 'JetBrains',
    test: (f) => f.includes('jetbrains') || f.includes('intellij'),
  },
];

const isBrowserExt = (f) =>
  /\.(crx|xpi)$/.test(f) ||
  f.includes('extension-browser') ||
  f.includes('chrome') ||
  f.includes('firefox');

const BROWSER_COLS = [
  { label: 'Chrome', test: (f) => f.endsWith('.crx') },
  { label: 'Firefox', test: (f) => f.endsWith('.xpi') },
  { label: 'Source', test: (f) => !f.endsWith('.crx') && !f.endsWith('.xpi') },
];

const isExtension = (f) =>
  f.includes('extension') ||
  f.endsWith('.vsix') ||
  f.includes('zed') ||
  f.includes('jetbrains') ||
  f.includes('intellij') ||
  /\.(crx|xpi)$/.test(f) ||
  f.includes('chrome') ||
  f.includes('firefox');
const isDesktop = (f) =>
  !f.startsWith('cli-') &&
  (/^desktop-/.test(f) ||
    /\.(dmg|msi|exe|deb|rpm|appimage|pkg)$/.test(f) ||
    f.endsWith('.app.zip'));

function fileExt(url) {
  const fn = fileName(url);
  const lowerFn = fn.toLowerCase();
  if (lowerFn.endsWith('.app.zip')) return '.app.zip';
  if (lowerFn.endsWith('.appimage')) return '.AppImage';
  const m = fn.match(/\.(tar\.gz|[a-z0-9]{1,5})$/i);
  return m ? m[0].toLowerCase() : fn;
}

function cliLabel(url) {
  const f = lower(url);
  if (f.includes('apple-darwin'))
    return f.includes('aarch64') || f.includes('arm64')
      ? 'CLI for Apple (Silicon)'
      : 'CLI for Apple (Intel)';
  if (f.includes('linux')) return 'CLI for Linux';
  if (f.includes('windows')) return 'CLI for Windows';
  return 'CLI';
}

function browserLabel(url) {
  const fn = fileName(url);
  const v = fn.match(/-v(\d+)[.-]/);
  const ext = fileExt(url);
  return v ? `v${v[1]}${ext}` : ext;
}

function cellFor(links, test, labelFn = fileName) {
  const matches = links.filter((l) => test(lower(l.url)));
  if (!matches.length) return '<td class="na">—</td>';
  matches.sort((a, b) => {
    const sa = lower(a.url).includes('aarch64') ? 0 : 1;
    const sb = lower(b.url).includes('aarch64') ? 0 : 1;
    return sa - sb;
  });
  return `<td class="dl">${matches
    .map((m) => {
      const size = formatSize(m.size);
      const label = labelFn(m.url);
      const link = `<a href="${m.url}" target="_blank" rel="noopener noreferrer" title="${fileName(m.url)}${size ? ` — ${size}` : ''}">${label}</a>`;
      return size ? `${link}<br><span class="size">(${size})</span>` : link;
    })
    .join('<br>')}</td>`;
}

function matrixTable(title, links, cols, { labelFn } = {}) {
  const apps = groupByApp(links);
  if (!apps.length) return '';
  const rows = apps
    .map(([app, appLinks], i) => {
      const cells = cols
        .map((c) => cellFor(appLinks, c.test, labelFn))
        .join('');
      return `
      <tr>
        <td class="no">${i + 1}</td>
        <td class="app-cell"><a href="${APPS_BASE}/${app}/downloads/" target="_blank" rel="noopener noreferrer">${appName(app)}</a></td>
        ${cells}
      </tr>`;
    })
    .join('');
  return `
    <h2 class="section-title">${title} <span class="count">${apps.length} apps</span></h2>
    <table class="dl-table">
      <thead>
        <tr><th>No.</th><th>App</th>${cols.map((c) => `<th>${c.label}</th>`).join('')}</tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function otherTable(links) {
  if (!links.length) return '';
  const rows = [];
  let no = 0;
  for (const [app, files] of groupByApp(links)) {
    for (const f of files) {
      const fn = fileName(f.url);
      rows.push(`
      <tr>
        <td class="no">${++no}</td>
        <td class="app-cell"><a href="${APPS_BASE}/${app}/downloads/" target="_blank" rel="noopener noreferrer">${appName(app)}</a></td>
        <td class="file"><a href="${f.url}" target="_blank" rel="noopener noreferrer" title="${fn}">${fn}</a></td>
        <td class="platform">${f.platform}</td>
        <td class="size">${formatSize(f.size)}</td>
      </tr>`);
    }
  }
  return `
    <h2 class="section-title">Other files <span class="count">${links.length}</span></h2>
    <table class="dl-table">
      <thead>
        <tr><th>No.</th><th>App</th><th>File</th><th>Platform</th><th>Size</th></tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>`;
}

function render(list) {
  const cli = list.filter((l) => lower(l.url).startsWith('cli-'));
  const desktop = list.filter(
    (l) =>
      !lower(l.url).startsWith('cli-') &&
      isDesktop(lower(l.url)) &&
      !isExtension(lower(l.url))
  );
  const ext = list.filter(
    (l) => isExtension(lower(l.url)) && !isBrowserExt(lower(l.url))
  );
  const browser = list.filter((l) => isBrowserExt(lower(l.url)));
  const other = list.filter((l) => {
    const f = lower(l.url);
    return (
      !f.startsWith('cli-') &&
      !isDesktop(f) &&
      !isExtension(f) &&
      !isBrowserExt(f)
    );
  });

  main.innerHTML =
    matrixTable('CLI', cli, CLI_COLS, { labelFn: cliLabel }) +
      matrixTable('Desktop apps', desktop, DESKTOP_COLS, { labelFn: fileExt }) +
      matrixTable('Editor extensions', ext, EXT_COLS, { labelFn: fileExt }) +
      matrixTable('Browser extensions', browser, BROWSER_COLS, {
        labelFn: browserLabel,
      }) +
      otherTable(other) ||
    '<div class="err">No downloads match your filter.</div>';
}

function applyFilter() {
  const q = filter.value.trim().toLowerCase();
  if (!q) {
    render(downloads);
    return;
  }
  render(
    downloads.filter(
      (l) =>
        l.app.toLowerCase().includes(q) ||
        fileName(l.url).toLowerCase().includes(q)
    )
  );
}

filter.addEventListener('input', applyFilter);

fetch(dataBase)
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((data) => {
    downloads = data;
    const apps = new Set(data.map((l) => l.app)).size;
    summary.textContent = `${data.length} files across ${apps} apps — latest release assets`;
    render(data);
  })
  .catch((e) => {
    summary.textContent = 'Failed to load downloads.json';
    main.innerHTML = `<div class="err">Could not load <code>${dataBase}</code><br>${e.message}<br>Regenerate it with <code>page/downloads/fetch.py</code>.</div>`;
  });
