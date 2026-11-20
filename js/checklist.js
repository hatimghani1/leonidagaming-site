/* Leonida Guides — GTA 6 checklist (vanilla JS, progress in localStorage) */
(function () {
  'use strict';
  var D = window.LG_CHECKLIST, root = document.getElementById('checklist');
  if (!D || !root) return;
  var KEY = 'lg-gta6-checklist-v1';
  var st = load();
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.done) return s; } catch (e) {}
    return { done: {}, counts: {}, prefs: {} };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function el(t, a, kids) {
    var n = document.createElement(t);
    for (var k in a || {}) { if (k === 'text') n.textContent = a[k]; else if (k === 'html') n.innerHTML = a[k]; else n.setAttribute(k, a[k]); }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  var srcName = {}; D.sources.forEach(function (s) { srcName[s.id] = s; });
  var q = document.getElementById('cl-search'), hide = document.getElementById('cl-hide'),
      spo = document.getElementById('cl-spoilers'), overallBar = document.getElementById('cl-overall-bar'),
      overallTxt = document.getElementById('cl-overall-txt');
  hide.checked = !!st.prefs.hide; spo.checked = !!st.prefs.spoilers;

  function render() {
    root.innerHTML = '';
    var group = null;
    D.categories.forEach(function (c) {
      if (c.group !== group) { group = c.group; root.appendChild(el('h2', { 'class': 'cl-group', text: group })); }
      var det = el('details', { 'class': 'cl-cat', id: 'cat-' + c.id, 'data-cat': c.id });
      var o = st.prefs['open-' + c.id]; if (o === true || (o === undefined && c.group.indexOf('100%') === 0)) det.open = true;
      det.addEventListener('toggle', function () { st.prefs['open-' + c.id] = det.open; save(); });
      var sum = el('summary', {}, [
        el('span', { 'class': 'cl-cat-title', text: c.title }),
        c.status === 'in-progress' ? el('span', { 'class': 'cl-badge', text: 'List in progress' }) : null,
        el('span', { 'class': 'cl-count', 'data-count': c.id })
      ]);
      det.appendChild(sum);
      det.appendChild(el('div', { 'class': 'cl-bar' }, [el('span', { 'data-bar': c.id })]));
      if (c.note) det.appendChild(el('p', { 'class': 'cl-note', text: c.note }));
      var ul = el('ul', { 'class': 'cl-items' });
      c.items.forEach(function (it) {
        var id = 'cl-' + it.id, done = !!st.done[it.id];
        var cb = el('input', { type: 'checkbox', id: id }); cb.checked = done;
        cb.addEventListener('change', function () { if (cb.checked) st.done[it.id] = 1; else delete st.done[it.id]; save(); update(); });
        var lab = el('label', { 'for': id }, [el('span', { 'class': 'cl-label', text: it.label })]);
        if (it.spoiler) lab.appendChild(el('span', { 'class': 'cl-spoiler', text: spo.checked ? it.spoiler : 'Spoiler hidden' }));
        if (it.note) lab.appendChild(el('span', { 'class': 'cl-sub', text: it.note }));
        var li = el('li', { 'class': 'cl-item' + (done ? ' is-done' : ''), 'data-id': it.id,
          'data-text': (it.label + ' ' + (it.note || '') + ' ' + (spo.checked && it.spoiler ? it.spoiler : '')).toLowerCase() }, [cb, lab]);
        if (it.target) {
          var num = el('input', { type: 'number', min: '0', max: String(it.target), inputmode: 'numeric', 'class': 'cl-num', 'aria-label': it.label + ' count' });
          num.value = st.counts[it.id] || 0;
          num.addEventListener('input', function () {
            var v = Math.max(0, Math.min(it.target, parseInt(num.value, 10) || 0));
            num.value = v; st.counts[it.id] = v; if (v >= it.target) { st.done[it.id] = 1; cb.checked = true; } save(); update();
          });
          li.appendChild(el('span', { 'class': 'cl-target' }, [num, el('span', { text: '/ ' + it.target })]));
        }
        ul.appendChild(li);
      });
      if (!c.items.length) ul.appendChild(el('li', { 'class': 'cl-empty', text: 'No verified entries yet. Check back tomorrow.' }));
      det.appendChild(ul);
      if (c.sources && c.sources.length) {
        var p = el('p', { 'class': 'cl-src', text: 'Sources: ' });
        c.sources.forEach(function (s, i) { var S = srcName[s]; if (!S) return; if (i) p.appendChild(document.createTextNode(', ')); p.appendChild(el('a', { href: S.url, rel: 'nofollow noopener', target: '_blank', text: S.name.split(':')[0] })); });
        det.appendChild(p);
      }
      root.appendChild(det);
    });
    update();
  }
  function update() {
    var term = (q.value || '').trim().toLowerCase(), T = 0, Dn = 0;
    D.categories.forEach(function (c) {
      var t = c.items.length, d = 0, shown = 0;
      c.items.forEach(function (it) {
        var done = !!st.done[it.id]; if (done) d++;
        var li = root.querySelector('[data-id="' + it.id + '"]'); if (!li) return;
        li.classList.toggle('is-done', done);
        var vis = (!term || li.getAttribute('data-text').indexOf(term) > -1) && !(hide.checked && done);
        li.hidden = !vis; if (vis) shown++;
      });
      T += t; Dn += d;
      var pct = t ? Math.round(d / t * 100) : 0;
      var cnt = root.querySelector('[data-count="' + c.id + '"]'); if (cnt) cnt.textContent = t ? d + ' / ' + t : '—';
      var bar = root.querySelector('[data-bar="' + c.id + '"]'); if (bar) bar.style.width = pct + '%';
      var cat = document.getElementById('cat-' + c.id); if (cat) { cat.hidden = !!term && shown === 0; if (term && shown) cat.open = true; }
    });
    var P = T ? Math.round(Dn / T * 100) : 0;
    overallBar.style.width = P + '%'; overallTxt.textContent = P + '% · ' + Dn + ' of ' + T + ' items';
  }
  q.addEventListener('input', update);
  hide.addEventListener('change', function () { st.prefs.hide = hide.checked; save(); update(); });
  spo.addEventListener('change', function () { st.prefs.spoilers = spo.checked; save(); render(); });
  document.getElementById('cl-reset').addEventListener('click', function () {
    if (confirm('Reset all checklist progress on this device? This cannot be undone.')) { st = { done: {}, counts: {}, prefs: st.prefs }; save(); render(); }
  });
  document.getElementById('cl-export').addEventListener('click', function () {
    var b = new Blob([JSON.stringify({ app: 'leonida-gta6-checklist', v: 1, exported: new Date().toISOString(), done: st.done, counts: st.counts }, null, 1)], { type: 'application/json' });
    var a = el('a', { href: URL.createObjectURL(b), download: 'gta6-checklist-progress.json' }); document.body.appendChild(a); a.click(); a.remove();
  });
  var file = document.getElementById('cl-import-file');
  document.getElementById('cl-import').addEventListener('click', function () { file.click(); });
  file.addEventListener('change', function () {
    var f = file.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () {
      try { var j = JSON.parse(r.result); if (!j.done) throw 0; st.done = j.done; st.counts = j.counts || {}; save(); render(); alert('Progress imported.'); }
      catch (e) { alert('That file is not a valid checklist export.'); }
      file.value = '';
    };
    r.readAsText(f);
  });
  document.documentElement.classList.add('cl-js');
  render();
})();
