/**
 * Flow Hydration — Shared site helpers
 * Renders nav/footer/ticker, manages cart UI, toasts, API helpers.
 * Depends on config.js + customerAuth.js (loaded before this).
 */

(function () {
  const FlowSite = {};

  // ── API helper ──────────────────────────────
  FlowSite.api = (path, opts = {}) => {
    const url = (typeof API_BASE !== 'undefined' ? API_BASE : '') + path;
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (window.CustomerAuth?.isLoggedIn() && !headers.Authorization) {
      Object.assign(headers, CustomerAuth.getAuthHeaders());
    }
    return fetch(url, { ...opts, headers }).then(async r => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || `Request failed (${r.status})`);
      return data;
    });
  };

  // ── Money formatter ─────────────────────────
  FlowSite.fmt = (n) => {
    const v = Number(n) || 0;
    return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  // ── Sachet color helper ─────────────────────
  FlowSite.sachetClass = (slug = '', i = 0) => {
    const colors = ['s1', 's2', 's3', 's4', 's5'];
    if (/lemon|citrus|lime/i.test(slug)) return 's3';
    if (/orange|mango|peach/i.test(slug)) return 's2';
    if (/berry|grape|plum/i.test(slug)) return 's4';
    if (/strawberry|water|melon|guava/i.test(slug)) return 's5';
    return colors[i % colors.length];
  };

  // ── Toast ───────────────────────────────────
  FlowSite.toast = (message, opts = {}) => {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = `<div class="toast-icon">✦</div><div class="toast-content"><div class="toast-title"></div><div class="toast-message"></div></div>`;
      document.body.appendChild(el);
    }
    const type = opts.type || (opts.error ? 'error' : '');
    el.className = 'toast' + (type ? ` ${type}` : '');
    el.querySelector('.toast-title').textContent = opts.title || (type === 'error' ? 'Something went wrong' : 'Done');
    el.querySelector('.toast-message').textContent = message;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3500);
  };

  // ── Render nav ──────────────────────────────
  FlowSite.renderNav = (active = '') => {
    const ticker = `<div class="ticker"><div class="ticker-track">
      ${Array(2).fill('<span>Pan-India Delivery Available</span><span>Clean Hydration to Fuel Your Day</span><span>Zero Added Sugar</span><span>Trusted by Thousands</span>').join('')}
    </div></div>`;

    const links = [
      ['index.html', 'Home'],
      ['shop.html', 'Shop'],
      ['index.html#ingredients', 'Science'],
      ['index.html#benefits', 'Benefits'],
      ['index.html#faq', 'FAQ']
    ].map(([h, l]) => `<li><a href="${h}" class="${active === l.toLowerCase() ? 'active' : ''}">${l}</a></li>`).join('');

    const nav = `<nav class="site-nav">
      <a class="logo" href="index.html"><img src="assets/logo.png" alt="Flow" class="logo-img" /></a>
      <ul class="nav-links">${links}</ul>
      <div class="nav-right">
        <a class="nav-profile" href="profile.html" id="navProfile" aria-label="Account">
          <span class="profile-text">Account</span>
        </a>
        <a class="nav-cart" href="cart.html" aria-label="Cart">
          Cart <span class="count" id="navCartCount">0</span>
        </a>
        <button class="nav-toggle" id="navToggle" aria-label="Menu">Menu</button>
      </div>
    </nav>`;

    const drawer = `<div class="mobile-drawer" id="mobileDrawer">
      <div class="top">
        <a class="logo" href="index.html"><img src="assets/logo.png" alt="Flow" class="logo-img" /></a>
        <button class="nav-toggle" id="drawerClose">Close</button>
      </div>
      <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="shop.html">Shop</a></li>
        <li><a href="index.html#ingredients">Science</a></li>
        <li><a href="index.html#benefits">Benefits</a></li>
        <li><a href="index.html#faq">FAQ</a></li>
        <li><a href="cart.html">Cart</a></li>
        <li><a href="profile.html">Account</a></li>
      </ul>
    </div>`;

    const slot = document.getElementById('siteHeader');
    if (slot) slot.innerHTML = ticker + nav + drawer;

    const toggle = document.getElementById('navToggle');
    const close = document.getElementById('drawerClose');
    const drw = document.getElementById('mobileDrawer');
    toggle?.addEventListener('click', () => drw.classList.add('open'));
    close?.addEventListener('click', () => drw.classList.remove('open'));

    FlowSite.updateCartCount();

    // Show "Hi, name" if logged in
    const profile = document.getElementById('navProfile');
    if (profile && window.CustomerAuth?.isLoggedIn()) {
      const c = CustomerAuth.getCustomer();
      const name = (c?.name || '').split(' ')[0];
      if (name) profile.querySelector('.profile-text').textContent = name;
    }
  };

  // ── Render footer ───────────────────────────
  FlowSite.renderFooter = () => {
    const slot = document.getElementById('siteFooter');
    if (!slot) return;
    slot.innerHTML = `<footer class="site-footer">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="logo" href="index.html"><img src="assets/logo.png" alt="Flow" class="logo-img" /></a>
          <p>Clean hydration to fuel your day. Precision-engineered electrolyte formulation for optimal performance and recovery.</p>
        </div>
        <div class="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="shop.html">All products</a></li>
            <li><a href="shop.html?cat=hydration">Hydration</a></li>
            <li><a href="shop.html?cat=energy">Energy</a></li>
            <li><a href="shop.html?cat=bundle">Bundles</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="index.html#about">About Us</a></li>
            <li><a href="index.html#ingredients">Science</a></li>
            <li><a href="index.html#about">Contact</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="index.html#faq">FAQ</a></li>
            <li><a href="shipping-policy.html">Shipping</a></li>
            <li><a href="refund-policy.html">Refund Policy</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="privacy-policy.html">Privacy</a></li>
            <li><a href="terms-conditions.html">Terms</a></li>
            <li><a href="refund-policy.html">Refunds</a></li>
            <li><a href="shipping-policy.html">Shipping</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Flow Hydration. All rights reserved.</span>
        <span>Made in India · Delivered nationwide</span>
      </div>
      <div class="mega-mark">flow</div>
    </footer>`;
  };

  // ── Cart count badge ────────────────────────
  FlowSite.updateCartCount = () => {
    const el = document.getElementById('navCartCount');
    if (!el || !window.CustomerAuth) return;
    const cart = CustomerAuth.getLocalCart();
    const count = cart.reduce((s, i) => s + (i.quantity || 0), 0);
    el.textContent = count;
    el.style.display = count > 0 ? '' : 'none';
  };
  window.addEventListener('cartUpdated', () => FlowSite.updateCartCount());

  // ── Auto-init footer/nav placeholders if missing ─
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('siteHeader')) {
      const h = document.createElement('div'); h.id = 'siteHeader';
      document.body.insertBefore(h, document.body.firstChild);
    }
    if (!document.getElementById('siteFooter')) {
      const f = document.createElement('div'); f.id = 'siteFooter';
      document.body.appendChild(f);
    }
  });

  window.FlowSite = FlowSite;
})();
