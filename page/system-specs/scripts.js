/* System Specs — client-side device/browser detection.
   Classic script (no modules) so it works over file://. */
(function () {
  'use strict';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function fmtBytes(bytes) {
    if (bytes == null) return '—';
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = 0;
    var v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return v.toFixed(v >= 10 || i === 0 ? 0 : 1) + ' ' + units[i];
  }

  function detectBrowser(ua) {
    var m;
    if ((m = ua.match(/Edg\/(\d+)/))) return { name: 'Edge', version: m[1] };
    if ((m = ua.match(/OPR\/(\d+)/))) return { name: 'Opera', version: m[1] };
    if ((m = ua.match(/Firefox\/(\d+)/))) return { name: 'Firefox', version: m[1] };
    if ((m = ua.match(/Chrome\/(\d+)/))) return { name: 'Chrome', version: m[1] };
    if ((m = ua.match(/Version\/(\d+).*Safari/))) return { name: 'Safari', version: m[1] };
    return { name: 'Unknown', version: '—' };
  }

  function detectOS(ua) {
    if (/Windows NT/.test(ua)) return 'Windows';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
  }

  function webglInfo() {
    try {
      var canvas = document.createElement('canvas');
      var gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return { vendor: '—', renderer: '—', version: '—' };
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      var renderer = dbg
        ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER);
      var vendor = dbg
        ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)
        : gl.getParameter(gl.VENDOR);
      var version = gl.getParameter(gl.VERSION) || '';
      return { vendor: vendor || '—', renderer: renderer || '—', version: version.split(' ')[0] };
    } catch (e) {
      return { vendor: '—', renderer: '—', version: '—' };
    }
  }

  function box(label, value, extraClass) {
    var b = el('div', 'stat-box' + (extraClass ? ' ' + extraClass : ''));
    b.appendChild(el('div', 'label', label));
    b.appendChild(el('div', 'value' + (extraClass === 'wide' ? ' wide' : ''), value));
    return b;
  }

  function group(title, boxes) {
    var g = el('section', 'group');
    g.appendChild(el('h2', '', title));
    var grid = el('div', 'stats-grid');
    boxes.forEach(function (b) {
      grid.appendChild(b);
    });
    g.appendChild(grid);
    return g;
  }

  function render(sync) {
    var root = document.getElementById('groups');
    root.replaceChildren();

    var ua = navigator.userAgent;
    var browser = detectBrowser(ua);
    var os = detectOS(ua);
    var gl = webglInfo();
    var conn = navigator.connection || {};
    var coarse = window.matchMedia('(pointer: coarse)').matches;

    var deviceBoxes = [
      box('Device Type', coarse ? 'Mobile / Tablet' : 'Desktop'),
      box('Operating System', os),
      box('Browser', browser.name),
      box('Browser Version', browser.version),
      box('Engine', /AppleWebKit/.test(ua) ? 'WebKit (Blink)' : /Gecko/.test(ua) ? 'Gecko' : '—'),
      box('User Agent', ua, 'wide'),
    ];

    var displayBoxes = [
      box('Screen Resolution', screen.width + ' × ' + screen.height),
      box('Viewport Size', window.innerWidth + ' × ' + window.innerHeight),
      box('Pixel Ratio', window.devicePixelRatio || 1),
      box('Color Depth', (screen.colorDepth || 0) + '-bit'),
      box('Orientation', screen.orientation ? screen.orientation.type : '—'),
      box('Touch Points', navigator.maxTouchPoints || 0),
    ];

    var hwBoxes = [
      box('CPU Cores', navigator.hardwareConcurrency || '—'),
      box('Device Memory', navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '—'),
      box('GPU Vendor', gl.vendor),
      box('GPU Renderer', gl.renderer, 'wide'),
      box('WebGL Version', gl.version),
    ];

    var netBoxes = [
      box('Online', navigator.onLine ? 'Yes' : 'No'),
      box('Connection Type', conn.effectiveType || '—'),
      box('Downlink', conn.downlink ? conn.downlink + ' Mbps' : '—'),
      box('RTT Latency', conn.rtt != null ? conn.rtt + ' ms' : '—'),
      box('Data Saver', conn.saveData ? 'On' : 'Off'),
    ];

    var groups = [
      group('Device', deviceBoxes),
      group('Display', displayBoxes),
      group('Hardware', hwBoxes),
      group('Network', netBoxes),
    ];

    // Async APIs: battery + storage + high-entropy UA-CH values.
    var jobs = [];

    if (navigator.getBattery) {
      jobs.push(
        navigator.getBattery().then(function (b) {
          var rows = [
            box('Battery Level', Math.round(b.level * 100) + '%'),
            box('Charging', b.charging ? 'Yes' : 'No'),
          ];
          if (b.charging && b.chargingTime > 0) {
            rows.push(box('Time to Full', Math.round(b.chargingTime / 60) + ' min'));
          } else if (!b.charging && b.dischargingTime > 0) {
            rows.push(box('Time Remaining', Math.round(b.dischargingTime / 3600) + ' h'));
          }
          return group('Battery', rows);
        })
      );
    }

    if (navigator.storage && navigator.storage.estimate) {
      jobs.push(
        navigator.storage.estimate().then(function (e) {
          var rows = [
            box('Storage Quota', fmtBytes(e.quota)),
            box('Storage Used', fmtBytes(e.usage)),
          ];
          return group('Storage', rows);
        })
      );
    }

    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      jobs.push(
        navigator.userAgentData
          .getHighEntropyValues(['architecture', 'bitness', 'model', 'platformVersion', 'uaFullVersion'])
          .then(function (he) {
            var arch = [he.architecture, he.bitness ? he.bitness + '-bit' : '']
              .filter(Boolean)
              .join(' ');
            return group('User Agent Client Hints', [
              box('Platform', navigator.userAgentData.platform || '—'),
              box('Platform Version', he.platformVersion || '—'),
              box('Architecture', arch || '—'),
              box('Model', he.model || '—'),
              box('Full Version', he.uaFullVersion || '—', 'wide'),
            ]);
          })
      );
    }

    Promise.allSettled(jobs).then(function (results) {
      results.forEach(function (r) {
        if (r.status === 'fulfilled') root.appendChild(r.value);
      });
    });

    // Render sync groups immediately.
    groups.forEach(function (g) {
      root.appendChild(g);
    });
  }

  render();
})();
