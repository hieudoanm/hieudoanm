/* Regex — generate a pattern from sample strings, test against inputs.
   Ported from omni's Regex (editors). Classic script (no modules). */
(function () {
  'use strict';

  /* ---- regex generation (ported from utils/regex.ts) ---- */

  function classifyChar(c) {
    if (/[0-9]/.test(c)) return '\\d';
    if (/[a-z]/.test(c)) return '[a-z]';
    if (/[A-Z]/.test(c)) return '[A-Z]';
    return null;
  }

  function classifySegment(seg) {
    if (seg.length === 0) return '';
    if (/^\d+$/.test(seg)) return '\\d{' + seg.length + '}';
    if (/^[a-z]+$/.test(seg)) return '[a-z]{' + seg.length + '}';
    if (/^[A-Z]+$/.test(seg)) return '[A-Z]{' + seg.length + '}';
    if (/^[a-zA-Z]+$/.test(seg)) return '[a-zA-Z]{' + seg.length + '}';
    if (/^[a-zA-Z0-9]+$/.test(seg)) return '\\w{' + seg.length + '}';
    return null;
  }

  function escapeLit(s) {
    return s.replace(/[.+*?^${}()|[\]\\]/g, '\\$&');
  }

  var SEP_PATTERN = /[-_.\s/|~]+/;

  function splitParts(s) {
    return s.split(SEP_PATTERN).filter(Boolean);
  }

  function uniq(arr) {
    return arr.filter(function (v, i) {
      return arr.indexOf(v) === i;
    });
  }

  function generateRegex(strings) {
    if (strings.length < 2) return null;
    var clean = strings.filter(function (s) {
      return s.length > 0;
    });
    if (clean.length < 2) return null;

    var allSame = clean.every(function (s) {
      return s === clean[0];
    });
    if (allSame) return escapeLit(clean[0]);

    var bySep = clean.map(splitParts);
    var allSamePartsCount = bySep.every(function (parts) {
      return parts.length === bySep[0].length;
    });

    if (allSamePartsCount) {
      var result = [];
      for (var i = 0; i < bySep[0].length; i++) {
        var parts = bySep.map(function (p) {
          return p[i];
        });
        var first = parts[0];

        if (parts.every(function (p) {
          return p === first;
        })) {
          result.push(i > 0 ? '[-_.\\s/|~]' : '', escapeLit(first));
          continue;
        }

        var allSameLen = parts.every(function (p) {
          return p.length === first.length;
        });
        if (allSameLen) {
          var pattern = '';
          for (var j = 0; j < first.length; j++) {
            var chars = parts.map(function (p) {
              return p[j];
            });
            var u = uniq(chars);
            if (u.length === 1) {
              var cls = classifyChar(u[0]);
              pattern += cls != null ? cls : escapeLit(u[0]);
            } else {
              var classes = u.map(classifyChar);
              var allSameClass = classes.every(function (c) {
                return c && c === classes[0];
              });
              if (allSameClass) {
                pattern += classes[0];
              } else {
                var printable = u
                  .map(escapeLit)
                  .sort()
                  .join('');
                pattern += '[' + printable + ']';
              }
            }
          }
          result.push(i > 0 ? '[-_.\\s/|~]' : '', pattern);
        } else {
          var segClass = classifySegment(first);
          var allClassified = parts.every(function (p) {
            return classifySegment(p);
          });
          if (segClass && allClassified) {
            var lengths = uniq(parts.map(function (p) {
              return p.length;
            }));
            if (lengths.length === 1) {
              result.push(i > 0 ? '[-_.\\s/|~]' : '', segClass);
            } else {
              var min = Math.min.apply(null, lengths);
              var max = Math.max.apply(null, lengths);
              var base = segClass.replace(/\{\d+\}$/, '');
              result.push(i > 0 ? '[-_.\\s/|~]' : '', base + '{' + min + ',' + max + '}');
            }
          } else {
            result.push(
              i > 0 ? '[-_.\\s/|~]' : '',
              '(?:(?:' +
                parts.map(escapeLit).join('|') +
                '))'
            );
          }
        }
      }
      return result.join('');
    }

    var prefix = (function () {
      var i = 0;
      while (
        i < clean[0].length &&
        clean.every(function (s) {
          return s[i] === clean[0][i];
        })
      )
        i++;
      return clean[0].slice(0, i);
    })();

    var suffix = (function () {
      var i = 0;
      while (
        i < clean[0].length &&
        clean.every(function (s) {
          return (
            s[s.length - 1 - i] === clean[0][clean[0].length - 1 - i]
          );
        })
      )
        i++;
      return clean[0].slice(clean[0].length - i);
    })();

    if (prefix || suffix) {
      var mid = clean.map(function (s) {
        return s.slice(prefix.length, s.length - suffix.length || s.length);
      });
      var uniqMid = uniq(mid);
      if (uniqMid.length === 1 && uniqMid[0] === '')
        return escapeLit(prefix) + escapeLit(suffix);
      var escaped = uniqMid.map(escapeLit);
      return escapeLit(prefix) + '(?:' + escaped.join('|') + ')' + escapeLit(suffix);
    }

    return '(?:' + clean.map(escapeLit).join('|') + ')';
  }

  function testRegex(pattern, flags, tests) {
    try {
      var re = new RegExp(pattern, flags);
      return tests.map(function (t) {
        return re.test(t);
      });
    } catch (e) {
      return tests.map(function () {
        return false;
      });
    }
  }

  /* ---- UI ---- */

  var customPattern = '';
  var generated = null;

  function $(id) {
    return document.getElementById(id);
  }

  function lines(textarea) {
    return textarea.value
      .split('\n')
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 0;
      });
  }

  function currentPattern() {
    return customPattern || generated || '';
  }

  function copy(text, btn, label) {
    function done() {
      var old = btn.textContent;
      btn.textContent = '✓';
      setTimeout(function () {
        btn.textContent = old || label;
      }, 1200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    }
  }

  function render() {
    var samples = lines($('samples'));
    generated = samples.length > 0 ? generateRegex(samples) : null;
    var pattern = currentPattern();

    var input = $('pattern');
    if (document.activeElement !== input) input.value = pattern;
    $('custom-hint').hidden = !(generated && !customPattern);
    $('copy-pattern').disabled = !pattern;

    var testLines = lines($('tests'));
    var box = $('results');
    box.replaceChildren();
    if (testLines.length > 0 && pattern) {
      box.hidden = false;
      var results = testRegex(pattern, $('flags').value || '', testLines);
      testLines.forEach(function (line, i) {
        var row = document.createElement('div');
        row.className = 'result-row ' + (results[i] ? 'match' : 'miss');
        var mark = document.createElement('span');
        mark.className = 'mark';
        mark.textContent = results[i] ? '✓' : '✗';
        var text = document.createElement('span');
        text.textContent = line;
        row.appendChild(mark);
        row.appendChild(text);
        box.appendChild(row);
      });
    } else {
      box.hidden = true;
    }
  }

  function init() {
    ['samples', 'tests', 'flags'].forEach(function (id) {
      $(id).addEventListener('input', render);
    });
    $('pattern').addEventListener('input', function () {
      customPattern = this.value;
      render();
    });
    $('copy-pattern').addEventListener('click', function () {
      copy(currentPattern(), this, 'Copy');
    });
    $('copy-flags').addEventListener('click', function () {
      copy($('flags').value, this, 'F');
    });
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
