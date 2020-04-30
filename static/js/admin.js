const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

if ($navbarBurgers.length > 0) {
    $navbarBurgers.forEach(el => {
        el.addEventListener('click', () => {
            const target = el.dataset.target;
            const $target = document.getElementById(target);

            el.classList.toggle('is-active');
            $target.classList.toggle('is-active');

        });
    });
}

const rollNavLinks = Array.prototype.slice.call(document.querySelectorAll('.roll-pagination a.pagination-link, .roll-pagination a.pagination-previous, .roll-pagination a.pagination-next'), 0);

if (rollNavLinks.length > 0) {
    rollNavLinks.forEach(el => {
        el.addEventListener('click', (evt) => {
            evt.preventDefault();
            var pageInput = document.getElementById('page-input');
            pageInput.value = evt.target.dataset.page;
            document.querySelector('form').submit();
        });
    });
}