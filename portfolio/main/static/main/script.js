/* Nori's field guide. Content remains server-rendered; play is an enhancement. */
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
        recruiter: ['work', 'projects', 'journey', 'achievements', 'about', 'research', 'community'],
        researcher: ['research', 'projects', 'journey', 'about', 'achievements', 'work', 'community'],
        explorer: ['research', 'community', 'projects', 'work', 'journey', 'achievements', 'about']
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
        mission: Boolean(saved.mission),
        quick: Boolean(saved.quick),
        paper: Boolean(saved.paper),
        evidence: Boolean(saved.evidence),
        certificate: Boolean(saved.certificate),
        circuit: Boolean(saved.circuit),
    };
    let zone = 'welcome',
        history = [],
        busy = false,
        autoCalls = 0,
        lastAuto = 0,
        revision = 0;
    let toastTimer, quiet = false;
    const dock = $('.guide-dock');
    const mediaMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = mediaMotion.matches;
    const csrf = $('[name=csrfmiddlewaretoken]').value;
    const guideDialog = $('#guideDialog');
    const fallback = {
        work: 'Huawei internship. Saudi Cast networking. Pick a work card; let’s inspect the evidence.',
        community: 'A tiny wardrobe. A permanent hello. Make a Nori that feels like you.',
        achievements: 'Welcome to the Trophy Room. These were earned the old-fashioned way: effort, practice, and probably a few late nights.',
        research: 'Tiny dots, big questions. Try the signal puzzle, then meet the research that inspired it.',
        projects: 'The Workshop: where “what if?” acquires a codebase. Pick a build and I’ll translate the interesting bits.',
        journey: 'Experience points, but on an actual résumé. There’s work, teaching, community, and a lot of learning here.',
        about: 'You found the human. The motivation is personal; the curiosity is apparently unlimited.',
    };

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

    function say(text, mood = 'curious') {
        revision++;
        $('#guideLine').textContent = text;
        $('#guideMood').textContent = '/ ' + mood;
        dock.dataset.mood = mood;
    }

    function updateProgress() {
        $('#progressLabel').textContent = `${state.visited.length} / 7 places discovered`;
        $$('[data-stamp]').forEach(el => {
            const earned = state.visited.includes(el.dataset.stamp);
            el.classList.toggle('earned', earned);
            el.setAttribute('aria-label', `${names[el.dataset.stamp]}: ${earned ? 'discovered' : 'not yet discovered'}`);
        });
        document.dispatchEvent(new CustomEvent('nori:progress'));
        $$('.map-node').forEach(el => el.classList.toggle('discovered', state.visited.includes(el.dataset.zone)));
        $('#passportMessage').textContent = state.visited.length === 7 ? 'Passport complete. You came, you explored, you connected the dots.' : `${7 - state.visited.length} place${state.visited.length === 6 ? '' : 's'} left. Your progress is saved in this browser.`;
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

    function nextStop() {
        const route = routes[state.role || 'explorer'];
        const next = route.find(z => !state.visited.includes(z));
        if (next) {
            say(`Next stop: ${names[next]}. Follow me. I have a clipboard; that makes this official.`, 'guiding');
            travel(next);
        } else {
            say('You’ve completed the tour. The next chapter could be a conversation with Abdulla.', 'proud');
            travel('contact');
        }
    }

    function visit(room) {
        zone = room;
        if (state.visited.includes(room)) return;
        state.visited.push(room);
        persist();
        updateProgress();
        toast(`✦ Discovery unlocked: ${names[room]}`);
        say(fallback[room], 'excited');
        if (state.visited.length === 7) {
            say('All seven stamps! You now know more than someone who just skimmed the résumé. A suspiciously useful superpower.', 'proud');
            toast('✦ Explorer passport complete!');
        } else autoGuide('zone', `I just explored ${names[room]}. React briefly and suggest something relevant here.`);
    }
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Passing a room during map travel should not earn a discovery.
                setTimeout(() => {
                    const rect = entry.target.getBoundingClientRect();
                    if (rect.top >= 80 && rect.top < innerHeight - 60) {
                        visit(entry.target.closest('[data-room]').dataset.room);
                    }
                }, 800);
            }
        }), {
            threshold: .5
        });
        $$('.discoverable').forEach(section => {
            const heading = $('h2', section);
            if (heading) observer.observe(heading);
        });
    }
    $$('.map-node').forEach(node => node.addEventListener('click', () => {
        say(`Off to the ${names[node.dataset.zone]}. Curiosity is an excellent navigation system.`, 'guiding');
    }));
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
            if (!response.ok) throw new Error(data.error || 'Nori’s AI connection is unavailable.');
            return data;
        } finally {
            clearTimeout(timer);
        }
    }

    function context() {
        return {
            role: state.role || 'explorer',
            zone,
            visited: state.visited
        };
    }
    async function autoGuide() { /* Nori speaks on request; scene previews are local and brief. */ }
    $$('[data-role]').forEach(button => button.addEventListener('click', async () => {
        state.role = button.dataset.role;
        persist();
        updateProgress();
        const lines = {
            recruiter: 'Work first. Proof next. I’ve marked your route—shall we inspect the experience?',
            researcher: 'Exploring a research collaboration? Start with the research, then the methods and milestones.',
            explorer: 'Just looking around? Follow the experiments, projects, and hidden details at your own pace.'
        };
        say(lines[state.role], 'guiding');
        $('#passportMessage').textContent = 'Your route is ready. Choose “Next stop” or explore any place on the map.';
        try {
            const data = await api(app.dataset.visitUrl, {
                role: state.role
            });
            $('#visitorTotals').textContent = `Self-selected visits since this feature launched: ${data.counts.recruiter || 0} hiring · ${data.counts.researcher || 0} research · ${data.counts.explorer || 0} curious. One count per browser session; roles aren’t verified.`;
        } catch (_) {
            $('#visitorTotals').textContent = 'Your route is ready. The visitor count is temporarily unavailable.';
        }
        autoGuide('welcome', 'I just chose my route. Give me a short, personalised welcome.');
    }));
    $('#nextStop').addEventListener('click', nextStop);
    $('#guideNext').addEventListener('click', nextStop);

    function applyQuick() {
        document.body.classList.toggle('quick-mode', state.quick);
        $('#quickMode').setAttribute('aria-pressed', String(state.quick));
        $('#quickMode').textContent = state.quick ? 'Bring back the playground ✦' : 'Just show me the work ↓';
    }
    $('#quickMode').addEventListener('click', () => {
        state.quick = !state.quick;
        persist();
        applyQuick();
        if (state.quick) travel('achievements');
    });

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
        state.mission = false;
        state.role = null;
        state.paper = state.certificate = state.evidence = state.circuit = false;
        history = [];
        persist();
        updateProgress();
        say('Fresh passport. Same questionable sense of humour. Where shall we begin?', 'curious');
        toast('Discoveries reset. Visitor totals are unchanged.');
    });
    $('#quietGuide').addEventListener('click', () => {
        quiet = true;
        dock.classList.add('quiet');
    });
    $('#guideAvatar').addEventListener('click', () => {
        if (quiet) {
            quiet = false;
            dock.classList.remove('quiet');
        } else say(['Boop received. My scientific dignity is intact. Mostly.', 'Tiny guide. Huge clipboard energy.', 'Yes, the hair is aerodynamic.'][Math.floor(Math.random() * 3)], 'excited');
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
        $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
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

    function openGuide() {
        openDialog(guideDialog);
        $('#chatInp').focus();
    }
    $$('[data-open-guide]').forEach(button => button.addEventListener('click', openGuide));

    function appendMessage(text, role) {
        const el = document.createElement('div');
        el.className = 'message ' + role;
        el.textContent = text;
        $('#chatMsgs').append(el);
        $('#chatMsgs').scrollTop = $('#chatMsgs').scrollHeight;
        return el;
    }
    async function sendMessage(message) {
        message = message.trim().slice(0, 1200);
        if (!message || busy) return;
        openGuide();
        busy = true;
        revision++;
        $('#chatSend').disabled = true;
        appendMessage(message, 'user');
        const pending = appendMessage('Let me connect a few dots…', 'assistant');
        say('One moment. Consulting the very important mental clipboard.', 'thinking');
        try {
            const data = await api(app.dataset.chatUrl, {
                event: 'chat',
                message,
                history: history.slice(-8),
                context: context()
            });
            const response = data.response || 'I couldn’t find an answer. Try a question about the portfolio.';
            pending.textContent = response;
            history.push({
                role: 'user',
                content: message
            }, {
                role: 'assistant',
                content: response
            });
            history = history.slice(-8);
            say(response, 'curious');
        } catch (error) {
            pending.className = 'message status';
            pending.textContent = `${error.name === 'AbortError' ? 'The AI connection timed out.' : error.message} You can still explore every room and play both games.`;
            say('My AI connection needs a snack. The map, discoveries, and games are still ready to go.', 'sleepy');
        } finally {
            busy = false;
            $('#chatSend').disabled = false;
            $('#chatMsgs').scrollTop = $('#chatMsgs').scrollHeight;
        }
    }
    $('#chatForm').addEventListener('submit', e => {
        e.preventDefault();
        const input = $('#chatInp');
        if (busy || !input.value.trim()) return;
        const message = input.value;
        input.value = '';
        sendMessage(message);
    });
    $$('[data-question]').forEach(button => button.addEventListener('click', () => sendMessage(button.dataset.question)));
    $$('.project-question').forEach(button => button.addEventListener('click', () => sendMessage(`Tell me about ${button.dataset.projectTitle}. Why is it interesting?`)));
    // Search and inspect the complete admin-managed certificate collection.
    const collections = $$('.collection');
    let beforeSearch = null;
    $('#certificateSearch').addEventListener('input', e => {
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
    $('#expandCollections').addEventListener('click', () => {
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
        say('Evidence inspected. Excellent. I’m contractually obligated to admire a well-earned certificate.', 'proud');
        autoGuide('certificate', `I opened the certificate titled ${card.dataset.title}. React briefly using only the portfolio facts.`);
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
        say(button.dataset.status === 'IP' ? 'The work-in-progress shelf. Science is allowed to have a loading bar.' : 'Research, with the details intact. The best rabbit holes have references.', 'curious');
    }));
    // Phosphene-inspired dot puzzle. Deliberately illustrative, never clinical.
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
        say('A different route to the same answer. Good interfaces make room for that.', 'curious');
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
                say('Signal found! Now imagine learning which information to preserve. That’s where the real research gets interesting.', 'excited');
                autoGuide('puzzle', 'I solved the illustrative signal puzzle. Connect that to the actual research in one short sentence.');
            }
        } else {
            $('#signalFeedback').textContent = 'Not quite. Try increasing the signal clarity—or ask for a text clue.';
            say('A hypothesis has been tested. Science calls that progress. Try a little more signal.', 'curious');
        }
    }));
    newSignal();
    // Project descriptions become a content-driven matching game.
    let projects = [];
    try {
        projects = JSON.parse($('#project-data').textContent);
    } catch (_) {}
    let mission, missionWon = false;

    function newMission() {
        if (projects.length < 2) return;
        $('#matchGame').hidden = false;
        mission = projects[Math.floor(Math.random() * projects.length)];
        missionWon = false;
        const plain = document.createElement('div');
        plain.textContent = mission.description;
        const shortName = mission.name.split(/[–—:]/)[0].trim();
        $('#missionDescription').textContent = plain.textContent.split(shortName).join('This project');
        $('#missionFeedback').textContent = 'Which project is this describing?';
        const others = projects.filter(p => p.id !== mission.id).sort(() => Math.random() - .5).slice(0, 2);
        const choices = [mission, ...others].sort(() => Math.random() - .5);
        $('#missionChoices').replaceChildren(...choices.map(p => {
            const button = document.createElement('button');
            button.textContent = p.name;
            button.addEventListener('click', () => {
                if (p.id === mission.id) {
                    $('#missionFeedback').textContent = 'Connected! ' + mission.name + ' is the right build.';
                    if (!missionWon) {
                        missionWon = true;
                        state.mission = true;
                        document.dispatchEvent(new CustomEvent('nori:celebrate'));
                        setTimeout(updateProgress, 0);
                        persist();
                        toast('✦ Side quest complete: Project Detective');
                        say('Correct. You just learned a project without sitting through a thirty-slide presentation.', 'proud');
                    }
                } else {
                    $('#missionFeedback').textContent = 'Not this one. Look for the techniques and purpose in the description.';
                    say('Close enough to form a hypothesis. Read the mission again; the clue is in the details.', 'curious');
                }
            });
            return button;
        }));
    }
    $('#nextMission').addEventListener('click', newMission);
    newMission();

    function discoverSecret(secret) {
        if (!state.secrets.includes(secret)) {
            state.secrets.push(secret);
            setTimeout(updateProgress, 0);
            persist();
        }
        $('#discoveryText').textContent = secret === 'konami' ? 'You know the old code. Somewhere, a very tiny arcade cabinet just applauded. Secret: curiosity has no prerequisites.' : 'You pressed the suspicious button. Excellent research instincts. Your reward: honorary Head of Suspicious Button Research. Nori has approved the imaginary badge.';
        openDialog($('#discoveryDialog'));
        say('A secret hunter! I knew that tiny suspicious button would find its audience.', 'excited');
    }
    $('#secretStar').addEventListener('click', () => discoverSecret('star'));
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
        say,
        travel,
        visit,
        persist,
        updateProgress,
        toast,
        api,
        openGuide,
        get paused() {
            return paused;
        }
    };
    updateProgress();
    applyQuick();
    motion();
    if (state.visited.length) say(`Welcome back. Your passport has ${state.visited.length} stamps. I kept the imaginary kettle on.`, 'happy');
})();
