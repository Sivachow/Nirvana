if (!window.__nirvanaSpotlight) {

let spotlight, input, responseDiv, aiHandler, conversationHistory = [];

function create() {
    if (spotlight) return;
    
    spotlight = Object.assign(document.createElement("div"), {
        id: "nirvana-spotlight",
        innerHTML: `<div class="card">
            <div id="nirvana-spotlight-response" class="response"></div>
            <input id="nirvana-spotlight-input" type="text" placeholder="Ask me anything... (e.g., 'Add buy groceries to my next list')">
            <div class="hint">Press Esc to close • Enter to send • Powered by AI</div>
        </div>`
    });
    spotlight.setAttribute("aria-modal", "true");
    spotlight.setAttribute("role", "dialog");
    document.documentElement.appendChild(spotlight);
    
    input = spotlight.querySelector("#nirvana-spotlight-input");
    responseDiv = spotlight.querySelector("#nirvana-spotlight-response");
    
    // Initialize AI handler
    const tokenManager = window.__nirvanaTokenManager;
    if (tokenManager && tokenManager.api) {
        aiHandler = new AIHandler(tokenManager.api);
    }
    
    input.addEventListener("keydown", async (e) => {
        if (e.key === "Escape") {
            toggle(false);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const inputText = input.value.trim();
            
            if (!inputText) return;
            
            // Handle special commands
            if (inputText === '/clear') {
                conversationHistory = [];
                showResponse('Conversation cleared!', 'success');
                input.value = '';
                setTimeout(() => hideResponse(), 1500);
                return;
            }
            
            if (inputText.startsWith('/setkey ')) {
                const key = inputText.substring(8).trim();
                if (aiHandler) {
                    await aiHandler.setAPIKey(key);
                    showResponse('API key saved!', 'success');
                    input.value = '';
                    setTimeout(() => hideResponse(), 1500);
                }
                return;
            }
            
            // Process with AI
            await processWithAI(inputText);
        }
    });
}

async function processWithAI(userInput) {
    if (!aiHandler) {
        showResponse('AI handler not initialized. Please refresh the page.', 'error');
        return;
    }
    
    try {
        // Show loading state
        showResponse('Thinking...', 'loading');
        input.disabled = true;
        
        // Process with AI
        const result = await aiHandler.processInput(userInput, conversationHistory);
        
        // Update conversation history
        conversationHistory.push(
            { role: 'user', content: userInput },
            { role: 'assistant', content: result.response }
        );
        
        // Show response
        showResponse(result.response, 'success');
        
        // Clear input
        input.value = '';
        
        // Auto-hide after 3 seconds if it's a simple confirmation
        if (result.functionCalled) {
            setTimeout(() => {
                hideResponse();
                toggle(false);
            }, 3000);
        }
        
    } catch (error) {
        console.error('[Spotlight] AI processing failed:', error);
        showResponse(error.message || 'Failed to process request', 'error');
    } finally {
        input.disabled = false;
        input.focus();
    }
}

function showResponse(text, type = 'info') {
    if (!responseDiv) return;
    
    responseDiv.textContent = text;
    responseDiv.className = `response ${type}`;
    responseDiv.style.display = 'block';
}

function hideResponse() {
    if (!responseDiv) return;
    responseDiv.style.display = 'none';
}

function toggle(show) {
    create();
    const isOpen = spotlight.style.display === "flex";
    show = show ?? !isOpen;
    
    spotlight.style.display = show ? "flex" : "none";
    document.body.style.overflow = show ? "hidden" : "";
    
    if (show) {
        hideResponse();
        setTimeout(() => input?.focus(), 0);
    }
}

document.addEventListener("click", (e) => {
    if (e.target === spotlight) toggle(false);
});

window.__nirvanaSpotlight = { toggle };

}

