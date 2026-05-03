const aspectToClass = {
    "1:1": "grid-item-1-1",
    "1:2": "grid-item-1-2",
    "2:1": "grid-item-2-1",
    "2:2": "grid-item-2-2",
};

const aspectToSpan = {
    "1:1": { cols: 1, rows: 1 },
    "1:2": { cols: 1, rows: 2 },
    "2:1": { cols: 2, rows: 1 },
    "2:2": { cols: 2, rows: 2 },
};

fetch("Database.json")
    .then((response) => response.json())
    .then((data) => {
        const section = document.getElementById("portfolio-grid");
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(({ target, isIntersecting }) => {
                if (isIntersecting) {
                    target.style.opacity = "1";
                    observer.unobserve(target);
                }
            });
        }, {
            threshold: 0.1
        });

        data.forEach((item) => {
            const primary = item.primaryImage;
            if (!primary) return;
            const klass = aspectToClass[primary.aspectRatio] || aspectToClass["1:1"];
            const img = document.createElement("img");
            img.className = klass;
            img.src = `Images/${primary.src}`;
            img.alt = primary.description || primary.src;
            if (primary["object-fit"] === "contain") {
                img.style.objectFit = "contain";
            } else {
                img.style.objectFit = "cover";
            }
            img.style.opacity = "0";
            img.style.transition = "opacity 1s";
            section.appendChild(img);

            observer.observe(img);

            if (img.complete) {
                setTimeout(() => {
                    if (
                        img.getBoundingClientRect().top < window.innerHeight &&
                        img.getBoundingClientRect().bottom > 0
                    ) {
                        img.style.opacity = "1";
                        observer.unobserve(img);
                    }
                }, 1);
            }
        });
    })
    .catch((err) => {
        console.error("Failed to load images from Database.json", err);
    });

const actionBtns = document.querySelectorAll(".action-btn");
actionBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});

function switchTab(tabName, isPageLoad = false) {
    const allTabItems = document.querySelectorAll('nav .tab-item');

    const validTabs = Array.from(allTabItems).map(item => {
        const p = item.querySelector('p');
        return p ? p.textContent.trim() : null;
    }).filter(Boolean);

    validTabs.forEach(tab => {
        const section = document.getElementById(tab);
        if (section) section.style.display = "none";
    });

    const targetSection = document.getElementById(tabName);
    if (targetSection) {
        targetSection.style.display = "";
    }

    if (window.location.hash !== `#${tabName}`) {
        window.history.pushState(null, null, `#${tabName}`);
    }

    if (isPageLoad) {
        allTabItems.forEach(el => el.removeAttribute("id"));
        allTabItems.forEach(item => {
            const p = item.querySelector('p');
            if (p && p.textContent.trim() === tabName) {
                item.id = "selected";
            }
        });
    }
}

document.querySelectorAll('nav .tab-item').forEach(item => {
    item.addEventListener("click", function () {
        const label = this.querySelector('p');
        if (label) {
            switchTab(label.textContent.trim(), false);
        }
    });
});

function handleHashChange() {
    const hash = window.location.hash.substring(1);
    const targetSection = document.getElementById(hash);

    if (hash && targetSection) {
        switchTab(hash, true);
    } else {
        switchTab("Portfolio", true);
    }
}

window.addEventListener("DOMContentLoaded", handleHashChange);
window.addEventListener("hashchange", handleHashChange);

new Vivus('HandwrittenName', {
    type: 'oneByOne',
    duration: 200,
    animTimingFunction: Vivus.EASE,
    start: 'autostart'
}, function (myVivus) {
    setTimeout(function () {
        if (myVivus.getStatus() === 'end') {
            setTimeout(function () {
                myVivus.play(-1);
            }, 1000);
        } else {
            myVivus.play(1);
        }
    }, 200);
});