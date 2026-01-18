/* Header Injection Script */
(function () {
    const headerHTML = `
    <nav class="top-nav" style="line-height: normal;">
        <a href="index.html" class="nav-item">
            <span>Equipment</span>
        </a>
        <a href="codes.html" class="nav-item">
            <span>RC Settings</span>
        </a>
        <a href="rco.html" class="nav-item">
            <span>Coordinates RCO</span>
        </a>
    </nav>
    `;

    function injectHeader() {
        const placeholder = document.getElementById('main-header');
        if (placeholder) {
            placeholder.innerHTML = headerHTML;

            // Set active class based on current URL
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';
            const navItems = placeholder.querySelectorAll('.nav-item');

            navItems.forEach(item => {
                const href = item.getAttribute('href');
                if (href === currentPath) {
                    item.classList.add('active');
                }
            });
        }
    }

    // Run as soon as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectHeader);
    } else {
        injectHeader();
    }
})();
