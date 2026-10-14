// TEAM IRONIC WEBSITE SCRIPT
//
// Does seven things, all run on every page:
//   1. Countdowns: updates the "days to go" number on the home page
//      card AND the Robots page countdown, always counting to the
//      next event that hasn't happened yet (does nothing on pages
//      without either one)
//   2. Active nav link: adds the ".active" highlight to whichever
//      nav link matches the current page
//   3. History locator scrollspy: highlights whichever season is
//      currently on screen on the history page (does nothing on
//      pages without a .history-locator)
//   4. Newsletter modal: turns any "Newsletter" link/button into a
//      blurred overlay popup instead of a page navigation (does
//      nothing on pages with no such link)
//   5. Robots page portfolios: loads a season's PDF only when its
//      row is opened, and keeps just one row open at a time (does
//      nothing on pages without a .portfolio-row)
//   6. Mobile menu: adds a menu button to the topbar that folds the
//      six nav links away on tablets and phones (style.css 23)
//   7. Keyboard support for the sponsor form button (Enter/Space)


// ----------------------------------------------------------
// 1. Countdown to next competition
// ----------------------------------------------------------
// COMP_SCHEDULE is the season's competitions in date order. Both the
// home page card and the Robots page countdown count down to the
// FIRST one that hasn't started yet, and the label under the number
// (any element with class "js-next-comp-label") follows along — so
// once the scrimmage passes it flips to Meet 1 by itself instead of
// sitting at "0".
//   date  — "YYYY-MM-DDTHH:MM:SS", 24 hour clock, local time
//   label — the text under the number
// When a date or venue changes, edit it here. Judging is a Zoom
// interview, not a competition, so it isn't in this list.
const COMP_SCHEDULE = [
  { date: "2026-10-17T08:00:00", label: "Scrimmage · 10/17/26" },
  { date: "2026-11-14T08:00:00", label: "Meet 1 · 11/14/26" },
  { date: "2026-12-12T08:00:00", label: "Meet 2 · 12/12/26" },
  { date: "2027-01-23T08:00:00", label: "Meet 3 · 1/23/27" },
  { date: "2027-02-13T08:00:00", label: "League Championship · 2/13/27" }
];

function nextComp() {
  const now = Date.now();
  return COMP_SCHEDULE.find(c => new Date(c.date).getTime() > now) || null;
}

// Both countdowns show whole days only (rounded up), so this only
// needs to recheck once a minute.
function updateCountdown() {
  const comp = nextComp();

  document.querySelectorAll('.js-next-comp-label').forEach(el => {
    el.textContent = comp ? comp.label : 'Season complete';
  });

  // cd-days = home page card, rb-days = Robots page
  const days = comp
    ? String(Math.ceil((new Date(comp.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : '--';
  ['cd-days', 'rb-days'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = days;
  });
}

updateCountdown();
setInterval(updateCountdown, 60 * 1000);


// ----------------------------------------------------------
// 2. Active nav link
// ----------------------------------------------------------
// Each HTML file's <body> tag passes its own filename through a
// data attribute, like <body data-page="team.html">. This just
// checks that against each nav link's href and marks the match
// ".active", no server or routing needed for it to work.
document.addEventListener('DOMContentLoaded', () => {
  const current = document.body.getAttribute('data-page');
  if (!current) return;
  document.querySelectorAll('.nav-link').forEach(el => {
    const href = el.getAttribute('href');
    if (href === current) el.classList.add('active');
  });
});


// ----------------------------------------------------------
// 3. History page: season locator scrollspy
// ----------------------------------------------------------
// Watches every .season-block on the history page and marks the
// matching .locator-link ".active" whenever that season is the one
// in view, so the left-hand tab column tracks scroll position
// automatically. New season blocks pick this up for free as long
// as the block's id matches its locator-link's href.
document.addEventListener('DOMContentLoaded', () => {
  const seasonBlocks = document.querySelectorAll('.season-block[id]');
  if (!seasonBlocks.length) return; // not the history page, nothing to do

  const locatorLinks = document.querySelectorAll('.history-locator .locator-link');
  const linkFor = id => Array.from(locatorLinks).find(a => a.getAttribute('href') === `#${id}`);

  const setActive = id => {
    locatorLinks.forEach(a => a.classList.remove('active'));
    const match = linkFor(id);
    if (match) match.classList.add('active');
  };

  // Start on whichever season is nearest the top of the viewport.
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting);
    if (!visible.length) return;
    visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    setActive(visible[0].target.id);
  }, { rootMargin: '-96px 0px -60% 0px', threshold: 0 });

  seasonBlocks.forEach(block => observer.observe(block));
  setActive(seasonBlocks[0].id); // sensible default before any scrolling happens
});


