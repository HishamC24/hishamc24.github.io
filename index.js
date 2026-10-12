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

fetch("Database_PreShuffle.json")
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

        // Pass the entire item payload into this function
        function appendImage(imageData, itemData) {
            if (!imageData) return;

            const klass = aspectToClass[imageData.aspectRatio] || aspectToClass["1:1"];
            const img = document.createElement("img");
            img.className = klass;
            img.src = `Images/${imageData.src}`;

            const fallbackAlt = itemData.compactDescription || itemData.fullDescription || itemData.name;
            img.alt = imageData.description || fallbackAlt || imageData.src;

            img.style.objectFit = "cover";
            img.style.opacity = "0";
            img.style.transition = "opacity 1s, transform 0.25s ease-in-out";
            img.style.cursor = "pointer"; // Add pointer cursor for better UX

            // Show the popup on click, passing the specific JSON object
            img.addEventListener("click", () => {
                openPopup(itemData);
            });

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
        }

        data.forEach((item) => {
            appendImage(item.primaryImage, item);
        });
    })
    .catch((err) => {
        console.error("Failed to load images from Database", err);
    });


// --- NEW POPUP LOGIC ---

function openPopup(item) {
    const popup = document.getElementById("popup");

    // 1. Set Title (Rule: name is optional)
    const titleEl = document.getElementById("title");
    titleEl.textContent = item.name || "Project";

    // 2. Set Date Formatting (Rule: empty start = 1 day, empty end = in progress)
    const dateEl = document.getElementById("date");
    const start = item.date.start;
    const end = item.date.end;

    if (!start && end) {
        dateEl.textContent = end; // e.g., "7.31.26"
    } else if (start && !end) {
        dateEl.textContent = `${start} - Current`;
    } else if (start && end) {
        dateEl.textContent = `${start} - ${end}`;
    } else {
        dateEl.textContent = ""; // Hide if no dates provided
    }

    // 3. Set Short Description (Rule: Primary MUST have a short desc)
    const shortDescEl = document.getElementById("short-description");
    shortDescEl.textContent = item.compactDescription || "";

    // 4. Populate Images (Rule: Primary is required, secondary is optional)
    const imageGrid = document.getElementById("popup-image-grid");
    imageGrid.innerHTML = ""; // Clear out placeholder/previous images

    // Append Primary
    if (item.primaryImage) {
        const primaryImg = document.createElement("img");
        primaryImg.src = `Images/${item.primaryImage.src}`;
        imageGrid.appendChild(primaryImg);
    }

    // Append Secondary (can be any aspect ratio per rules)
    if (item.secondaryImages && item.secondaryImages.length > 0) {
        item.secondaryImages.forEach(secImg => {
            const secImgEl = document.createElement("img");
            secImgEl.src = `Images/${secImg.src}`;
            imageGrid.appendChild(secImgEl);
        });
    }

    // 5. Populate Full Description (Rule: Primary MUST have long desc)
    const bottomEl = document.getElementById("popup-bottom");
    bottomEl.innerHTML = "";

    if (item.fullDescription) {
        // Split text by new lines so spacing is preserved 
        const paragraphs = item.fullDescription.split('\n');
        paragraphs.forEach(text => {
            if (text.trim() !== "") {
                const p = document.createElement("p");
                p.textContent = text;
                bottomEl.appendChild(p);
                bottomEl.appendChild(document.createElement("br"));
            }
        });
    }

    // Unhide the popup
    popup.style.display = "block";
}

// Ensure close button properly hides the popup
const popupCloseBtn = document.getElementById("popup-close");
if (popupCloseBtn) {
    popupCloseBtn.addEventListener("click", () => {
        document.getElementById("popup").style.display = "none";
    });
}

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