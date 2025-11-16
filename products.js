document.addEventListener('DOMContentLoaded', function() {
    /* Slider controls */
    const slider = document.querySelector('.products-slider');
    const leftBtn = document.querySelector('.scroll-left');
    const rightBtn = document.querySelector('.scroll-right');
    const scrollAmount = 600; // Scroll by multiple product widths

    if (slider && leftBtn && rightBtn) {
        leftBtn.addEventListener('click', () => {
            slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        rightBtn.addEventListener('click', () => {
            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        slider.addEventListener('scroll', () => {
            leftBtn.style.opacity = slider.scrollLeft > 0 ? '1' : '0.5';
            rightBtn.style.opacity = slider.scrollLeft < (slider.scrollWidth - slider.clientWidth) ? '1' : '0.5';
        });
        leftBtn.style.opacity = '0.5';
    }

    /* Reviews carousel controls */
    const reviewSlider = document.querySelector('.review-cards');
    const reviewLeftBtn = document.querySelector('.review-left');
    const reviewRightBtn = document.querySelector('.review-right');
    const reviewScrollAmount = 420;

    if (reviewLeftBtn && reviewRightBtn && reviewSlider) {
        reviewLeftBtn.addEventListener('click', () => {
            reviewSlider.scrollBy({ left: -reviewScrollAmount, behavior: 'smooth' });
        });
        reviewRightBtn.addEventListener('click', () => {
            reviewSlider.scrollBy({ left: reviewScrollAmount, behavior: 'smooth' });
        });

        reviewSlider.addEventListener('scroll', () => {
            reviewLeftBtn.style.opacity = reviewSlider.scrollLeft > 0 ? '1' : '0.5';
            reviewRightBtn.style.opacity = reviewSlider.scrollLeft < (reviewSlider.scrollWidth - reviewSlider.clientWidth) ? '1' : '0.5';
        });
        reviewLeftBtn.style.opacity = '0.5';
    }

    /* Cart functionality */
    const CART_KEY = 'bella_cart_v1';
    const cartBtn = document.getElementById('cartBtn');
    const cartDrawer = document.getElementById('cartDrawer');
    const closeCart = document.getElementById('closeCart');
    const cartItemsEl = document.getElementById('cartItems');
    const cartCountEl = document.getElementById('cartCount');
    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const mobileCartCount = document.getElementById('mobileCartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');


    let cart = loadCart();
    renderCartCount();

    const cartOverlay = document.getElementById('cartOverlay');

    // Drawer summary elements
    const drawerCouponInput = document.getElementById('drawerCouponInput');
    const drawerApplyCoupon = document.getElementById('drawerApplyCoupon');
    const drawerShippingCountry = document.getElementById('drawerShippingCountry');
    const drawerEstimateShipping = document.getElementById('drawerEstimateShipping');
    const drawerSummaryShipping = document.getElementById('drawerSummaryShipping');
    const drawerSummaryTax = document.getElementById('drawerSummaryTax');
    const drawerSummaryTotal = document.getElementById('drawerSummaryTotal');

    // Open/close drawer
    if (cartBtn) {
        // The cart button now links directly to cart.html.
        // The drawer functionality is no longer triggered from the main header cart icon.
        // We can keep the drawer logic for other potential uses, but the event listener is removed.
    }

    if (closeCart) {
        // This logic remains for closing the drawer if it's opened by other means in the future.
        closeCart.addEventListener('click', () => {
            cartDrawer.classList.remove('open');
            cartOverlay.classList.remove('open');
            cartDrawer.setAttribute('aria-hidden', 'true');
            cartOverlay.setAttribute('aria-hidden', 'true');
        });
    }

    // clicking overlay closes drawer
    if (cartOverlay) {
        cartOverlay.addEventListener('click', () => {
            cartDrawer.classList.remove('open');
            cartOverlay.classList.remove('open');
            cartDrawer.setAttribute('aria-hidden', 'true');
            cartOverlay.setAttribute('aria-hidden', 'true');
        });
    }

    // Add to cart handler (delegated)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn.btn-secondary');
        // Make sure we are not on the cart page itself, and it's an add to cart button
        if (!btn || window.location.pathname.includes('cart.html')) return;
        // This check is to avoid conflict with modal's add to cart button
        if (btn.closest('.product-modal-actions')) return;

        e.preventDefault();
        const card = btn.closest('.product-card');
        if (!card) return;
        const title = card.querySelector('h3')?.innerText?.trim() || 'Product';
        const img = card.querySelector('img')?.src || '';
        const priceText = card.querySelector('.product-price')?.innerText || '$0';
        const price = parsePrice(priceText);
        const id = slugify(title);
        addToCart({ id, title, price, img });
    });

    // Add to cart from modal
    const modalAddToCartBtn = document.getElementById('modalAddToCart');
    if (modalAddToCartBtn) {
        const modal = document.getElementById('productModal');
        modalAddToCartBtn.addEventListener('click', () => {
            const modal = document.getElementById('productModal');
            const modalQtyInput = document.getElementById('modalQtyInput');
            if (modalAddToCartBtn.disabled) return;

            const qty = parseInt(modalQtyInput.value) || 1;
            const product = { id: modal.dataset.productId, title: modal.dataset.productTitle, price: parseFloat(modal.dataset.productPrice), img: modal.dataset.productImg };
            
            const existing = cart.items.find(i => i.id === product.id);
            if (existing) {
                existing.qty += qty;
            } else {
                cart.items.push({ ...product, qty: qty });
            }

            saveCart();
            renderCartCount();
            
            // Provide user feedback and close modal
            modalAddToCartBtn.disabled = true;
            setTimeout(() => {
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden', 'true');
                modalAddToCartBtn.innerHTML = 'Add to Cart';
                modalAddToCartBtn.disabled = false;
            }, 1500);
        });
    }

    // Cart item actions (remove, qty change)
    if (cartItemsEl) {
        cartItemsEl.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.cart-remove');
            if (removeBtn) {
                const id = removeBtn.dataset.id;
                removeFromCart(id);
                return;
            }
        });

        cartItemsEl.addEventListener('input', (e) => {
            if (e.target.classList.contains('cart-qty')) {
                const id = e.target.dataset.id;
                const qty = parseInt(e.target.value) || 1;
                updateQty(id, qty);
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (!cart.items.length) { alert('Your cart is empty.'); return; }
            // Placeholder checkout behavior for drawer
            alert('Checkout not implemented in demo. Please view full cart to proceed.');
            cartDrawer.classList.remove('open');
            if (cartOverlay) {
                cartOverlay.classList.remove('open');
                cartOverlay.setAttribute('aria-hidden', 'true');
            }
            cartDrawer.setAttribute('aria-hidden', 'true');
        });
    }

    /* Cart helpers */
    function loadCart() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            return raw ? JSON.parse(raw) : { items: [] };
        } catch (err) {
            return { items: [] };
        }
    }

    function saveCart() {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    function renderCartCount() {
        const count = cart.items.reduce((s, it) => s + it.qty, 0);
        if (cartCountEl) cartCountEl.innerText = count;
        if (mobileCartCount) mobileCartCount.innerText = count;
    }

    function renderCart() {
        // This function is for the cart drawer
        if (!cartItemsEl) return;
        cartItemsEl.innerHTML = '';
        if (!cart.items.length) {
            cartItemsEl.innerHTML = '<li class="empty">Your cart is empty.</li>';
            if(cartSubtotalEl) cartSubtotalEl.innerText = '$0.00';
            // update drawer totals
            if (drawerSummaryShipping) drawerSummaryShipping.innerText = '$0.00';
            if (drawerSummaryTax) drawerSummaryTax.innerText = '$0.00';
            if (drawerSummaryTotal) drawerSummaryTotal.innerText = '$0.00';
            return;
        }
        cart.items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'cart-item';
            li.innerHTML = `
                <img src="${item.img}" alt="${escapeHtml(item.title)}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${escapeHtml(item.title)}</div>
                    <div class="cart-item-meta">${formatCurrency(item.price)}</div>
                </div>
                <div class="cart-item-actions">
                    <input class="cart-qty" type="number" min="1" data-id="${item.id}" value="${item.qty}">
                    <button class="cart-remove" data-id="${item.id}" aria-label="Remove"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            cartItemsEl.appendChild(li);
        });
        const subtotal = cart.items.reduce((s, it) => s + it.price * it.qty, 0);
        if(cartSubtotalEl) cartSubtotalEl.innerText = formatCurrency(subtotal);
        // compute summary for drawer (use drawer inputs if present)
        const s = computeSummary();
        if (drawerSummaryShipping) drawerSummaryShipping.innerText = formatCurrency(s.shipping);
        if (drawerSummaryTax) drawerSummaryTax.innerText = formatCurrency(s.tax);
        if (drawerSummaryTotal) drawerSummaryTotal.innerText = formatCurrency(s.total);
    }

    function addToCart(product) {
        cart.items = cart.items || [];
        const existing = cart.items.find(i => i.id === product.id);
        if (existing) existing.qty += 1;
        else cart.items.push({ ...product, qty: 1 });
        saveCart();
        renderCartCount();
        // briefly animate cart button
        if (cartBtn) {
            cartBtn.classList.add('pulse');
            setTimeout(() => cartBtn.classList.remove('pulse'), 350);
        }
    }

    function removeFromCart(id) {
        cart.items = cart.items.filter(i => i.id !== id);
        saveCart();
        renderCart();
        renderCartCount();
        syncAllCartCounts();
    }

    function updateQty(id, qty) {
        const it = cart.items.find(i => i.id === id);
        if (!it) return;
        it.qty = Math.max(1, qty);
        saveCart();
        renderCart();
        renderCartCount();
        syncAllCartCounts();
    }

    /* Utilities */
    function parsePrice(text) {
        const n = (text || '').replace(/[^0-9.-]+/g, '');
        return parseFloat(n) || 0;
    }

    function formatCurrency(n) {
        return '$' + n.toFixed(2);
    }

    function slugify(str) {
        return str.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,'-');
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, function(ch) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
        });
    }

    function computeSummary() {
        const subtotal = cart.items.reduce((s, it) => s + it.price * it.qty, 0);
        const countryEl = (typeof drawerShippingCountry !== 'undefined' && drawerShippingCountry) ? drawerShippingCountry : shippingCountry;
        const country = countryEl ? countryEl.value : 'KE';
        let shipping = 0;
        if (subtotal === 0) shipping = 0;
        else if (country === 'KE') shipping = 3.99;
        else if (country === 'UG' || country === 'TZ') shipping = 9.99;
        else shipping = 19.99;
        const tax = +(subtotal * 0.16).toFixed(2);
        let discount = 0;
        const couponCode = (typeof drawerCouponInput !== 'undefined' && drawerCouponInput && drawerCouponInput.value) ? drawerCouponInput.value.trim().toUpperCase() : (couponInput ? couponInput.value.trim().toUpperCase() : '');
        if (couponCode === 'BELLA10') discount = +(subtotal * 0.10).toFixed(2);
        const total = +(subtotal + shipping + tax - discount).toFixed(2);
        return { subtotal: +subtotal.toFixed(2), shipping, tax, discount, total };
    }

    if (drawerApplyCoupon) {
        drawerApplyCoupon.addEventListener('click', () => {
            const code = drawerCouponInput.value.trim().toUpperCase();
            if (!code) return alert('Enter a coupon code');
            if (code === 'BELLA10') {
                alert('Coupon applied: 10% off');
            } else {
                alert('Invalid coupon');
            }
            renderCart();
        });
    }

    if (drawerEstimateShipping) {
        drawerEstimateShipping.addEventListener('click', () => {
            renderCart();
            alert('Shipping estimated based on country selection (demo).');
        });
    }

    /* Mobile navigation handlers */
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavClose = document.getElementById('mobileNavClose');
    const mobileCartBtn = document.getElementById('mobileCartBtn');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileNav);
    }

    if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
    if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);

    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && mobileNav && mobileNav.classList.contains('open')) {
            closeMobileNav();
        }
    });
    function openMobileNav() {
        if (!mobileNav) return;
        mobileNav.classList.add('open');
        mobileNavOverlay.classList.add('open');
        mobileNav.setAttribute('aria-hidden','false');
        mobileNavBtnSetExpanded(true);
    }

    function closeMobileNav() {
        if (!mobileNav) return;
        mobileNav.classList.remove('open');
        mobileNavOverlay.classList.remove('open');
        mobileNav.setAttribute('aria-hidden','true');
        mobileNavBtnSetExpanded(false);
    }

    function mobileNavBtnSetExpanded(v) {
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', v ? 'true' : 'false');
    }

    if (mobileCartBtn) {
        mobileCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeMobileNav();
            cartDrawer.classList.add('open');
            cartOverlay.classList.add('open');
            cartDrawer.setAttribute('aria-hidden', 'false');
            cartOverlay.setAttribute('aria-hidden', 'false');
            renderCart();
        });
    }

    function populateMobileNav() {
        const mainNavList = document.querySelector('.main-nav ul');
        const mobileNavList = document.querySelector('.mobile-nav-list');

        if (!mainNavList || !mobileNavList) return;

        mobileNavList.innerHTML = ''; // Clear existing items

        // Use event delegation for submenus
        mobileNavList.addEventListener('click', function(e) {
            const toggle = e.target.closest('.mobile-submenu-toggle');
            if (!toggle) return;
            
            e.preventDefault();
            toggle.classList.toggle('active');
            const submenu = toggle.nextElementSibling;
            if (submenu) submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        });

        mainNavList.querySelectorAll(':scope > li').forEach(li => {
            const newLi = li.cloneNode(true);

            // Exclude the desktop cart icon
            if (newLi.classList.contains('nav-cart')) {
                return;
            }

            // Convert dropdowns to accordion-style toggles for mobile
            const dropdown = newLi.querySelector('.dropdown-menu');
            if (dropdown) {
                const mainLink = newLi.querySelector(':scope > a');
                mainLink.removeAttribute('href'); // Make the top-level item a toggle, not a link
                mainLink.classList.add('mobile-submenu-toggle');

                // Hide submenu by default
                dropdown.style.display = 'none';
                dropdown.classList.remove('dropdown-menu');
                dropdown.classList.add('mobile-submenu');

                // Handle nested submenus (e.g., Cleanser, Toner)
                dropdown.querySelectorAll('.has-submenu').forEach(subLi => {
                    const subLink = subLi.querySelector(':scope > a');
                    subLink.removeAttribute('href');
                    subLink.classList.add('mobile-submenu-toggle');
                    const nestedSubmenu = subLi.querySelector('.submenu');
                    nestedSubmenu.style.display = 'none';
                    nestedSubmenu.classList.add('mobile-submenu');
                });
            }
            mobileNavList.appendChild(newLi);
        });
    }

    populateMobileNav();
    /

    syncAllCartCounts();
    // Add this to the global scope so it can be called frtion() {
        syncAllCartCounts();
    };

    /* Features marquee */ction initFeaturesMarquee(){
        const featuresContainer = document.querySelector('.features-content');
        if (!featuresContainer) return;
        if (featuresContainer.querySelector('.features-track')) return;

        const track = document.createElement('div');
        track.className = 'features-track';

        while (featuresContainer.firstChild) {
            track.appendChild(featuresContainer.firstChild);
        }

        track.innerHTML = track.innerHTML + track.innerHTML;
        featuresContainer.appendChild(track);

        function setMarqueeDuration() {
            const speed = 120;
            const fullWidth = track.scrollWidth || track.getBoundingClientRect().width;
            const originalWidth = Math.max(1, fullWidth / 2);
            const duration = Math.max(6, Math.round(originalWidth / speed));
            featuresContainer.style.setProperty('--marquee-duration', duration + 's');
        }

        window.requestAnimationFrame(() => setMarqueeDuration());
        window.addEventListener('resize', () => setMarqueeDuration());
    })();

    /* Back to Top Button */
    const backToTopBtn = document.getElementById('backToTopBtn');

    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /* Image loading with spinner */
    document.querySelectorAll('.product-image-container').forEach(container => {
        const img = container.querySelector('img');
        const spinner = container.querySelector('.spinner');

        // If image is already cached by the browser, it might load instantly
        if (img.complete) {
            spinner.style.opacity = '0';
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', () => {
                spinner.style.opacity = '0';
                img.style.opacity = '1';
            });
        }
    });
});