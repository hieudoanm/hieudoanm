/* Split Bill — equal split with tip/tax, or minimal settlement transfers.
   Ported from omni's SplitBill (PNG export replaced with text copy to
   keep this page dependency-free). Classic script (no modules). */
(function () {
  'use strict';

  var CURRENCIES = [
    'VND',
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'KRW',
    'THB',
    'ILS',
    'INR',
    'AUD',
    'CAD',
    'SGD',
  ];

  var state = {
    tab: 'equal',
    bill: 100,
    people: 2,
    tip: 10,
    tax: 0,
    currency: 'VND',
    persons: [
      { name: 'Alice', paid: 100, owes: 25 },
      { name: 'Bob', paid: 0, owes: 40 },
      { name: 'Carol', paid: 0, owes: 35 },
    ],
    splitEqually: true,
    settlements: null,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function money(value) {
    if (value == null || isNaN(value)) return '—';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: state.currency,
      }).format(value);
    } catch (e) {
      return value.toFixed(2) + ' ' + state.currency;
    }
  }

  /* ---- equal split ---- */

  function equalResult() {
    var tipA = state.bill * (state.tip / 100);
    var taxA = state.bill * (state.tax / 100);
    return {
      tipAmount: tipA,
      taxAmount: taxA,
      total: state.bill + tipA + taxA,
      perPerson: (state.bill + tipA + taxA) / Math.max(1, state.people),
    };
  }

  function renderEqual() {
    var r = equalResult();
    $('r-tip').textContent = money(r.tipAmount);
    $('r-tax').textContent = money(r.taxAmount);
    $('r-total').textContent = money(r.total);
    $('r-per').textContent = money(r.perPerson);
  }

  /* ---- settlements ---- */

  function totalPaid() {
    return state.persons.reduce(function (s, p) {
      return s + (p.paid || 0);
    }, 0);
  }

  function equalShare() {
    return totalPaid() / (state.persons.length || 1);
  }

  function computedPersons() {
    if (!state.splitEqually) return state.persons;
    var share = equalShare();
    return state.persons.map(function (p) {
      return { name: p.name, paid: p.paid, owes: share };
    });
  }

  function computedTotalOwes() {
    return computedPersons().reduce(function (s, p) {
      return s + (p.owes || 0);
    }, 0);
  }

  // Greedy minimal transfers: net = paid - owes per person.
  function calculateSettlements(persons) {
    var net = persons.map(function (p) {
      return { name: p.name.trim() || '?', net: (p.paid || 0) - (p.owes || 0) };
    });
    var creditors = net
      .filter(function (n) {
        return n.net > 0;
      })
      .sort(function (a, b) {
        return b.net - a.net;
      });
    var debtors = net
      .filter(function (n) {
        return n.net < 0;
      })
      .sort(function (a, b) {
        return a.net - b.net;
      });
    var settlements = [];
    var i = 0;
    var j = 0;
    while (i < debtors.length && j < creditors.length) {
      var debtor = debtors[i];
      var creditor = creditors[j];
      var amount = Math.min(-debtor.net, creditor.net);
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount,
      });
      debtor.net += amount;
      creditor.net -= amount;
      if (debtor.net === 0) i++;
      if (creditor.net === 0) j++;
    }
    return settlements;
  }

  function renderPersons() {
    var wrap = $('persons');
    wrap.replaceChildren();
    computedPersons().forEach(function (p, idx) {
      var row = el('div', 'person-row');

      var name = document.createElement('input');
      name.type = 'text';
      name.className = 'name';
      name.placeholder = 'Name';
      name.value = p.name;
      name.addEventListener('input', function () {
        state.persons[idx].name = name.value;
        invalidate();
      });
      row.appendChild(name);

      var paid = document.createElement('input');
      paid.type = 'number';
      paid.className = 'paid';
      paid.placeholder = 'Paid';
      paid.min = '0';
      paid.step = '0.01';
      paid.value = p.paid || '';
      paid.addEventListener('input', function () {
        state.persons[idx].paid = parseFloat(paid.value) || 0;
        invalidate();
      });
      row.appendChild(paid);

      row.appendChild(el('span', 'sep', '/'));

      if (state.splitEqually) {
        var staticOwes = el('span', 'owes-static', money(p.owes));
        row.appendChild(staticOwes);
      } else {
        var owes = document.createElement('input');
        owes.type = 'number';
        owes.className = 'owes';
        owes.placeholder = 'Owes';
        owes.min = '0';
        owes.step = '0.01';
        owes.value = p.owes || '';
        owes.addEventListener('input', function () {
          state.persons[idx].owes = parseFloat(owes.value) || 0;
          invalidate();
        });
        row.appendChild(owes);
      }

      var remove = el('button', 'remove', '✕');
      remove.type = 'button';
      remove.title = 'Remove';
      remove.addEventListener('click', function () {
        state.persons.splice(idx, 1);
        invalidate();
      });
      row.appendChild(remove);

      wrap.appendChild(row);
    });

    $('equal-share').textContent = money(equalShare());
    $('settle').disabled = state.persons.length < 2;

    var tp = totalPaid();
    var to = computedTotalOwes();
    $('totals').hidden = !(tp > 0 || to > 0);
    $('t-paid').textContent = money(tp);
    $('t-owes').textContent = money(to);
  }

  function renderSettlements() {
    var box = $('settlements');
    box.replaceChildren();
    if (!state.settlements) return;
    if (state.settlements.length === 0) {
      box.appendChild(el('div', 'all-settled', 'All settled ✓'));
      return;
    }
    state.settlements.forEach(function (s) {
      var row = el('div', 'settlement');
      var who = el('span', 'who');
      who.appendChild(document.createTextNode(s.from));
      who.appendChild(el('span', 'pays', 'pays'));
      who.appendChild(document.createTextNode(' ' + s.to));
      row.appendChild(who);
      row.appendChild(el('span', 'amount', money(s.amount)));
      box.appendChild(row);
    });
  }

  function invalidate() {
    state.settlements = null;
    renderPersons();
    renderSettlements();
  }

  function summaryText() {
    var lines = [];
    if (state.tab === 'equal') {
      var r = equalResult();
      lines.push('Split Bill — Equal Split');
      lines.push('Bill: ' + money(state.bill));
      lines.push('People: ' + state.people);
      lines.push('Tip (' + state.tip + '%): ' + money(r.tipAmount));
      lines.push('Tax (' + state.tax + '%): ' + money(r.taxAmount));
      lines.push('Total: ' + money(r.total));
      lines.push('Per person: ' + money(r.perPerson));
    } else {
      lines.push('Split Bill — Who Owes Who');
      computedPersons().forEach(function (p) {
        lines.push(
          (p.name || '?') +
            ' — paid ' +
            money(p.paid) +
            ', owes ' +
            money(p.owes)
        );
      });
      if (state.settlements && state.settlements.length) {
        lines.push('');
        lines.push('Settlements:');
        state.settlements.forEach(function (s) {
          lines.push(s.from + ' pays ' + s.to + ' ' + money(s.amount));
        });
      } else if (state.settlements) {
        lines.push('All settled ✓');
      }
    }
    return lines.join('\n');
  }

  function setTab(tab) {
    state.tab = tab;
    $('tab-equal').classList.toggle('active', tab === 'equal');
    $('tab-settle').classList.toggle('active', tab === 'settle');
    $('pane-equal').hidden = tab !== 'equal';
    $('pane-settle').hidden = tab !== 'settle';
  }

  function init() {
    // Currency select
    var sel = $('currency');
    CURRENCIES.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      sel.appendChild(opt);
    });
    sel.value = state.currency;
    sel.addEventListener('change', function () {
      state.currency = sel.value;
      renderEqual();
      invalidate();
    });

    // Tabs
    $('tab-equal').addEventListener('click', function () {
      setTab('equal');
    });
    $('tab-settle').addEventListener('click', function () {
      setTab('settle');
    });

    // Equal fields
    function num(id, key, clamp) {
      $(id).addEventListener('input', function () {
        var v = parseFloat($(id).value);
        state[key] = isNaN(v) ? 0 : clamp ? Math.max(clamp, v) : v;
        renderEqual();
      });
    }
    num('bill', 'bill');
    num('people', 'people', 1);
    num('tip', 'tip');
    num('tax', 'tax');

    // Settle tab
    $('split-equal').addEventListener('change', function () {
      state.splitEqually = this.checked;
      invalidate();
    });
    $('add-person').addEventListener('click', function () {
      state.persons.push({ name: '', paid: 0, owes: 0 });
      invalidate();
    });
    $('settle').addEventListener('click', function () {
      state.settlements = calculateSettlements(computedPersons());
      renderSettlements();
    });

    // Copy summary
    $('copy').addEventListener('click', function () {
      var text = summaryText();
      function done() {
        $('copied').hidden = false;
        setTimeout(function () {
          $('copied').hidden = true;
        }, 1500);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });

    renderEqual();
    renderPersons();
    renderSettlements();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
