const params = new URLSearchParams(location.search);
const requested = params.get('user') || 'redeyesdarknessmetaldrago';
const jsonBase = 'data/json/';

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );

function wdlCounts(s) {
  return `<span class="w">${s.wins}W</span>
    <span class="d">${s.draws}D</span>
    <span class="l">${s.losses}L</span>`;
}

function personBox(label, o, tag) {
  if (!o) return `<div class="stat-box"><div class="label">${esc(label)}</div><div class="big"><span class="sub">—</span></div></div>`;
  const s = { games: o.games, wins: o.wins, draws: o.draws, losses: o.losses, score: o.score };
  const t = s.games || 1;
  const tagHtml = tag ? `<span class="tag ${tag.cls}">${tag.txt}</span>` : '';
  return `<div class="stat-box">
  <div class="label">${esc(label)}${tagHtml}</div>
  <div class="opp-cell" style="margin:2px 0 4px">
    ${o.avatar ? `<img src="${esc(o.avatar)}" alt="" loading="lazy" />` : ''}
    <a href="https://www.chess.com/member/${encodeURIComponent(o.opponent)}" target="_blank" rel="noopener noreferrer" style="font-size:1.0625rem;font-weight:600">${esc(o.opponent)}</a>
  </div>
  <div class="wdl">${wdlCounts(s)}</div>
  <div class="bar"><div>
    <div class="bw" style="width:${(s.wins / t) * 100}%"></div>
    <div class="bd" style="width:${(s.draws / t) * 100}%"></div>
    <div class="bl" style="width:${(s.losses / t) * 100}%"></div>
  </div></div>
  <div class="sub" style="margin-top:6px">${s.games} games · score ${(s.score * 100).toFixed(1)}%</div>
</div>`;
}

function sortedRows(rows, sort, valFn) {
  if (!sort.key) return rows;
  const f = valFn[sort.key];
  return [...rows].sort((a, b) => {
    const x = f(a);
    const y = f(b);
    const c = typeof x === 'string' ? x.localeCompare(y) : x - y;
    return c * sort.dir;
  });
}

function thSort(id, key, sort, label) {
  const arrow = sort.key === key ? (sort.dir > 0 ? ' ▲' : ' ▼') : '';
  return `<th class="sortable" onclick="${id}('${key}')">${esc(
    label
  )}${arrow}</th>`;
}

function avatarCell(o) {
  const inner = o.avatar
    ? `<img src="${esc(o.avatar)}" alt="" loading="lazy" />`
    : '<span class="ph"></span>';
  return `<span class="opp-cell">${inner}<span>${esc(o.opponent)}</span></span>`;
}

const oppVal = {
  opponent: (o) => o.opponent.toLowerCase(),
  title: (o) => (o.title || '').toLowerCase(),
  games: (o) => o.games,
  wins: (o) => o.wins,
  draws: (o) => o.draws,
  losses: (o) => o.losses,
  score: (o) => o.score,
  first: (o) => o.first_date,
  last: (o) => o.last_date,
};
const oppHeads = [
  ['opponent', 'Opponent'],
  ['title', 'Title'],
  ['games', 'Games'],
  ['wins', 'W'],
  ['draws', 'D'],
  ['losses', 'L'],
  ['score', 'Score'],
  ['first', 'First'],
  ['last', 'Last'],
];
const headRow = (fn, sort) =>
  oppHeads.map(([k, l]) => thSort(fn, k, sort, l)).join('');

const memberUrl = (u) =>
  `https://www.chess.com/member/${encodeURIComponent(u)}`;

const oppRow = (o) => `<tr><td>${avatarCell(o)}</td>
    <td>${esc(o.title || '')}</td><td>${o.games}</td>
    <td class="w">${o.wins}</td><td class="d">${o.draws}</td>
    <td class="l">${o.losses}</td>
    <td class="score">${(o.score * 100).toFixed(0)}%</td>
    <td>${esc(o.first_date)}</td><td>${esc(o.last_date)}</td></tr>`;