// ----------------------------------------------------------
// 4. Newsletter modal
// ----------------------------------------------------------
// Any element with [data-modal="newsletter"], plus any plain link
// pointing at newsletter.html, opens the newsletter signup as a
// blurred overlay on top of the CURRENT page instead of navigating
// away to a separate one. The overlay markup is built once per page
// (only if something on that page actually opens it) and reuses the
// exact ".newsletter-card" styling from style.css section 18, so it
// looks identical to the standalone newsletter.html page.
//
// To make something else open the newsletter this way, just give it
// data-modal="newsletter" — no other wiring needed.
document.addEventListener('DOMContentLoaded', () => {
  const triggers = document.querySelectorAll('[data-modal="newsletter"], a[href="newsletter.html"]');
  if (!triggers.length) return; // nothing on this page opens the newsletter

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'newsletterModal';
  overlay.innerHTML = `
    <div class="newsletter-card" role="dialog" aria-modal="true" aria-label="Newsletter signup">
      <button type="button" class="modal-close" aria-label="Close">&times;</button>
      <h1 class="newsletter-title type-caption-heading">Sign Up for Our Newsletter!</h1>
      <hr class="newsletter-hr">
      <p class="newsletter-text">Enter your email to receive Team IRONIC's monthly newsletter!</p>
      <form novalidate>
        <input type="email" name="email" placeholder="Email" required>
        <button type="submit" class="type-button newsletter-submit">Sign up!</button>
      </form>
      <p class="newsletter-feedback" role="status" aria-live="polite"></p>
    </div>
  `;
  document.body.appendChild(overlay);

  const form = overlay.querySelector('form');
  const feedback = overlay.querySelector('.newsletter-feedback');
  const submitBtn = form.querySelector('button[type="submit"]');
  const FORM_ENDPOINT = 'https://formspree.io/f/xdekzydy'; // must match the form action in newsletter.html

  const openModal = () => {
    overlay.classList.add('active');
    document.body.classList.add('modal-open');
  };
  const closeModal = () => {
    overlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  };

  triggers.forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault(); // stop <a href="newsletter.html"> from navigating
      openModal();
    });
  });

  overlay.querySelector('.modal-close').addEventListener('click', closeModal);

  // Click on the blurred backdrop itself (not the card) closes it.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
  });

  // Submit over AJAX so signing up doesn't blow away the overlay by
  // navigating the whole page off to Formspree's own success page —
  // the point of a modal is that you never leave the page behind it.
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.textContent = '';
    feedback.classList.remove('is-error');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Request failed');
      form.reset();
      feedback.textContent = "You're signed up! Check your inbox.";
    } catch (err) {
      feedback.textContent = 'Something went wrong — please try again.';
      feedback.classList.add('is-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign up!';
    }
  });
});


// ----------------------------------------------------------
// 5. Robots page: portfolio rows
// ----------------------------------------------------------
// Each <details class="portfolio-row" data-pdf="..."> on robots.html
// holds an empty <iframe class="portfolio-frame">. The PDF path only
// gets put into the iframe the first time that row is opened, so the
// page doesn't download every season's portfolio up front. Opening a
// row also closes any other open row, so only one big PDF viewer is
// on screen at a time.
document.addEventListener('DOMContentLoaded', () => {
  const rows = document.querySelectorAll('.portfolio-row[data-pdf]');
  if (!rows.length) return; // not the robots page, nothing to do

  rows.forEach(row => {
    row.addEventListener('toggle', () => {
      if (!row.open) return;

      const frame = row.querySelector('.portfolio-frame');
      if (frame && !frame.getAttribute('src')) {
        frame.setAttribute('src', row.dataset.pdf + '#view=FitH');
      }

      rows.forEach(other => {
        if (other !== row && other.open) other.open = false;
      });
    });
  });
});


// ----------------------------------------------------------
// 6. Mobile menu
// ----------------------------------------------------------
// Adds a menu button to every page's topbar. On screens 1024px and
// narrower (style.css section 23) the six nav links hide behind it
// and open as a full-screen list. Because the button is added here,
// no HTML page needs changing — and if JavaScript is off, the links
// simply stay visible and scroll sideways instead.
document.addEventListener('DOMContentLoaded', () => {
  const topbar = document.querySelector('.topbar');
  const links = topbar && topbar.querySelector('.topbar-links');
  if (!links) return;

  links.id = links.id || 'site-nav';
  const ICON_OPEN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="14" y2="17"/></svg>';
  const ICON_CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-controls', links.id);
  topbar.appendChild(btn);
  topbar.classList.add('js-nav');

  const setOpen = open => {
    topbar.classList.toggle('nav-open', open);
    document.body.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.innerHTML = open ? ICON_CLOSE : ICON_OPEN;
  };
  setOpen(false);

  btn.addEventListener('click', () => setOpen(!topbar.classList.contains('nav-open')));
  links.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && topbar.classList.contains('nav-open')) { setOpen(false); btn.focus(); }
  });
  // Close it if the window gets wide enough to show the normal nav again.
  window.matchMedia('(min-width: 1025px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
});


// ----------------------------------------------------------
// 7. Keyboard support for the sponsor form button
// ----------------------------------------------------------
// customgform.com needs its trigger to be a <div>, which keyboards
// can't press on their own. sponsors.html / sponsor-form.html give
// that div role="button" and tabindex="0" so it can be reached with
// Tab; this makes Enter and Space click it, like a real button.
document.addEventListener('keydown', (e) => {
  const el = e.target;
  if (!(el instanceof HTMLElement) || el.getAttribute('role') !== 'button' || el.tagName === 'BUTTON') return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    el.click();
  }
});
