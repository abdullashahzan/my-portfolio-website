/* Portfolio navigation, galleries and interactive exhibits. */
(() => {
    'use strict';
    const app = document.getElementById('gameApp');
    if (!app) return;
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const zones = ['achievements', 'research', 'projects', 'journey', 'about', 'work', 'community'];
    const names = {
        achievements: 'Trophy Room',
        research: 'Research Lab',
        projects: 'Workshop',
        journey: 'Milestones',
        work: 'Work & internships',
        community: 'Nori neighbourhood',
        about: 'Human behind the work'
    };
    const roles = ['recruiter', 'researcher', 'explorer'];
    const routes = {
        recruiter: ['journey', 'work', 'projects', 'achievements', 'about', 'community'],
        researcher: ['journey', 'research', 'projects', 'about', 'achievements', 'community'],
        explorer: ['journey', 'research', 'community', 'projects', 'work', 'achievements', 'about']
    };
    const storageKey = 'shahzan-field-guide-v1';
    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
    } catch (_) {}
    let state = {
        role: roles.includes(saved.role) ? saved.role : null,
        visited: Array.isArray(saved.visited) ? [...new Set(saved.visited.filter(z => zones.includes(z)))] : [],
        secrets: Array.isArray(saved.secrets) ? saved.secrets.filter(s => ['star', 'konami'].includes(s)) : [],
        solved: Boolean(saved.solved),
        paper: Boolean(saved.paper),
        evidence: Boolean(saved.evidence),
        certificate: Boolean(saved.certificate),
        circuit: Boolean(saved.circuit),
    };
    let toastTimer;
    const mediaMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = mediaMotion.matches;
    const csrf = $('[name=csrfmiddlewaretoken]').value;
    function persist() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(state));
        } catch (_) {}
    }

    function toast(text) {
        const el = $('#toast');
        el.textContent = text;
        el.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('visible'), 4000);
    }

    function updateProgress() {
        $$('[data-stamp]').forEach(el => {
            const earned = state.visited.includes(el.dataset.stamp);
            el.classList.toggle('earned', earned);
            el.setAttribute('aria-label', `${names[el.dataset.stamp]}: ${earned ? 'discovered' : 'not yet discovered'}`);
        });
        document.dispatchEvent(new CustomEvent('nori:progress'));
        $$('.map-node').forEach(el => el.classList.toggle('discovered', state.visited.includes(el.dataset.zone)));
        $$('[data-role]').forEach(b => {
            const chosen = b.dataset.role === state.role;
            b.classList.toggle('selected', chosen);
            b.setAttribute('aria-pressed', String(chosen));
        });
    }

    function travel(destination) {
        const target = document.getElementById(destination);
        if (target) {
            target.scrollIntoView({
                behavior: paused ? 'instant' : 'smooth',
                block: 'start'
            });
        }
    }

    function visit(room) {
        if (state.visited.includes(room)) return;
        state.visited.push(room);
        persist();
        updateProgress();
    }
    // The scene controller owns introductions and discovery timing.
    async function api(url, body) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 18000);
        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrf
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'This action is temporarily unavailable.');
            return data;
        } finally {
            clearTimeout(timer);
        }
    }

    const selectedRole = app.dataset.visitRole;
    if (selectedRole) {
        api(app.dataset.visitUrl, { role: selectedRole }).then(({ counts }) => {
            $('#visitorTotals').textContent = `Self-selected visits: ${counts.recruiter || 0} hiring · ${counts.researcher || 0} research · ${counts.explorer || 0} curious.`;
        }).catch(() => { /* The route is already rendered. */ });
    }

    function motion() {
        document.documentElement.classList.toggle('motion-paused', paused);
        $('#motionToggle').textContent = paused ? 'Resume motion' : 'Pause motion';
        $('#motionToggle').setAttribute('aria-pressed', String(paused));
    }
    $('#motionToggle').addEventListener('click', () => {
        paused = !paused;
        motion();
    });
    mediaMotion.addEventListener('change', e => {
        paused = e.matches;
        motion();
    });
    $('#resetJourney').addEventListener('click', () => {
        state.visited = [];
        state.secrets = [];
        state.solved = false;
        state.role = null;
        state.paper = state.certificate = state.evidence = state.circuit = false;
        persist();
        updateProgress();
        toast('Discoveries reset. Visitor totals are unchanged.');
    });
    const mobileNav = $('#mobileNav'),
        menuToggle = $('#menuToggle');
    menuToggle.addEventListener('click', () => {
        mobileNav.hidden = !mobileNav.hidden;
        menuToggle.setAttribute('aria-expanded', String(!mobileNav.hidden));
    });
    $$('#mobileNav a').forEach(a => a.addEventListener('click', () => {
        mobileNav.hidden = true;
        menuToggle.setAttribute('aria-expanded', 'false');
    }));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !mobileNav.hidden) {
            mobileNav.hidden = true;
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.focus();
        }
    });
    $$('dialog').forEach(dialog => {
        $('.dialog-close', dialog)?.addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', e => {
            if (e.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
        });
        dialog.addEventListener('close', () => {
            document.body.style.overflow = '';
        });
    });

    function openDialog(dialog) {
        if (!dialog.open) {
            dialog.showModal();
            document.body.style.overflow = 'hidden';
        }
    }

    // Search and inspect the complete admin-managed certificate collection.
    const collections = $$('.collection');
    let beforeSearch = null;
    $('#certificateSearch')?.addEventListener('input', e => {
        const query = e.target.value.trim().toLocaleLowerCase();
        if (query && !beforeSearch) beforeSearch = collections.map(c => c.open);
        let count = 0;
        collections.forEach((collection, index) => {
            let matches = 0;
            $$('.certificate', collection).forEach(card => {
                card.hidden = Boolean(query) && !`${collection.dataset.category} ${card.dataset.title}`.toLocaleLowerCase().includes(query);
                if (!card.hidden) matches++;
            });
            collection.hidden = Boolean(query) && matches === 0;
            if (query) collection.open = matches > 0;
            else if (beforeSearch) collection.open = beforeSearch[index];
            count += matches;
        });
        if (!query) beforeSearch = null;
        $('#certificateCount').textContent = query ? `${count} certificate${count === 1 ? '' : 's'} found` : '';
    });
    $('#expandCollections')?.addEventListener('click', () => {
        const button = $('#expandCollections');
        const open = button.getAttribute('aria-pressed') !== 'true';
        collections.forEach(c => {
            if (!c.hidden) c.open = open;
        });
        button.setAttribute('aria-pressed', String(open));
        button.textContent = open ? 'Close all collections −' : 'Open all collections +';
    });
    let certificateList = [],
        certificateIndex = 0;

    function showCertificate() {
        const item = certificateList[certificateIndex];
        $('#certificateImage').src = item.dataset.src;
        $('#certificateImage').alt = item.dataset.title;
        $('#certificateCaption').textContent = `${item.dataset.title} · ${certificateIndex + 1} / ${certificateList.length}`;
    }
    $$('.certificate:not(:disabled)').forEach(card => card.addEventListener('click', () => {
        state.certificate = true;
        persist();
        updateProgress();
        certificateList = $$('.certificate:not(:disabled)').filter(c => c.dataset.cat === card.dataset.cat && !c.hidden);
        certificateIndex = certificateList.indexOf(card);
        showCertificate();
        openDialog($('#certificateDialog'));
    }));

    function changeCertificate(direction) {
        if (!certificateList.length) return;
        certificateIndex = (certificateIndex + direction + certificateList.length) % certificateList.length;
        showCertificate();
    }
    $('#previousCertificate').addEventListener('click', () => changeCertificate(-1));
    $('#nextCertificate').addEventListener('click', () => changeCertificate(1));
    $('#certificateDialog').addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') changeCertificate(1);
        if (e.key === 'ArrowLeft') changeCertificate(-1);
    });
    $$('.filter').forEach(button => button.addEventListener('click', () => {
        $$('.filter').forEach(b => {
            b.classList.toggle('active', b === button);
            b.setAttribute('aria-pressed', String(b === button));
        });
        let count = 0;
        $$('.paper').forEach(p => {
            p.hidden = button.dataset.status !== 'all' && p.dataset.status !== button.dataset.status;
            if (!p.hidden) count++;
        });
        $('#researchEmpty').hidden = count > 0;
    }));
    // Phosphene-inspired dot puzzle. Deliberately illustrative, never clinical.
    if ($('#signalCanvas')) {
        const canvas = $('#signalCanvas'),
            ctx = canvas.getContext('2d');
        const shapes = ['heart', 'star', 'arrow'];
        let shape, dots = [],
            signalWon = false;
        const buffers = document.createElement('canvas');
        buffers.width = 480;
        buffers.height = 360;
        const buffer = buffers.getContext('2d');

        function newSignal() {
            shape = shapes[Math.floor(Math.random() * shapes.length)];
            signalWon = false;
            buffer.clearRect(0, 0, 480, 360);
            buffer.fillStyle = '#fff';
            buffer.beginPath();
            if (shape === 'heart') {
                buffer.moveTo(240, 285);
                buffer.bezierCurveTo(45, 165, 135, 25, 240, 115);
                buffer.bezierCurveTo(345, 25, 435, 165, 240, 285);
            } else if (shape === 'star') {
                for (let i = 0; i < 10; i++) {
                    const a = -Math.PI / 2 + i * Math.PI / 5,
                        r = i % 2 ? 55 : 125;
                    const x = 240 + Math.cos(a) * r,
                        y = 180 + Math.sin(a) * r;
                    if (i === 0) buffer.moveTo(x, y);
                    else buffer.lineTo(x, y);
                }
            } else {
                buffer.moveTo(110, 160);
                buffer.lineTo(260, 160);
                buffer.lineTo(260, 90);
                buffer.lineTo(370, 180);
                buffer.lineTo(260, 270);
                buffer.lineTo(260, 200);
                buffer.lineTo(110, 200);
            }
            buffer.closePath();
            buffer.fill();
            const pixels = buffer.getImageData(0, 0, 480, 360).data;
            dots = [];
            for (let y = 25; y < 340; y += 18)
                for (let x = 25; x < 460; x += 18) dots.push({
                    x,
                    y,
                    on: pixels[(y * 480 + x) * 4 + 3] > 0,
                    noise: Math.random(),
                    radius: 1.7 + Math.random() * 2.5
                });
            $('#signalFeedback').textContent = 'One clue: more dots can reveal more structure.';
            $('#signalAlternative').textContent = 'Give me a text clue';
            drawSignal();
        }

        function drawSignal() {
            if (!ctx) return;
            const clarity = Number($('#signalRange').value) / 100;
            ctx.fillStyle = '#1e1c28';
            ctx.fillRect(0, 0, 480, 360);
            dots.forEach(dot => {
                const visible = dot.on ? dot.noise < clarity : dot.noise > (.84 + clarity * .15);
                ctx.beginPath();
                ctx.fillStyle = visible ? '#e2c1ff' : '#393045';
                ctx.arc(dot.x, dot.y, visible ? dot.radius : 1, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        $('#signalRange').addEventListener('input', e => {
            $('#signalValue').value = e.target.value + '%';
            drawSignal();
        });
        $('#newSignal').addEventListener('click', newSignal);
        $('#signalAlternative').addEventListener('click', () => {
            const clues = {
                heart: 'Text clue: a symbol of affection, with two rounded lobes and a point.',
                star: 'Text clue: a five-pointed symbol you might see in the night sky.',
                arrow: 'Text clue: a directional symbol pointing to the right.'
            };
            $('#signalFeedback').textContent = clues[shape];
        });
        $$('[data-guess]').forEach(button => button.addEventListener('click', () => {
            if (button.dataset.guess === shape) {
                $('#signalFeedback').textContent = 'Signal decoded! You found the ' + shape + '. The research explores much more complex versions of this question.';
                if (!signalWon) {
                    signalWon = true;
                    state.solved = true;
                    document.dispatchEvent(new CustomEvent('nori:celebrate'));
                    setTimeout(updateProgress, 0);
                    persist();
                    toast('✦ Side quest complete: Signal Finder');
                }
            } else {
                $('#signalFeedback').textContent = 'Not quite. Try increasing the signal clarity—or ask for a text clue.';
            }
        }));
        newSignal();
    }
    function discoverSecret(secret) {
        if (!state.secrets.includes(secret)) {
            state.secrets.push(secret);
            setTimeout(updateProgress, 0);
            persist();
        }
        $('#discoveryText').textContent = secret === 'konami' ? 'You know the old code. Somewhere, a very tiny arcade cabinet just applauded. Secret: curiosity has no prerequisites.' : 'You pressed the suspicious button. Excellent research instincts. Your reward: honorary Head of Suspicious Button Research. Nori has approved the imaginary badge.';
        openDialog($('#discoveryDialog'));
    }
    $('#secretStar')?.addEventListener('click', () => discoverSecret('star'));
    $('#discoveryContinue').addEventListener('click', () => $('#discoveryDialog').close());
    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let codeIndex = 0;
    document.addEventListener('keydown', e => {
        if (e.target.closest('input,textarea,[contenteditable=true]') || $$('dialog[open]').length) return;
        if (e.key === code[codeIndex]) {
            codeIndex++;
            if (codeIndex === code.length) {
                codeIndex = 0;
                discoverSecret('konami');
            }
        } else codeIndex = e.key === code[0] ? 1 : 0;
    });
    window.Nori = {
        state,
        routes,
        names,
        travel,
        visit,
        persist,
        updateProgress,
        toast,
        api,
        get paused() {
            return paused;
        }
    };
    updateProgress();
    motion();
})();
