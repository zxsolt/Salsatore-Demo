(() => {
    'use strict';

    const onReady = (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    };

    onReady(() => {
        const navToggle = document.querySelector('[data-nav-toggle]');
        const siteNav = document.querySelector('[data-site-nav]');

        const closeNav = () => {
            if (!navToggle || !siteNav) return;
            navToggle.setAttribute('aria-expanded', 'false');
            siteNav.classList.remove('is-open');
            document.body.classList.remove('nav-open');
        };

        navToggle?.addEventListener('click', () => {
            const open = navToggle.getAttribute('aria-expanded') !== 'true';
            navToggle.setAttribute('aria-expanded', String(open));
            siteNav?.classList.toggle('is-open', open);
            document.body.classList.toggle('nav-open', open);
        });
        siteNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));

        initCarousel();
        initBooking();
        initReveals();
    });

    function initReveals() {
        const items = [...document.querySelectorAll('[data-reveal]')];
        if (!items.length) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
            items.forEach((item) => item.classList.add('is-visible'));
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.14 });
        items.forEach((item) => observer.observe(item));
    }

    function initCarousel() {
        const carousel = document.querySelector('[data-carousel]');
        if (!carousel) return;

        const slides = [...carousel.querySelectorAll('[data-slide]')];
        const previous = carousel.querySelector('[data-carousel-prev]');
        const next = carousel.querySelector('[data-carousel-next]');
        const currentLabel = carousel.querySelector('[data-carousel-current]');
        const totalLabel = carousel.querySelector('[data-carousel-total]');
        const toggle = carousel.querySelector('[data-carousel-toggle]');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let current = 0;
        let timer = null;
        let pointerStart = null;
        let held = reduceMotion;

        if (totalLabel) totalLabel.textContent = String(slides.length).padStart(2, '0');

        const show = (index) => {
            current = (index + slides.length) % slides.length;
            slides.forEach((slide, slideIndex) => {
                const active = slideIndex === current;
                slide.classList.toggle('is-active', active);
                slide.setAttribute('aria-hidden', String(!active));
            });
            if (currentLabel) currentLabel.textContent = String(current + 1).padStart(2, '0');
        };

        const stop = () => {
            if (timer) window.clearInterval(timer);
            timer = null;
        };
        const start = () => {
            stop();
            if (!held && slides.length > 1) timer = window.setInterval(() => show(current + 1), 6500);
        };

        const syncToggle = () => {
            if (!toggle) return;
            toggle.textContent = held ? 'Reproducir' : 'Pausar';
            toggle.setAttribute('aria-pressed', String(held));
        };

        previous?.addEventListener('click', () => { show(current - 1); start(); });
        next?.addEventListener('click', () => { show(current + 1); start(); });
        toggle?.addEventListener('click', () => {
            held = !held;
            syncToggle();
            if (held) stop(); else start();
        });
        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);
        carousel.addEventListener('focusin', stop);
        carousel.addEventListener('focusout', start);
        carousel.addEventListener('pointerdown', (event) => { pointerStart = event.clientX; });
        carousel.addEventListener('pointerup', (event) => {
            if (pointerStart === null) return;
            const distance = event.clientX - pointerStart;
            pointerStart = null;
            if (Math.abs(distance) < 45) return;
            show(current + (distance < 0 ? 1 : -1));
            start();
        });

        show(0);
        syncToggle();
        start();
    }

    function initBooking() {
        const modal = document.querySelector('[data-booking-modal]');
        const panel = document.querySelector('[data-booking-panel]');
        const form = document.querySelector('[data-booking-form]');
        if (!modal || !panel || !form || typeof window.SalsatoreDemo !== 'object') return;

        const config = window.SalsatoreDemo;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const steps = [...form.querySelectorAll('[data-booking-step]')];
        const progress = modal.querySelector('[data-booking-progress]');
        const stepCurrent = modal.querySelector('[data-step-current]');
        const stepLabel = modal.querySelector('[data-step-label]');
        const nextButton = modal.querySelector('[data-booking-next]');
        const backButton = modal.querySelector('[data-booking-back]');
        const confirmButton = modal.querySelector('[data-booking-confirm]');
        const finishButton = modal.querySelector('[data-booking-finish]');
        const locationsRoot = modal.querySelector('[data-location-choices]');
        const classesRoot = modal.querySelector('[data-class-choices]');
        const levelsRoot = modal.querySelector('[data-level-choices]');
        const slotsRoot = modal.querySelector('[data-slot-choices]');
        const formError = modal.querySelector('[data-form-error]');
        const summary = modal.querySelector('[data-booking-summary]');
        const labels = ['Sede', 'Ritmo y nivel', 'Horario', 'Tus datos', 'Confirmación'];
        const state = { step: 1, location: '', classId: '', level: '', slot: '' };
        let opener = null;

        const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]);

        const renderLocations = () => {
            locationsRoot.innerHTML = config.locations.map((location) => `
                <button class="choice-card${state.location === location.id ? ' is-selected' : ''}" type="button" data-location="${escapeHtml(location.id)}" aria-pressed="${state.location === location.id}">
                    <strong>${escapeHtml(location.name)}</strong><span>${escapeHtml(location.address)}</span>
                </button>
            `).join('');
        };

        const renderClasses = () => {
            classesRoot.innerHTML = config.classes.map((item) => `
                <button class="choice-card${state.classId === item.id ? ' is-selected' : ''}" type="button" data-booking-class="${escapeHtml(item.id)}" aria-pressed="${state.classId === item.id}">
                    <strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.levels.length)} niveles</span>
                </button>
            `).join('');
            renderLevels();
        };

        const renderLevels = () => {
            const chosen = config.classes.find((item) => item.id === state.classId);
            if (!chosen) {
                levelsRoot.innerHTML = '';
                return;
            }
            levelsRoot.innerHTML = chosen.levels.map((level) => `
                <button class="level-chip${state.level === level ? ' is-selected' : ''}" type="button" data-level="${escapeHtml(level)}" aria-pressed="${state.level === level}">${escapeHtml(level)}</button>
            `).join('');
        };

        const renderSlots = () => {
            slotsRoot.innerHTML = config.slots.map((slot) => {
                const key = `${slot.day}|${slot.time}`;
                return `<button class="slot-card${state.slot === key ? ' is-selected' : ''}" type="button" data-slot="${escapeHtml(key)}" aria-pressed="${state.slot === key}"><strong>${escapeHtml(slot.day)}</strong><span>${escapeHtml(slot.time)}</span></button>`;
            }).join('');
        };

        const selectionError = (message) => {
            let error = form.querySelector('.selection-error');
            if (!error) {
                error = document.createElement('p');
                error.className = 'form-error selection-error';
                error.setAttribute('role', 'alert');
                steps[state.step - 1]?.append(error);
            }
            error.textContent = message;
        };

        const clearErrors = () => {
            form.querySelectorAll('.selection-error').forEach((error) => error.remove());
            if (formError) formError.textContent = '';
        };

        const showStep = (step) => {
            state.step = Math.max(1, Math.min(5, step));
            steps.forEach((item) => item.classList.toggle('is-active', Number(item.dataset.bookingStep) === state.step));
            if (progress) progress.style.transform = `scaleX(${state.step / 5})`;
            progress?.parentElement?.setAttribute('aria-valuenow', String(state.step));
            if (stepCurrent) stepCurrent.textContent = String(state.step);
            if (stepLabel) stepLabel.textContent = labels[state.step - 1];
            backButton.hidden = state.step === 1 || state.step === 5;
            nextButton.hidden = state.step >= 4;
            confirmButton.hidden = state.step !== 4;
            finishButton.hidden = state.step !== 5;
            clearErrors();
            panel.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        };

        const validateStep = () => {
            if (state.step === 1 && !state.location) {
                selectionError('Elige una sede para continuar.');
                return false;
            }
            if (state.step === 2 && (!state.classId || !state.level)) {
                selectionError('Elige un ritmo y un nivel para continuar.');
                return false;
            }
            if (state.step === 3 && !state.slot) {
                selectionError('Elige uno de los horarios de demostración.');
                return false;
            }
            return true;
        };

        const buildSummary = () => {
            const location = config.locations.find((item) => item.id === state.location);
            const danceClass = config.classes.find((item) => item.id === state.classId);
            const [day, time] = state.slot.split('|');
            summary.innerHTML = `
                <div><span>Sede</span><strong>${escapeHtml(location?.name || '')}</strong></div>
                <div><span>Clase</span><strong>${escapeHtml(danceClass?.name || '')}, ${escapeHtml(state.level)}</strong></div>
                <div><span>Horario</span><strong>${escapeHtml(day)}, ${escapeHtml(time)}</strong></div>
                <div><span>Estado</span><strong>Solo demostración</strong></div>
            `;
        };

        const reset = (presetClass = '') => {
            form.reset();
            Object.assign(state, { step: 1, location: '', classId: presetClass, level: '', slot: '' });
            renderLocations();
            renderClasses();
            renderSlots();
            showStep(1);
        };

        const open = (button) => {
            opener = button;
            reset(button?.dataset.class || '');
            modal.hidden = false;
            document.body.classList.add('booking-open');
            window.requestAnimationFrame(() => panel.focus());
        };

        const close = () => {
            modal.hidden = true;
            document.body.classList.remove('booking-open');
            opener?.focus();
        };

        document.querySelectorAll('[data-open-booking]').forEach((button) => button.addEventListener('click', () => open(button)));
        modal.querySelectorAll('[data-close-booking]').forEach((button) => button.addEventListener('click', close));
        locationsRoot.addEventListener('click', (event) => {
            const button = event.target.closest('[data-location]');
            if (!button) return;
            state.location = button.dataset.location;
            clearErrors();
            renderLocations();
        });
        classesRoot.addEventListener('click', (event) => {
            const button = event.target.closest('[data-booking-class]');
            if (!button) return;
            state.classId = button.dataset.bookingClass;
            state.level = '';
            clearErrors();
            renderClasses();
        });
        levelsRoot.addEventListener('click', (event) => {
            const button = event.target.closest('[data-level]');
            if (!button) return;
            state.level = button.dataset.level;
            clearErrors();
            renderLevels();
        });
        slotsRoot.addEventListener('click', (event) => {
            const button = event.target.closest('[data-slot]');
            if (!button) return;
            state.slot = button.dataset.slot;
            clearErrors();
            renderSlots();
        });
        nextButton.addEventListener('click', () => {
            clearErrors();
            if (validateStep()) showStep(state.step + 1);
        });
        backButton.addEventListener('click', () => showStep(state.step - 1));
        finishButton.addEventListener('click', close);
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            clearErrors();
            const required = [...form.querySelectorAll('input[required]')];
            const invalid = required.find((input) => !input.checkValidity());
            if (invalid) {
                if (formError) formError.textContent = invalid.validity.typeMismatch ? 'Escribe un email válido.' : 'Completa todos los campos para ver la confirmación.';
                invalid.focus();
                return;
            }
            buildSummary();
            showStep(5);
        });

        document.addEventListener('keydown', (event) => {
            if (modal.hidden) return;
            if (event.key === 'Escape') {
                close();
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = [...panel.querySelectorAll('button:not([hidden]):not([disabled]), input:not([hidden]):not([disabled]), a[href]')].filter((item) => item.offsetParent !== null);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        reset();
    }
})();