function render(d) {
  const p = d.player || {};
  const name = esc(p.name || d.username);
  const nameHtml = p.url
    ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${name}</a>`
    : name;
  document.getElementById('pname').innerHTML = `${nameHtml} <span class="sub">Rivalries</span>`;
  const gen = new Date(d.generated_at);
  const genStr =
    gen.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }) +
    ', ' +
    gen.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }) +
    ' UTC';
  document.getElementById('pgen').innerHTML =
    `<a href="https://github.com/hieudoanm/hieudoanm/blob/master/page/chess/rivalries/rivalries.py" target="_blank" rel="noopener noreferrer">Generated</a> at ${genStr}`;
  if (p.avatar) {
    const a = document.getElementById('avatar');
    a.src = p.avatar;
    a.hidden = false;
  }

  const most = d.most || [];
  const best = d.best || [];
  const worst = d.worst || [];
  const minGames = d.min_games || 5;

  const boxes = [
    personBox('Most played', d.most_played),
    personBox('Dead heat', d.dead_heat, { cls: 'tag-rival', txt: 'rival' }),
    personBox('Beat me most', d.beat_me_most),
  ];

  const sortMost = { key: 'games', dir: -1 };
  const sortBest = { key: 'score', dir: -1 };
  const sortWorst = { key: 'score', dir: 1 };

  function doSort(sort, key, tbodyId, tableId, sortFn, rows) {
    if (sort.key === key) sort.dir *= -1;
    else {
      sort.key = key;
      sort.dir = typeof oppVal[key](rows[0]) === 'string' ? 1 : -1;
    }
    document.getElementById(tbodyId).innerHTML = sortedRows(rows, sort, oppVal)
      .map(oppRow)
      .join('');
    document.querySelector(`#${tableId} thead tr`).innerHTML = headRow(sortFn, sort);
  }
  window.sortMost = (key) => doSort(sortMost, key, 'mostBody', 'mostTable', 'sortMost', most);
  window.sortBest = (key) => doSort(sortBest, key, 'bestBody', 'bestTable', 'sortBest', best);
  window.sortWorst = (key) => doSort(sortWorst, key, 'worstBody', 'worstTable', 'sortWorst', worst);

  document.getElementById('main').innerHTML = `
<div class="stats-row">${boxes.join('')}</div>
<div class="grid">
  <div class="card full"><h2>I play the most against (top ${most.length})</h2>
    <div class="scroll"><table id="mostTable">
    <thead><tr>${headRow('sortMost', sortMost)}</tr></thead>
    <tbody id="mostBody">${sortedRows(most, sortMost, oppVal)
      .map(oppRow)
      .join('')}</tbody>
    </table></div></div>
  <div class="card full"><h2>I score against them most (top ${best.length}, min ${minGames} games)</h2>
    <div class="scroll"><table id="bestTable">
    <thead><tr>${headRow('sortBest', sortBest)}</tr></thead>
    <tbody id="bestBody">${sortedRows(best, sortBest, oppVal)
      .map(oppRow)
      .join('')}</tbody>
    </table></div></div>
  <div class="card full"><h2>They score against me most (top ${worst.length}, min ${minGames} games)</h2>
    <div class="scroll"><table id="worstTable">
    <thead><tr>${headRow('sortWorst', sortWorst)}</tr></thead>
    <tbody id="worstBody">${sortedRows(worst, sortWorst, oppVal)
      .map(oppRow)
      .join('')}</tbody>
    </table></div></div>
</div>`;
}

async function discoverUsers() {
  try {
    const r = await fetch(jsonBase);
    if (!r.ok) return;
    const html = await r.text();
    const users = [...html.matchAll(/href="([a-z0-9_]+)_rivalries\.json"/gi)].map(
      (m) => m[1].toLowerCase()
    );
    const sel = document.getElementById('usersel');
    if (users.length > 1) {
      sel.innerHTML = users
        .map(
          (u) => `<option ${u === requested ? 'selected' : ''}>${u}</option>`
        )
        .join('');
      sel.hidden = false;
      sel.onchange = () => {
        location.search = '?user=' + sel.value;
      };
    }
  } catch (_) {}
}

(async () => {
  discoverUsers();
  try {
    const r = await fetch(jsonBase + requested + '_rivalries.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    render(await r.json());
  } catch (e) {
    document.getElementById('main').innerHTML =
      `<div class="err">Could not load <code>${jsonBase}${requested}_rivalries.json</code><br>
     ${esc(e.message)} — serve this folder over HTTP, e.g.<br>
     <code>cd page/chess/rivalries && python3 -m http.server 8000</code></div>`;
  }
})();
