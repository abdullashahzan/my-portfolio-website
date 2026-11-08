/* Persistent companion wardrobe and community. Tour choreography lives in journey.js. */
(() => {
'use strict';
const N = window.Nori; if (!N) return;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const app = $('#gameApp');
let profile = null, draft = {outfit:'lavender', accessory:'none', passport:'none'}, galleryNext = null;
function renderRoute() { document.dispatchEvent(new CustomEvent('nori:companion', {detail:profile})); }
    // Outfit changes are shared by the guide and all illustrations; gallery cards override them.
    function applyOutfit(value, root = document.body) {
        root.dataset.outfit = value.outfit;
        root.dataset.accessory = value.accessory;
        root.dataset.passport = value.passport || 'none';
    }

    function updateDraft() {
        applyOutfit(draft, $('#wardrobePreview'));
        $$('[data-passport-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.passportChoice === draft.passport)));
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
    $$('[data-passport-choice]').forEach(b => b.addEventListener('click', () => { draft.passport = b.dataset.passportChoice; updateDraft(); }));
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
            accessory: mine.accessory, passport: mine.passport || 'none'
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
                accessory: 'none', passport: 'none'
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
    loadGallery(false, true);

})();
