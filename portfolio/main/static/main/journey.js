/* The map and the page share the same ordered list of visible sections. */
(() => {
    const N = window.Nori;
    if (!N) return;

    const $ = selector => document.querySelector(selector);
    const $$ = selector => [...document.querySelectorAll(selector)];
    const map = $('.world-map');
    const nodes = $$('.map-node');
    const sections = $$('section[data-room]');
    const cards = $$('.project');
    const rail = $('.project-grid');
    const search = $('#projectSearch');
    const technology = $('#projectTag');
    const previous = $('#prevProject');
    const next = $('#nextProject');

    const audience = () => ({ recruiter: 'job', researcher: 'research' }[N.state.role] || 'all');
    const tags = card => [...card.querySelectorAll('.tags span')].map(tag => tag.textContent);
    const visibleProjects = () => cards.filter(card =>
        audience() === 'all' || ['both', audience()].includes(card.dataset.audience)
    );

    function updateRail() {
        const max = rail.scrollWidth - rail.clientWidth;
        previous.disabled = rail.scrollLeft < 2;
        next.disabled = rail.scrollLeft >= max - 2;
        $('.project-rail-nav').hidden = max < 2;
    }

    function filterProjects() {
        const query = search.value.trim().toLocaleLowerCase();
        const matches = visibleProjects().filter(card =>
            card.textContent.toLocaleLowerCase().includes(query) &&
            (!technology.value || tags(card).includes(technology.value))
        );
        cards.forEach(card => { card.hidden = !matches.includes(card); });
        $('#projectCount').textContent = matches.length
            ? `${matches.length} build${matches.length === 1 ? '' : 's'}`
            : 'No builds match these filters.';
        rail.scrollLeft = 0;
        updateRail();
    }

    function drawMap() {
        const roads = $('.map-roads');
        if (!map.clientWidth) return;
        roads.setAttribute('viewBox', `0 0 ${map.clientWidth} ${map.clientHeight}`);
        const points = [...map.querySelectorAll('.map-node:not([hidden])')].map(node => {
            const icon = node.querySelector('.node-art');
            return `${node.offsetLeft + node.offsetWidth / 2} ${node.offsetTop + icon.offsetTop + icon.offsetHeight / 2}`;
        });
        roads.querySelector('path').setAttribute('d', points.length ? 'M' + points.join(' L') : '');
    }

    const originalHero = $('.hero-description').textContent;
    function applyRoute() {
        const kind = audience();
        document.body.dataset.route = kind;
        $('#research').hidden = kind === 'job';
        $('#work').hidden = kind === 'research';
        $$('a[href="#research"], a[href="#work"]').forEach(link => {
            link.hidden = $(link.hash).hidden;
        });
        $$('[data-research-copy]').forEach(element => { element.hidden = kind === 'job'; });
        $('.hero-description').textContent = kind === 'job'
            ? 'Explore Shahzan’s work experience, projects, achievements, and technical skills.'
            : originalHero;
        sections.filter(section => !section.hidden).forEach((section, index) => {
            const node = nodes.find(item => item.hash === '#' + section.id);
            if (!node) return;
            node.dataset.routeStep = String(index + 1).padStart(2, '0');
            map.append(node);
        });
        $('#mapRoute').textContent = { job: 'Hiring route', research: 'Research route', all: 'Complete portfolio' }[kind];
        $('#otherPath').hidden = kind === 'all';
        $('#otherPath').textContent = kind === 'research' ? 'Switch to work & internships ↗' : 'Switch to research ↗';
        const selected = technology.value;
        const options = [...new Set(visibleProjects().flatMap(tags))].sort();
        technology.replaceChildren(new Option('All technologies', ''), ...options.map(tag => new Option(tag, tag)));
        if (options.includes(selected)) technology.value = selected;
        filterProjects();
        document.dispatchEvent(new CustomEvent('nori:route', { detail: kind }));
        drawMap();
    }

    function scrollProjects(direction) {
        const card = cards.find(item => !item.hidden);
        if (!card) return;
        const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
        rail.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: N.paused ? 'instant' : 'smooth' });
    }

    previous.addEventListener('click', () => scrollProjects(-1));
    next.addEventListener('click', () => scrollProjects(1));
    rail.addEventListener('scroll', updateRail, { passive: true });
    search.addEventListener('input', filterProjects);
    technology.addEventListener('change', filterProjects);
    document.addEventListener('nori:progress', () => {
        if (document.body.dataset.route !== audience()) applyRoute();
    });
    $('#otherPath').addEventListener('click', () => {
        const target = audience() === 'research' ? 'work' : 'research';
        $(target === 'work' ? '[data-role="recruiter"]' : '[data-role="researcher"]').click();
        N.travel(target);
    });

    const image = $('#mediaImage');
    $$('[data-image-preview]').forEach(link => link.addEventListener('click', event => {
        event.preventDefault();
        image.src = link.href;
        image.alt = link.dataset.imagePreview;
        $('#mediaTitle').textContent = image.alt;
        $('#mediaPreview').showModal();
    }));
    $('#closeMedia').addEventListener('click', () => $('#mediaPreview').close());

    applyRoute();
    document.fonts?.ready.then(drawMap);
    window.addEventListener('resize', () => { drawMap(); updateRail(); });
    if ('ResizeObserver' in window) new ResizeObserver(drawMap).observe(map);
})();
