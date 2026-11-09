(function () {
  var s = document.currentScript || document.querySelector('script[src*="daol.js"]');
  var BASE = s ? s.src.replace(/[^\/]*(\?.*)?$/, '') : './';
  var PHONE = '01028526900';
  var isMobile = function () { return window.matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent); };
  var $$ = function (r, q) { return Array.prototype.slice.call(r.querySelectorAll(q)); };

  function whenRoot(cb) {
    var r = document.getElementById('daol-root');
    if (r) return cb(r);
    var mo = new MutationObserver(function () {
      var r2 = document.getElementById('daol-root');
      if (r2) { mo.disconnect(); cb(r2); }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(fallback);
    fallback(); return Promise.resolve();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
  }
  function sms(body) {
    var sep = /iPhone|iPad/i.test(navigator.userAgent) ? '&' : '?';
    location.href = 'sms:' + PHONE + (body ? sep + 'body=' + encodeURIComponent(body) : '');
  }

  function init(root) {
    var d = root.querySelector('.daol');
    var toastEl = root.querySelector('.d-toast');
    function toast(msg) {
      toastEl.textContent = msg; toastEl.classList.add('is-on');
      clearTimeout(toastEl._h); toastEl._h = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3000);
    }

    $$(root, '.d-review__shot').forEach(function (s) {
      s.setAttribute('role', 'button'); s.setAttribute('tabindex', '0');
      function open() {
        var img = s.querySelector('img');
        var ov = document.createElement('div');
        ov.className = 'd-lightbox';
        ov.innerHTML = '<img src="' + img.src + '" alt="' + img.alt + '"><button type="button" aria-label="닫기">×</button>';
        function close() { ov.remove(); document.removeEventListener('keydown', esc); }
        function esc(e) { if (e.key === 'Escape') close(); }
        ov.addEventListener('click', close);
        document.addEventListener('keydown', esc);
        d.appendChild(ov);
      }
      s.addEventListener('click', open);
      s.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(); });
    });

    $$(root, '[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        copy(b.getAttribute('data-copy')).then(function () {
          toast('💬 카카오톡 ID ' + b.getAttribute('data-copy') + ' 복사 완료! 친구 추가에서 검색해 주세요');
        });
      });
    });

    function scrollToId(id) {
      var t = document.getElementById(id);
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 10, behavior: 'smooth' });
    }
    $$(root, 'a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        if (!id || !document.getElementById(id)) return;
        e.preventDefault(); scrollToId(id);
      });
    });

    // hero deck
    var items = $$(root, '.d-card__item'), dots = $$(root, '.d-card__dots i'), cur = 0;
    if (items.length) setInterval(function () {
      var prev = items[cur]; prev.classList.remove('is-on'); prev.classList.add('is-out');
      setTimeout(function () { prev.classList.remove('is-out'); }, 500);
      dots[cur].classList.remove('is-on');
      cur = (cur + 1) % items.length;
      items[cur].classList.add('is-on'); dots[cur].classList.add('is-on');
    }, 3200);

    // chat sequence
    function runChat(box) {
      var msgs = $$(box, '.d-msg'), i = 0;
      (function next() {
        if (i >= msgs.length) return;
        msgs[i].classList.add('is-in'); i++;
        setTimeout(next, i === msgs.length - 1 ? 700 : 1100);
      })();
    }

    // compare toggle
    var tg = root.querySelector('[data-toggle]'), cmp = root.querySelector('[data-compare]');
    if (tg) $$(tg, 'button').forEach(function (b) {
      b.addEventListener('click', function () {
        var side = b.getAttribute('data-side');
        $$(tg, 'button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        tg.classList.toggle('is-before', side === 'before');
        cmp.classList.toggle('is-before', side === 'before');
        cmp.classList.remove('is-swap'); void cmp.offsetWidth; cmp.classList.add('is-swap');
        $$(cmp, 'p').forEach(function (p) { p.textContent = p.getAttribute(side === 'before' ? 'data-b' : 'data-a'); });
      });
    });

    // quiz
    var q = root.querySelector('[data-quiz]');
    if (q) {
      var panels = $$(q, '.d-quiz__panel'), step = 0, total = 5, ans = {};
      var bar = q.querySelector('[data-quiz-bar]'), num = q.querySelector('[data-quiz-num]');
      var prevB = q.querySelector('[data-prev]'), nextB = q.querySelector('[data-next]'), budget = q.querySelector('[data-budget]');
      var labels = ['목적', '매물 종류', '희망 지역', '거래 방식', '예산', '잔금·입주'];
      function val(i) {
        var p = panels[i];
        if (i === 3) {
          var seg = p.querySelector('[data-sub] .is-on');
          return { deal: seg ? seg.getAttribute('data-v') : '', budget: budget.value.trim() };
        }
        return $$(p, '.d-opts button.is-on').map(function (b) { return b.getAttribute('data-v'); }).join(', ');
      }
      function valid(i) {
        if (i === 3) { var v = val(3); return !!v.deal; }
        return i >= total || !!val(i);
      }
      function render() {
        panels.forEach(function (p, i) { p.classList.toggle('is-on', i === step); });
        bar.style.width = (Math.min(step + 1, total) / total * 100) + '%';
        num.textContent = Math.min(step + 1, total);
        prevB.disabled = step === 0;
        nextB.disabled = !valid(step);
        nextB.textContent = step === total - 1 ? '결과 보기' : '다음';
        q.classList.toggle('is-done', step === total);
        if (step === total) summary();
      }
      function summary() {
        var b = val(3);
        ans = { '목적': val(0), '매물 종류': val(1), '희망 지역': val(2), '거래 방식': b.deal, '예산': b.budget || '상담 시 안내', '잔금·입주': val(4) };
        q.querySelector('[data-summary]').innerHTML = labels.map(function (k) {
          return '<li><span>' + k + '</span><b>' + String(ans[k]).replace(/</g, '&lt;') + '</b></li>';
        }).join('');
      }
      function msg() {
        return '[다올부동산 맞춤 매물 상담]\n' + labels.map(function (k) { return '· ' + k + ': ' + ans[k]; }).join('\n');
      }
      $$(q, '.d-opts').forEach(function (g) {
        var multi = g.closest('[data-multi]') && !g.hasAttribute('data-sub');
        $$(g, 'button').forEach(function (b) {
          b.addEventListener('click', function () {
            if (multi) {
              if (b.getAttribute('data-v') === '아직 모르겠어요') $$(g, 'button').forEach(function (x) { if (x !== b) x.classList.remove('is-on'); });
              else { var u = g.querySelector('[data-v="아직 모르겠어요"]'); if (u) u.classList.remove('is-on'); }
              b.classList.toggle('is-on');
            } else {
              $$(g, 'button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
              if (!g.hasAttribute('data-sub') && step < total - 1) setTimeout(function () { step++; render(); }, 280);
              else if (!g.hasAttribute('data-sub') && step === total - 1) setTimeout(function () { step++; render(); }, 280);
            }
            nextB.disabled = !valid(step);
          });
        });
      });
      nextB.addEventListener('click', function () { if (valid(step) && step < total) { step++; render(); } });
      prevB.addEventListener('click', function () { if (step > 0) { step--; render(); } });
      $$(q, '[data-send]').forEach(function (b) {
        b.addEventListener('click', function () {
          var m = msg();
          if (b.getAttribute('data-send') === 'sms') {
            if (isMobile()) sms(m);
            else copy(m).then(function () { toast('📋 상담 내용이 복사됐어요. 010-2852-6900으로 문자 보내주세요'); });
          } else {
            copy(m + '\n\n(카카오톡 ID: kk6900)').then(function () { toast('📋 상담 내용 복사 완료! 카톡 ID kk6900에 붙여넣어 보내주세요'); });
          }
        });
      });
      render();
    }

    // floating top
    var topB = root.querySelector('[data-top]');
    if (topB) {
      topB.addEventListener('click', function () { window.scrollTo({ top: d.getBoundingClientRect().top + window.pageYOffset, behavior: 'smooth' }); });
      var onScroll = function () { topB.classList.toggle('is-on', window.pageYOffset > 800); };
      window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }

    // reveal
    if ('IntersectionObserver' in window) {
      d.classList.add('is-ready');
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          if (el.hasAttribute('data-reveal')) {
            var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
            el.style.transitionDelay = Math.min(idx, 6) * 70 + 'ms';
          }
          el.classList.add('is-in');
          if (el.hasAttribute('data-chat')) runChat(el);
          io.unobserve(el);
        });
      }, { threshold: 0.2 });
      $$(root, '[data-reveal],[data-steps],[data-chat]').forEach(function (el) { io.observe(el); });
    } else {
      $$(root, '.d-msg,[data-steps]').forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  function mount(root) {
    if (!root || root.getAttribute('data-loaded')) return;
    root.setAttribute('data-loaded', '1');
    fetch(BASE + 'daol.html', { cache: 'no-cache' })
      .then(function (r) { return r.text(); })
      .then(function (html) { root.innerHTML = html.split('{{BASE}}').join(BASE); init(root); })
      .catch(function (e) { console.error('[daol] load failed', e); });
  }
  window.DAOL = { mount: mount, init: init };
  if (!window.DAOL_MANUAL) whenRoot(mount);
})();
