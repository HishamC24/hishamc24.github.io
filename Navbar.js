let lastScrollY = window.scrollY || window.pageYOffset, compactNavTimeout = null;

function getDocHeight() {
    const d = document, b = d.body, e = d.documentElement;
    return Math.max(b.scrollHeight, e.scrollHeight, b.offsetHeight, e.offsetHeight, b.clientHeight, e.clientHeight);
}

function handleCompactNav() {
    const nav = document.querySelector('nav.small');
    if (!nav) return;

    const y = window.scrollY || window.pageYOffset,
        h = window.innerHeight || document.documentElement.clientHeight,
        docH = getDocHeight();

    const MAX_SCROLL_Y = Math.max(0, docH - h);
    const atBottom = (y >= (MAX_SCROLL_Y - 8));

    const clearCompactTimeout = () => {
        if (compactNavTimeout) {
            clearTimeout(compactNavTimeout);
            compactNavTimeout = null;
        }
    };

    if (atBottom) {
        nav.classList.remove('compact');
        clearCompactTimeout();
    } else if (y < lastScrollY - 4) {
        nav.classList.remove('compact');
        clearCompactTimeout();
    } else if (y > lastScrollY + 4) {
        clearCompactTimeout();
        nav.classList.add('compact');
    }
    lastScrollY = y;
}

window.addEventListener('scroll', handleCompactNav, { passive: true });
window.addEventListener('resize', handleCompactNav);
window.addEventListener('load', handleCompactNav);

document.addEventListener('DOMContentLoaded', function () {
    function getTabItems() {
        const smallTabs = document.querySelectorAll('nav.small .tab-bar .tab-item');
        const largeTabs = document.querySelectorAll('nav.large .tab-bar .tab-item');
        return { smallTabs, largeTabs };
    }

    function getTabLabel(tabItem) {
        const p = tabItem.querySelector('p');
        return p ? p.innerText.trim() : '';
    }

    const { smallTabs, largeTabs } = getTabItems();
    const allTabs = [...smallTabs, ...largeTabs];
    const nav = document.querySelector('nav.small');

    allTabs.forEach(item => {
        item.addEventListener('click', function () {
            const label = getTabLabel(this);

            allTabs.forEach(tab => {
                if (tab.id === 'selected') {
                    tab.removeAttribute('id');
                }
            });

            allTabs.forEach(tab => {
                if (getTabLabel(tab) === label) {
                    tab.id = 'selected';
                }
            });

            if (nav && nav.classList.contains('compact')) {
                nav.classList.remove('compact');
            }
        });
    });
});