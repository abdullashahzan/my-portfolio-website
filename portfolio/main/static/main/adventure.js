/* Persistent companion wardrobe and community. Tour choreography lives in journey.js. */
(() => {
'use strict';
const N = window.Nori; if (!N) return;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
if ($('#wardrobeForm')) {
    const app = $('#gameApp');
    let profile = null, draft = {outfit:'lavender', accessory:'glasses', passport:'none'}, galleryNext = null;
    function renderRoute() { document.dispatchEvent(new CustomEvent('nori:companion', {detail:profile})); }
        // Keep visitor designs separate from the hero self-portrait.
        function applyOutfit(value, root) {
            root.dataset.outfit = value.outfit;
            root.dataset.accessory = value.accessory;
            root.dataset.passport = value.passport || 'none';
        }

        function updateDraft() {
            applyOutfit(draft, $('#wardrobePreview'));
            $$('[data-outfit-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.outfitChoice === draft.outfit)));
            $$('[data-accessory-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.accessoryChoice === draft.accessory)));
            $('#previewName').textContent = $('#noriName').value.trim() ? `${$('#noriName').value.trim()}’s chibi` : 'Your chibi';
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
        });
        const endpoint = app.dataset.companionUrl;

        function adopt(mine) {
            profile = mine;
            draft = {
                outfit: mine.outfit,
                accessory: mine.accessory, passport: mine.passport || 'none'
            };
            $('#noriName').value = mine.nickname;
            $('#noriPublic').checked = mine.public;
            $('#deleteNori').hidden = false;
            $('#saveNori').textContent = 'Update my chibi ↗';
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
                }
                if (!append) $('#noriGallery').replaceChildren();
                for (const creation of data.creations) {
                    const card = document.createElement('article');
                    card.className = 'nori-card';
                    applyOutfit(creation, card);
                    const figure = $('#wardrobePreview .nori-art').cloneNode(true);
                    const title = document.createElement('h4');
                    title.textContent = `${creation.nickname}’s chibi`;
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

                $('#wardrobeStatus').textContent = data.mine.hidden ? 'Saved. Your public entry is hidden by the site owner.' : (data.mine.public ? 'Saved! Your chibi is now part of the neighbourhood.' : 'Saved just for you. Come back in this browser to meet again.');
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
                button.textContent = 'Confirm deletion of my saved chibi';
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
                    accessory: 'glasses', passport: 'none'
                };
                $('#wardrobeForm').reset();
                button.hidden = true;
                button.textContent = 'Delete my saved chibi';
                $('#saveNori').textContent = 'Save my chibi ↗';
                updateDraft();
                renderRoute();
                await loadGallery();
                $('#wardrobeStatus').textContent = 'Your saved chibi and public gallery entry have been deleted.';
            } catch (_) {
                $('#wardrobeStatus').textContent = 'Could not delete. Please try again.';
            } finally {
                button.disabled = false;
            }
        });
        renderRoute();
        loadGallery(false, true);
}
    $$('.skill-cloud span').forEach((skill, i) => {
        skill.style.setProperty('--skill-delay', `${i * -.4}s`);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = skill.textContent;
        button.addEventListener('click', () => {
            skill.classList.toggle('skill-selected');
            const matches = $$('.project,.paper').filter(item => !item.hidden && !item.closest('section[hidden]') && item.textContent.toLowerCase().includes(button.textContent.toLowerCase()));
            $$('.skill-match').forEach(item => item.classList.remove('skill-match'));
            matches.forEach(item => item.classList.add('skill-match'));
            if (matches.length) {
                if (!matches[0].id) matches[0].id = 'skill-match-' + i;
                N.travel(matches[0].id);
            }
        });
        skill.replaceChildren(button);
    });
})();
