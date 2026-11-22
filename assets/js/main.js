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

        initPagePolish();
        initCarousel();
        initBooking();
        initReveals();
    });

    function initPagePolish() {
        const header = document.querySelector('[data-site-header]');
        const navLinks = [...document.querySelectorAll('[data-site-nav] a[href^="#"]')];
        const favoriteButtons = [...document.querySelectorAll('[data-favorite-event]')];
        const eventGrid = document.querySelector('[data-reference-event-grid]');
        const eventNext = document.querySelector('[data-reference-event-next]');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
        syncHeader();
        window.addEventListener('scroll', syncHeader, { passive: true });

        favoriteButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const selected = button.getAttribute('aria-pressed') !== 'true';
                button.setAttribute('aria-pressed', String(selected));
                button.setAttribute('aria-label', selected ? 'Quitar evento de guardados' : 'Guardar evento');
            });
        });

        eventNext?.addEventListener('click', () => {
            if (!eventGrid) return;
            if (window.matchMedia('(max-width: 48rem)').matches) {
                const firstCard = eventGrid.querySelector('.reference-event-card');
                eventGrid.scrollBy({ left: (firstCard?.getBoundingClientRect().width || 320) + 18, behavior: reduceMotion ? 'auto' : 'smooth' });
                return;
            }
            eventGrid.classList.add('is-shuffling');
            window.setTimeout(() => {
                const firstCard = eventGrid.firstElementChild;
                if (firstCard) eventGrid.append(firstCard);
                eventGrid.querySelectorAll('.reference-event-card').forEach((card, index) => card.classList.toggle('reference-event-card--active', index === 1));
                eventGrid.classList.remove('is-shuffling');
            }, reduceMotion ? 0 : 180);
        });

        if (!('IntersectionObserver' in window)) return;
        const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
        const observer = new IntersectionObserver((entries) => {
            const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!current) return;
            navLinks.forEach((link) => {
                const active = link.getAttribute('href') === `#${current.target.id}`;
                link.classList.toggle('is-current', active);
                if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
            });
        }, { rootMargin: '-28% 0px -58% 0px', threshold: [0, .15, .5] });
        sections.forEach((section) => observer.observe(section));
    }

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
        const purposesRoot = modal.querySelector('[data-purpose-choices]');
        const locationsRoot = modal.querySelector('[data-location-choices]');
        const classesRoot = modal.querySelector('[data-class-choices]');
        const eventsRoot = modal.querySelector('[data-event-choices]');
        const classFields = modal.querySelector('[data-class-booking-fields]');
        const levelsRoot = modal.querySelector('[data-level-choices]');
        const slotsRoot = modal.querySelector('[data-slot-choices]');
        const selectionTitle = modal.querySelector('[data-selection-title]');
        const selectionCopy = modal.querySelector('[data-selection-copy]');
        const slotTitle = modal.querySelector('[data-slot-title]');
        const slotCopy = modal.querySelector('[data-slot-copy]');
        const formError = modal.querySelector('[data-form-error]');
        const summary = modal.querySelector('[data-booking-summary]');
        const labels = ['Reserva', 'Sede', 'Clase o evento', 'Fecha y hora', 'Tus datos', 'Confirmación'];
        const state = { step: 1, purpose: '', location: '', classId: '', eventId: '', level: '', slot: '' };
        let opener = null;

        const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]);

        const renderPurposes = () => {
            const choices = [
                { id: 'class', name: 'Clases', description: 'Horarios regulares y clase de prueba' },
                { id: 'event', name: 'Eventos', description: 'Reserva una plaza para la próxima cita' },
            ];
            purposesRoot.innerHTML = choices.map((choice) => `
                <button class="choice-card${state.purpose === choice.id ? ' is-selected' : ''}" type="button" data-purpose="${choice.id}" aria-pressed="${state.purpose === choice.id}">
                    <strong>${choice.name}</strong><span>${choice.description}</span>
                </button>
            `).join('');
        };

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

        const renderEvents = () => {
            eventsRoot.innerHTML = (config.events || []).map((item) => `
                <button class="choice-card${state.eventId === item.id ? ' is-selected' : ''}" type="button" data-booking-event="${escapeHtml(item.id)}" aria-pressed="${state.eventId === item.id}">
                    <strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.location)}</span>
                </button>
            `).join('');
        };

        const syncSelectionMode = () => {
            const isEvent = state.purpose === 'event';
            classFields.hidden = isEvent;
            eventsRoot.hidden = !isEvent;
            if (selectionTitle) selectionTitle.textContent = isEvent ? 'Elige un evento' : '¿Qué te apetece aprender?';
            if (selectionCopy) selectionCopy.textContent = isEvent ? 'Selecciona la cita para la que quieres reservar.' : 'Elige ritmo y nivel. Puedes cambiarlo después.';
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
            const chosenEvent = (config.events || []).find((item) => item.id === state.eventId);
            const availableSlots = state.purpose === 'event' ? (chosenEvent?.sessions || []) : config.slots;
            if (slotTitle) slotTitle.textContent = state.purpose === 'event' ? 'Confirma la fecha' : 'Elige un horario';
            if (slotCopy) slotCopy.textContent = state.purpose === 'event' ? 'La fecha definitiva se confirmará antes de realizar cualquier pago.' : 'Selecciona la opción que te viene mejor.';
            slotsRoot.innerHTML = availableSlots.map((slot) => {
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
            state.step = Math.max(1, Math.min(6, step));
            steps.forEach((item) => item.classList.toggle('is-active', Number(item.dataset.bookingStep) === state.step));
            if (progress) progress.style.transform = `scaleX(${state.step / 6})`;
            progress?.parentElement?.setAttribute('aria-valuenow', String(state.step));
            if (stepCurrent) stepCurrent.textContent = String(state.step);
            if (stepLabel) stepLabel.textContent = labels[state.step - 1];
            backButton.hidden = state.step === 1 || state.step === 6;
            nextButton.hidden = state.step >= 5;
            confirmButton.hidden = state.step !== 5;
            finishButton.hidden = state.step !== 6;
            clearErrors();
            panel.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        };

        const validateStep = () => {
            if (state.step === 1 && !state.purpose) {
                selectionError('Elige clases o eventos para continuar.');
                return false;
            }
            if (state.step === 2 && !state.location) {
                selectionError('Elige una sede para continuar.');
                return false;
            }
            if (state.step === 3 && state.purpose === 'class' && (!state.classId || !state.level)) {
                selectionError('Elige un ritmo y un nivel para continuar.');
                return false;
            }
            if (state.step === 3 && state.purpose === 'event' && !state.eventId) {
                selectionError('Elige un evento para continuar.');
                return false;
            }
            if (state.step === 4 && !state.slot) {
                selectionError('Elige uno de los horarios de demostración.');
                return false;
            }
            return true;
        };

        const buildSummary = () => {
            const location = config.locations.find((item) => item.id === state.location);
            const danceClass = config.classes.find((item) => item.id === state.classId);
            const event = (config.events || []).find((item) => item.id === state.eventId);
            const [day, time] = state.slot.split('|');
            summary.innerHTML = `
                <div><span>Reserva</span><strong>${state.purpose === 'event' ? 'Evento' : 'Clase'}</strong></div>
                <div><span>Sede</span><strong>${escapeHtml(location?.name || '')}</strong></div>
                <div><span>${state.purpose === 'event' ? 'Evento' : 'Clase'}</span><strong>${state.purpose === 'event' ? escapeHtml(event?.name || '') : `${escapeHtml(danceClass?.name || '')}, ${escapeHtml(state.level)}`}</strong></div>
                <div><span>Fecha</span><strong>${escapeHtml(day)}, ${escapeHtml(time)}</strong></div>
                <div><span>Estado</span><strong>Solo demostración</strong></div>
            `;
        };

        const reset = (presetPurpose = '', presetClass = '', presetEvent = '') => {
            form.reset();
            Object.assign(state, { step: 1, purpose: presetPurpose, location: '', classId: presetClass, eventId: presetEvent, level: '', slot: '' });
            renderPurposes();
            renderLocations();
            renderClasses();
            renderEvents();
            syncSelectionMode();
            renderSlots();
            showStep(presetPurpose ? 2 : 1);
        };

        const open = (button) => {
            opener = button;
            const presetClass = button?.dataset.class || '';
            const presetEvent = button?.dataset.event || '';
            const presetPurpose = button?.dataset.bookingType || (presetClass ? 'class' : presetEvent ? 'event' : '');
            reset(presetPurpose, presetClass, presetEvent);
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
        purposesRoot.addEventListener('click', (event) => {
            const button = event.target.closest('[data-purpose]');
            if (!button) return;
            state.purpose = button.dataset.purpose;
            state.classId = '';
            state.eventId = '';
            state.level = '';
            state.slot = '';
            clearErrors();
            renderPurposes();
            renderClasses();
            renderEvents();
            syncSelectionMode();
            renderSlots();
        });
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
        eventsRoot.addEventListener('click', (event) => {
            const button = event.target.closest('[data-booking-event]');
            if (!button) return;
            state.eventId = button.dataset.bookingEvent;
            state.slot = '';
            clearErrors();
            renderEvents();
            renderSlots();
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
            showStep(6);
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

