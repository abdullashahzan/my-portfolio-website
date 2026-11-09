/* The map and the page share the same ordered list of visible sections. */
(() => {
    const N = window.Nori;
    if (!N) return;

    const $ = selector => document.querySelector(selector);
    const $$ = selector => [...document.querySelectorAll(selector)];
    const map = $('.world-map');
    const cards = $$('.project');
    const rail = $('.project-grid');
    const search = $('#projectSearch');
    const technology = $('#projectTag');
    const previous = $('#prevProject');
    const next = $('#nextProject');

    const tags = card => [...card.querySelectorAll('.tags span')].map(tag => tag.textContent);

    function filterProjects() {
        const query = search.value.trim().toLocaleLowerCase();
        const matches = cards.filter(card =>
            card.textContent.toLocaleLowerCase().includes(query) &&
            (!technology.value || tags(card).includes(technology.value))
        );
        cards.forEach(card => { card.hidden = !matches.includes(card); });
        $('#projectCount').textContent = matches.length
            ? `${matches.length} build${matches.length === 1 ? '' : 's'}`
            : 'No builds match these filters.';
        rail.scrollLeft = 0;

    }

    function drawMap() {
        if (!map || !map.clientWidth) return;
        const roads = $('.map-roads'), bounds = map.getBoundingClientRect();
        roads.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
        const points = [...map.querySelectorAll('.map-node')].map(node => {
            const rect = node.getBoundingClientRect();
            return {x:rect.left-bounds.left+rect.width/2, y:rect.top-bounds.top+rect.height/2, bottom:rect.bottom-bounds.top, top:rect.top-bounds.top};
        });
        let d = '';
        points.forEach((point, i) => {
            if (!i) {d = `M ${point.x} ${point.y}`; return;}
            const prev = points[i-1];
            if (Math.abs(prev.y-point.y)<2) d += ` L ${point.x} ${point.y}`;
            else {const midway=(prev.bottom+point.top)/2;d += ` L ${prev.x} ${midway} L ${point.x} ${midway} L ${point.x} ${point.y}`;}
        });
        roads.querySelector('path').setAttribute('d', d);
    }

    if (rail) {
        const options = [...new Set(cards.flatMap(tags))].sort();
        technology.append(...options.map(tag => new Option(tag, tag)));
        search.addEventListener('input', filterProjects);
        technology.addEventListener('change', filterProjects);
        filterProjects();

    }

    // External media can fail independently of layout. Keep an actionable labelled link.
    $$('.work-certificate img').forEach(img => {
        function fallback() {if(img.nextElementSibling?.classList.contains('image-unavailable'))return;const message=document.createElement('span');message.className='image-unavailable';message.textContent='Preview unavailable. Open original certificate ↗';img.hidden=true;img.after(message);}
        img.addEventListener('error',fallback);
        if(img.complete&&!img.naturalWidth)fallback();
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

    drawMap();
    document.fonts?.ready.then(drawMap);
    window.addEventListener('resize', drawMap);
    if (map && 'ResizeObserver' in window) new ResizeObserver(drawMap).observe(map);
})();
