/* Shared world, different journeys. All public copy remains text-only. */
(() => {
    'use strict';
    const N = window.Nori;
    if (!N) return;
    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => [...root.querySelectorAll(s)];
    const app = $('#gameApp'),
        dock = $('.guide-dock');
    const routeInfo = {
        recruiter: {
            title: 'The evidence trail',
            intro: 'Start with real work. Connect a build to its purpose. Inspect the proof.',
            color: '#a04d2c',
            quests: [
                ['evidence', 'Inspect a work experience', 'work'],
                ['mission', 'Match a project to its purpose', 'matchGame'],
                ['certificate', 'Open a certificate', 'achievements']
            ]
        },
        researcher: {
            title: 'The signal expedition',
            intro: 'Decode a signal. Explore the research. Connect the ideas to a working build.',
            color: '#7350b5',
            quests: [
                ['solved', 'Decode the phosphene signal', 'research'],
                ['research', 'Explore the research papers', 'research'],
                ['mission', 'Connect a project to its methods', 'matchGame']
            ]
        },
        explorer: {
            title: 'The curiosity circuit',
            intro: 'Solve a tiny mystery. Repair a connection. Leave your own Nori in the world.',
            color: '#35694d',
            quests: [
                ['solved', 'Find the shape in the noise', 'research'],
                ['circuit', 'Reconnect Nori’s network', 'work'],
                ['companion', 'Save your own companion', 'community']
            ]
        }
    };
    let profile = null,
        draft = {
            outfit: 'lavender',
            accessory: 'none'
        },
        galleryNext = null;
    let activeScene = '',
        currentAction = () => N.travel('world');
    const prompts = {
        world: ['Same world. Your own adventure. Pick a path.', 'Start my route ↗', () => $('#nextStop').click()],
        achievements: ['The receipts are here. Open one that catches your eye.', 'Inspect a certificate ↗', () => {
            N.travel('certificateSearch');
            $('#certificateSearch').focus({
                preventScroll: true
            });
        }],
        research: ['A shape is hiding in the noise. Help me find it?', 'Try the signal ↓', () => N.travel('signalRange')],
        projects: ['Ideas became builds. Can you match the mission?', 'Take the challenge ↗', () => N.travel('matchGame')],
        work: ['Help! My network has become abstract art. Rotate the cables?', 'Fix the connection ↗', () => N.travel('resetCircuit')],
        journey: ['These are the big milestones. The work has its own room now.', 'Inspect the milestones ↓', () => N.travel('journey')],
        about: ['Behind the experiments: a person with a very personal why.', 'Follow the story ↓', () => N.travel('about')],
        community: ['Your outfit. Your nickname. My next character arc.', 'Dress your Nori ✦', () => {
            N.travel('wardrobePreview');
            $('#noriName').focus({
                preventScroll: true
            });
        }],
        contact: ['End of the trail. Start of a conversation?', 'Say hello ↗', () => N.travel('contact')]
    };
    // Give Nori real space beside the content, rather than covering it in a corner.
    const scenes = [$('#world'), ...$$('[data-room]'), $('#contact')];
    const homes = new Map();
    scenes.forEach(section => {
        const container = $('.section-inner', section) || section;
        const content = document.createElement('div');
        content.className = 'scene-content';
        while (container.firstChild) content.append(container.firstChild);
        const rail = document.createElement('div');
        rail.className = 'guide-rail';
        rail.setAttribute('aria-hidden', 'true');
        const home = document.createElement('div');
        home.className = 'guide-home';
        rail.append(home);
        container.append(rail, content);
        container.classList.add('scene-layout');
        homes.set(section.id, home);
    });
    const mobileHome = document.createElement('div');
    mobileHome.className = 'mobile-guide-home';
    app.before(mobileHome);
    const compact = matchMedia('(max-width: 800px)');
    const heroHome = document.createElement('div');
    heroHome.hidden = true;
    app.append(heroHome);
    heroHome.append(dock);

    function placeGuide(id) {
        const home = compact.matches ? mobileHome : homes.get(id);
        if (!home || dock.parentElement === home) return;
        const previous = dock.getBoundingClientRect();
        home.append(dock);
        home.closest('.guide-rail')?.removeAttribute('aria-hidden');
        const next = dock.getBoundingClientRect();
        if (!N.paused && previous.width && previous.top > 0 && previous.top < innerHeight && !compact.matches) {
            dock.animate([{
                transform: `translate(${previous.left - next.left}px, ${previous.top - next.top}px) scale(.85)`,
                opacity: .6
            }, {
                transform: 'none',
                opacity: 1
            }], {
                duration: 650,
                easing: 'cubic-bezier(.22,1,.36,1)'
            });
        }
    }

    function enterScene(id) {
        placeGuide(id);
        if (id === activeScene) return;
        activeScene = id;
        $$('.scene-current').forEach(e => e.classList.remove('scene-current'));
        document.getElementById(id)?.classList.add('scene-current');
        if (N.names[id]) setTimeout(() => {
            if (activeScene === id) N.visit(id);
        }, 800);
        const [line, action, callback] = prompts[id];
        N.say(line, id === 'research' ? 'thinking' : 'guiding');
        $('#guideLocation').textContent = N.names[id] || (id === 'world' ? 'Your route starts here' : 'The next chapter');
        $('#guideAction').textContent = action;
        currentAction = callback;
        $$('.map-node').forEach(n => n.classList.toggle('current-place', n.dataset.zone === id));
    }
    let queued = false;

    function trackScroll() {
        queued = false;
        const threshold = compact.matches ? 280 : innerHeight * .3;
        const current = scenes.findLast(section => section.getBoundingClientRect().top <= threshold);
        document.body.classList.toggle('guide-on-tour', Boolean(current));
        if (current) enterScene(current.id);
        const hero = $('.hero-scene');
        if (!N.paused && hero.getBoundingClientRect().bottom > 0) hero.style.setProperty('--camera-drift', `${Math.min(scrollY * .08, 35)}px`);
        scenes.forEach(section => {
            const r = section.getBoundingClientRect();
            section.style.setProperty('--scene-progress', Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight + r.height))));
        });
    }

    function scheduleScroll() {
        if (!queued) {
            queued = true;
            requestAnimationFrame(trackScroll);
        }
    }
    addEventListener('scroll', scheduleScroll, {
        passive: true
    });
    addEventListener('resize', () => {
        scheduleScroll();
        drawRoute();
    });
    compact.addEventListener('change', () => {
        if (activeScene) placeGuide(activeScene);
    });
    $('#meetNori').addEventListener('click', () => N.travel('world'));
    $('#guideAction').addEventListener('click', () => currentAction());
    $('#guideDress').addEventListener('click', () => N.travel('community'));
    // Guide-led travel follows explicit clicks; manual scrolling remains fully in control.
    $$('a[href^="#"]').forEach(link => link.addEventListener('click', e => {
        const id = link.getAttribute('href').slice(1);
        if (!document.getElementById(id) || id === 'main-content') return;
        e.preventDefault();
        N.travel(id);
        if (!N.paused) {
            document.body.classList.add('camera-travelling');
            setTimeout(() => document.body.classList.remove('camera-travelling'), 800);
        }
    }));

    function earned(key) {
        if (key === 'companion') return Boolean(profile);
        if (key === 'research') return Boolean(N.state.paper);
        return Boolean(N.state[key]);
    }
    let lastRole;

    function renderRoute() {
        const role = N.state.role || 'explorer',
            info = routeInfo[role];
        document.body.dataset.route = role;
        document.documentElement.style.setProperty('--route-color', info.color);
        $('#routeEyebrow').textContent = N.state.role ? 'YOUR SELECTED EXPEDITION' : 'TRY THE SCENIC ROUTE';
        $('#routeTitle').textContent = info.title;
        $('#routeDescription').textContent = info.intro;
        const stops = N.routes[role];
        if (lastRole !== role) {
            lastRole = role;
            $('#routeSteps').replaceChildren(...stops.map((id, index) => {
                const li = document.createElement('li'),
                    button = document.createElement('button');
                button.textContent = `${String(index + 1).padStart(2, '0')}  ${N.names[id]}`;
                button.addEventListener('click', () => N.travel(id));
                li.append(button);
                return li;
            }));
            $$('.map-node').forEach(node => {
                const index = stops.indexOf(node.dataset.zone);
                node.dataset.routeStep = String(index + 1);
                node.classList.toggle('route-highlight', index < 3);
                node.setAttribute('aria-label', `Stop ${index + 1}: ${N.names[node.dataset.zone]}${index < 3 ? ', highlighted for your route' : ''}`);
            });
            drawRoute();
        }
        $('#routeQuests').replaceChildren(...info.quests.map(([key, label, target]) => {
            const button = document.createElement('button');
            button.className = earned(key) ? 'quest earned' : 'quest';
            button.textContent = `${earned(key) ? '✓' : '○'} ${label}`;
            button.addEventListener('click', () => N.travel(target));
            return button;
        }));
        const completed = info.quests.every(([key]) => earned(key));
        if (!completed) $('#bonusScene').hidden = true;
        if (completed) {
            if ($('#bonusScene').hidden) {
                $('#bonusScene').hidden = false;
                N.toast('✦ Bonus rooftop unlocked in the Nori neighbourhood');
            }
        }
    }

    function drawRoute() {
        const map = $('.world-map'),
            svg = $('.map-roads');
        if (!map || !svg) return;
        const bounds = map.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
        const points = N.routes[N.state.role || 'explorer'].map(id => {
            const node = $(`.map-node[data-zone="${id}"] .node-art`).getBoundingClientRect();
            return `${node.left - bounds.left + node.width / 2},${node.top - bounds.top + node.height / 2}`;
        });
        $('path', svg).setAttribute('d', 'M' + points.join(' L'));
    }
    document.addEventListener('nori:progress', renderRoute);
    $$('.work-inspect').forEach(button => button.addEventListener('click', () => {
        N.state.evidence = true;
        N.persist();
        renderRoute();
        button.textContent = '✓ Added to your evidence trail';
        button.closest('.work-card').classList.add('inspected');
        N.say(`${button.dataset.company}: evidence collected. Tiny clipboard, serious business.`, 'proud');
        celebrate();
    }));
    $$('.paper-inspect').forEach(button => button.addEventListener('click', () => {
        N.state.paper = true;
        N.persist();
        renderRoute();
        button.textContent = '✓ Finding added to your research trail';
        N.say('A research trail with actual evidence. My favourite kind of rabbit hole.', 'proud');
        button.closest('.paper').classList.add('inspected');
    }));
    // Third mini-game: connect a simple network by rotating three straight tiles.
    let cables = [1, 0, 1],
        circuitSolved = false;

    function renderCircuit() {
        $$('[data-cable]').forEach((button, i) => {
            button.style.setProperty('--cable-angle', `${cables[i] * 90}deg`);
            button.setAttribute('aria-label', `Cable ${i + 1}: ${cables[i] % 2 ? 'vertical' : 'horizontal'}. Activate to rotate.`);
        });
        const connected = cables.every(v => v % 2 === 0);
        $('.circuit-board').classList.toggle('connected', connected);
        if (connected && !circuitSolved) {
            circuitSolved = true;
            N.state.circuit = true;
            N.persist();
            renderRoute();
            celebrate();
            $('#circuitStatus').textContent = 'Connected! The signal reached Nori. Networking: suddenly less abstract.';
            N.say('We’re online! I owe you one imaginary IT support ticket.', 'excited');
        }
    }
    $$('[data-cable]').forEach((button, i) => button.addEventListener('click', () => {
        cables[i]++;
        renderCircuit();
    }));
    $('#resetCircuit').addEventListener('click', () => {
        cables = [1, Math.random() < .5 ? 0 : 1, 1];
        circuitSolved = false;
        $('#circuitStatus').textContent = 'Make a horizontal path from left to right.';
        renderCircuit();
    });
    renderCircuit();
    // Outfit changes are shared by the guide and all illustrations; gallery cards override them.
    function applyOutfit(value, root = document.body) {
        root.dataset.outfit = value.outfit;
        root.dataset.accessory = value.accessory;
    }

    function updateDraft() {
        applyOutfit(draft, $('#wardrobePreview'));
        $$('[data-outfit-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.outfitChoice === draft.outfit)));
        $$('[data-accessory-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.accessoryChoice === draft.accessory)));
        $('#previewName').textContent = $('#noriName').value.trim() ? `${$('#noriName').value.trim()}’s Nori` : 'Your Nori';
    }
    $$('[data-outfit-choice]').forEach(b => b.addEventListener('click', () => {
        draft.outfit = b.dataset.outfitChoice;
        updateDraft();
    }));
    $$('[data-accessory-choice]').forEach(b => b.addEventListener('click', () => {
        draft.accessory = b.dataset.accessoryChoice;
        updateDraft();
    }));
    $('#noriName').addEventListener('input', updateDraft);
    $('#noriPose').addEventListener('click', () => {
        if (!N.paused) $('#wardrobePreview .nori-art').animate([{
            transform: 'rotate(0)'
        }, {
            transform: 'rotate(-12deg) scale(1.12)'
        }, {
            transform: 'rotate(8deg)'
        }, {
            transform: 'rotate(0)'
        }], {
            duration: 650
        });
        N.say('Fashion review: scientifically adorable.', 'proud');
    });
    const endpoint = app.dataset.companionUrl;

    function adopt(mine) {
        profile = mine;
        draft = {
            outfit: mine.outfit,
            accessory: mine.accessory
        };
        applyOutfit(mine);
        $('#noriName').value = mine.nickname;
        $('#noriPublic').checked = mine.public;
        $('#deleteNori').hidden = false;
        $('#saveNori').textContent = 'Update my Nori ↗';
        updateDraft();
        renderRoute();
    }
    async function loadGallery(append = false, restore = false) {
        try {
            const response = await fetch(endpoint + (append && galleryNext !== null ? `?offset=${galleryNext}` : ''), {
                credentials: 'same-origin',
                cache: 'no-store'
            });
            if (!response.ok) throw new Error();
            const data = await response.json();
            if (restore && data.mine) {
                adopt(data.mine);
                N.say(`Welcome back, ${data.mine.nickname}. Your outfit survived. My clipboard missed you.`, 'happy');
                $('.nori-intro p').textContent = `Welcome back, ${data.mine.nickname}. Your Nori is ready for another adventure.`;
            }
            $('#noriCount').textContent = data.count;
            if (!append) $('#noriGallery').replaceChildren();
            for (const creation of data.creations) {
                const card = document.createElement('article');
                card.className = 'nori-card';
                applyOutfit(creation, card);
                const figure = $('#wardrobePreview .nori-art').cloneNode(true);
                const title = document.createElement('h4');
                title.textContent = `${creation.nickname}’s Nori`;
                const wave = document.createElement('button');
                wave.className = 'text-button';
                wave.textContent = 'Say a tiny hello ♡';
                wave.addEventListener('click', () => {
                    card.classList.toggle('waving');
                    wave.textContent = '♡ Hello, fellow explorer';
                });
                card.append(figure, title, wave);
                $('#noriGallery').append(card);
            }
            if (!data.count) {
                const empty = document.createElement('p');
                empty.textContent = 'The neighbourhood is waiting for its first resident. Yours could be the first.';
                $('#noriGallery').append(empty);
            }
            galleryNext = data.next;
            $('#moreNoris').hidden = galleryNext === null;
        } catch (_) {
            $('#noriGallery').textContent = 'The neighbourhood is taking a breather. Try again shortly.';
        }
    }
    $('#moreNoris').addEventListener('click', () => loadGallery(true));
    $('#wardrobeForm').addEventListener('submit', async e => {
        e.preventDefault();
        const save = $('#saveNori');
        save.disabled = true;
        try {
            const data = await N.api(endpoint, {
                ...draft,
                nickname: $('#noriName').value.trim(),
                public: $('#noriPublic').checked
            });
            adopt(data.mine);
            await loadGallery();
            celebrate();
            $('#wardrobeStatus').textContent = data.mine.hidden ? 'Saved. Your public entry is hidden by the site owner.' : (data.mine.public ? 'Saved! Your Nori is now part of the neighbourhood.' : 'Saved just for you. Come back in this browser to meet again.');
            N.say(`It’s official, ${data.mine.nickname}. Same tiny guide, your signature style.`, 'excited');
        } catch (error) {
            $('#wardrobeStatus').textContent = error.message || 'Could not save. Please try again.';
        } finally {
            save.disabled = false;
        }
    });
    let deleteArmed = false;
    $('#deleteNori').addEventListener('click', async () => {
        const button = $('#deleteNori');
        if (!deleteArmed) {
            deleteArmed = true;
            button.textContent = 'Confirm deletion of my saved Nori';
            return;
        }
        button.disabled = true;
        try {
            await N.api(endpoint, {
                action: 'delete'
            });
            profile = null;
            deleteArmed = false;
            draft = {
                outfit: 'lavender',
                accessory: 'none'
            };
            applyOutfit(draft);
            $('#wardrobeForm').reset();
            button.hidden = true;
            button.textContent = 'Delete my saved Nori';
            $('#saveNori').textContent = 'Save my Nori ↗';
            updateDraft();
            renderRoute();
            await loadGallery();
            $('#wardrobeStatus').textContent = 'Your saved Nori and public gallery entry have been deleted.';
        } catch (_) {
            $('#wardrobeStatus').textContent = 'Could not delete. Please try again.';
        } finally {
            button.disabled = false;
        }
    });
    // Ambient movement is paused off screen and respects the motion controls.
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting)), {
        threshold: .08
    });
    $$('.project,.paper,.work-card,.experience,.wardrobe,.world-map,.gpa-card').forEach(el => {
        el.classList.add('animated-scene');
        observer.observe(el);
    });
    $$('.project,.work-card,.gpa-card').forEach(card => {
        card.addEventListener('pointermove', e => {
            if (N.paused || e.pointerType !== 'mouse') return;
            const r = card.getBoundingClientRect();
            card.style.setProperty('--tilt-x', `${-(e.clientY - r.top - r.height / 2) / r.height * 5}deg`);
            card.style.setProperty('--tilt-y', `${(e.clientX - r.left - r.width / 2) / r.width * 5}deg`);
        });
        card.addEventListener('pointerleave', () => {
            card.style.setProperty('--tilt-x', '0deg');
            card.style.setProperty('--tilt-y', '0deg');
        });
    });
    $$('.skill-cloud span').forEach((skill, i) => {
        skill.style.setProperty('--skill-delay', `${i * -.4}s`);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = skill.textContent;
        button.addEventListener('click', () => {
            skill.classList.toggle('skill-selected');
            const matches = $$('.project,.paper').filter(item => item.textContent.toLowerCase().includes(button.textContent.toLowerCase()));
            $$('.skill-match').forEach(item => item.classList.remove('skill-match'));
            matches.forEach(item => item.classList.add('skill-match'));
            N.say(matches.length ? `${button.textContent}: spotted in ${matches.length} builds or papers. I’ve highlighted them—let’s follow the evidence.` : `${button.textContent} is on the skills list. Ask me about how it connects to the portfolio.`, 'curious');
            if (matches.length) {
                if (!matches[0].id) matches[0].id = 'skill-match-' + i;
                N.travel(matches[0].id);
            }
        });
        skill.replaceChildren(button);
    });
    $$('.rooftop-stars button').forEach(b => b.addEventListener('click', () => {
        b.classList.toggle('lit');
        celebrate();
    }));

    function celebrate() {
        if (N.paused) return;
        const burst = document.createElement('div');
        burst.className = 'celebration';
        burst.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 16; i++) {
            const star = document.createElement('span');
            star.textContent = i % 2 ? '✦' : '●';
            star.style.setProperty('--angle', `${i * 22.5}deg`);
            star.style.setProperty('--distance', `${90 + (i % 4) * 35}px`);
            burst.append(star);
        }
        document.body.append(burst);
        setTimeout(() => burst.remove(), 1200);
    }
    document.addEventListener('nori:celebrate', celebrate);
    applyOutfit(draft);
    renderRoute();
    trackScroll();
    loadGallery(false, true);
    document.fonts?.ready.then(drawRoute);
})();
