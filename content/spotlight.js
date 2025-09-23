if (!window.__nirvanaSpotlight) {

let spotlight, input;

function create() {
    if (spotlight) return;
    
    spotlight = Object.assign(document.createElement("div"), {
        id: "nirvana-spotlight",
        innerHTML: `<div class="card">
            <input id="nirvana-spotlight-input" type="text" placeholder="Type anything and press Enter to create test task…">
            <div class="hint">Press Esc to close • Enter creates numbered test task in Next</div>
        </div>`
    });
    spotlight.setAttribute("aria-modal", "true");
    spotlight.setAttribute("role", "dialog");
    document.documentElement.appendChild(spotlight);
    
    input = spotlight.querySelector("#nirvana-spotlight-input");
    input.addEventListener("keydown", async (e) => {
        if (e.key === "Escape" || e.key === "Enter") {
            if (e.key === "Enter") {
                e.preventDefault();
                const inputText = input.value.trim();
                console.log("[Spotlight]", inputText);
                
                // Call test API when user types anything
                if (inputText) {
                    await callTestAPI();
                }
            }
            toggle(false);
        }
    });
}

async function callTestAPI() {
    try {
        const tokenManager = window.__nirvanaTokenManager;
        if (!tokenManager || !tokenManager.api) {
            console.error('[Spotlight] Token manager or API not available');
            return;
        }

        console.log('[Spotlight] Creating test task...');
        const result = await tokenManager.api.addTestTask();
        console.log('[Spotlight] Test task created successfully:', result);
    } catch (error) {
        console.error('[Spotlight] Failed to create test task:', error);
    }
}

function toggle(show) {
    create();
    const isOpen = spotlight.style.display === "flex";
    show = show ?? !isOpen;
    
    spotlight.style.display = show ? "flex" : "none";
    document.body.style.overflow = show ? "hidden" : "";
    
    if (show) setTimeout(() => input?.focus(), 0);
}

document.addEventListener("click", (e) => {
    if (e.target === spotlight) toggle(false);
});

window.__nirvanaSpotlight = { toggle };

}
