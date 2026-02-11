/* Status — live third-party service status via statuspage.io-style JSON APIs.
   Classic script (no modules) so it works over file://. */
(function () {
  'use strict';

  var REFRESH_MS = 2 * 60 * 1000;
  var FETCH_TIMEOUT_MS = 10000;

  // category -> service name -> status API URL
  var SERVICES = {
    atlassian: {
      analytics: 'https://analytics.status.atlassian.com/api/v2/status.json',
      atlas: 'https://atlas.status.atlassian.com/api/v2/status.json',
      compass: 'https://compass.status.atlassian.com/api/v2/status.json',
      confluence: 'https://confluence.status.atlassian.com/api/v2/status.json',
      developer: 'https://developer.status.atlassian.com/api/v2/status.json',
      'jira-service-management':
        'https://jira-service-management.status.atlassian.com/api/v2/status.json',
      'jira-software': 'https://jira-software.status.atlassian.com/api/v2/status.json',
      guard: 'https://guard.status.atlassian.com/api/v2/status.json',
      opsgenie: 'https://opsgenie.status.atlassian.com/api/v2/status.json',
      partners: 'https://partners.status.atlassian.com/api/v2/status.json',
      support: 'https://support.status.atlassian.com/api/v2/status.json',
      trello: 'https://trello.status.atlassian.com/api/v2/status.json',
    },
    'serverless': {
      supabase: 'https://status.supabase.com/api/v2/status.json',
      render: 'https://status.render.com/api/v2/status.json',
      flyio: 'https://status.flyio.net/api/v2/status.json',
      cloudflare: 'https://www.cloudflarestatus.com/api/v2/status.json',
      netlify: 'https://www.netlifystatus.com/api/v2/status.json',
      vercel: 'https://www.vercel-status.com/api/v2/status.json',
    },
    crypto: {
      hedera: 'https://status.hedera.com/api/v2/status.json',
      solana: 'https://status.solana.com/api/v2/status.json',
      polygon: 'https://status.polygon.technology/api/v2/status.json',
    },
    'version control': {
      bitbucket: 'https://bitbucket.status.atlassian.com/api/v2/status.json',
      github: 'https://www.githubstatus.com/api/v2/status.json',
      npm: 'https://status.npmjs.org/api/v2/status.json',
    },
  };

  // statuspage.io indicator -> display state
  var INDICATOR_STATE = {
    none: 'ok',
    minor: 'degraded',
    major: 'outage',
    critical: 'outage',
    maintenance: 'maintenance',
  };

  var state = {}; // service name -> { state, description, url, fetchedAt }
  var query = '';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function totalServices() {
    return Object.keys(SERVICES).reduce(function (n, c) {
      return n + Object.keys(SERVICES[c]).length;
    }, 0);
  }

  function fetchStatus(name, url) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl
      ? setTimeout(function () {
          ctrl.abort();
        }, FETCH_TIMEOUT_MS)
      : null;
    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var indicator =
          data && data.status && data.status.indicator ? data.status.indicator : '';
        state[name] = {
          state: INDICATOR_STATE[indicator] || 'unknown',
          description:
            data && data.status && data.status.description
              ? data.status.description
              : '',
          url:
            data && data.page && data.page.url ? data.page.url : url,
          fetchedAt: Date.now(),
        };
      })
      .catch(function () {
        state[name] = {
          state: 'unknown',
          description: 'status unavailable',
          url: url,
          fetchedAt: Date.now(),
        };
      })
      .then(function () {
        if (timer) clearTimeout(timer);
        render();
      });
  }

  function refreshAll() {
    var jobs = [];
    Object.keys(SERVICES).forEach(function (category) {
      Object.keys(SERVICES[category]).forEach(function (name) {
        jobs.push(fetchStatus(name, SERVICES[category][name]));
      });
    });
    return Promise.all(jobs);
  }

  function matches(name, category) {
    if (!query) return true;
    var q = query.toLowerCase();
    return name.toLowerCase().indexOf(q) !== -1 || category.toLowerCase().indexOf(q) !== -1;
  }

  function renderSummary() {
    var root = document.getElementById('summary');
    root.replaceChildren();
    var counts = { ok: 0, degraded: 0, outage: 0, maintenance: 0, pending: 0, unknown: 0 };
    Object.keys(state).forEach(function (name) {
      var s = state[name].state;
      counts[s] = (counts[s] || 0) + 1;
    });
    var pending = totalServices() - Object.keys(state).length;
    counts.pending = pending > 0 ? pending : 0;

    [
      ['ok', 'Operational'],
      ['degraded', 'Degraded'],
      ['outage', 'Outage'],
      ['maintenance', 'Maintenance'],
      ['pending', 'Checking'],
      ['unknown', 'Unknown'],
    ].forEach(function (pair) {
      var key = pair[0];
      if (!counts[key]) return;
      var chip = el('span', 'chip');
      chip.appendChild(el('span', 'dot ' + key));
      chip.appendChild(el('span', '', pair[1]));
      chip.appendChild(el('span', 'n', String(counts[key])));
      root.appendChild(chip);
    });
  }

  function renderGroups() {
    var root = document.getElementById('groups');
    root.replaceChildren();
    var shown = 0;

    Object.keys(SERVICES).forEach(function (category) {
      var entries = Object.keys(SERVICES[category]).filter(function (name) {
        return matches(name, category);
      });
      if (!entries.length) return;
      shown += entries.length;

      var group = el('section', 'group');
      group.appendChild(el('h2', '', category));
      var rows = el('div', 'rows');

      entries.forEach(function (name) {
        var s = state[name] || { state: 'pending', description: '', url: SERVICES[category][name] };
        var row = el('div', 'row');
        row.appendChild(el('span', 'dot ' + s.state));
        var link = el('a', 'name', name.replace(/-/g, ' '));
        link.href = s.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        row.appendChild(link);
        if (s.description) row.appendChild(el('span', 'desc', s.description));
        rows.appendChild(row);
      });

      group.appendChild(rows);
      root.appendChild(group);
    });

    document.getElementById('empty').hidden = shown !== 0;
  }

  function render() {
    renderSummary();
    renderGroups();

    var fetched = Object.keys(state).length;
    var stamp = fetched
      ? 'updated ' +
        new Date(
          Math.max.apply(
            null,
            Object.keys(state).map(function (k) {
              return state[k].fetchedAt;
            }),
          ),
        ).toLocaleTimeString()
      : '';
    document.getElementById('updated').textContent = stamp;
    document.getElementById('foot-count').textContent =
      fetched + ' / ' + totalServices() + ' services · ' + REFRESH_MS / 60000 + ' min refresh';
  }

  function init() {
    var search = document.getElementById('search');
    search.addEventListener('input', function () {
      query = search.value.trim();
      renderGroups();
    });

    document.getElementById('refresh').addEventListener('click', function () {
      refreshAll();
    });

    render();
    refreshAll();
    setInterval(refreshAll, REFRESH_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
