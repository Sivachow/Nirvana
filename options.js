// options.js - Settings page functionality

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('settings-form');
    const apiKeyInput = document.getElementById('api-key');
    const statusDiv = document.getElementById('status');

    // Load saved API key
    try {
        const result = await chrome.storage.local.get(['openai_api_key']);
        if (result.openai_api_key) {
            apiKeyInput.value = result.openai_api_key;
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            showStatus('Please enter an API key', 'error');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            showStatus('Invalid API key format. Key should start with "sk-"', 'error');
            return;
        }

        try {
            // Save to storage
            await chrome.storage.local.set({ openai_api_key: apiKey });
            showStatus('Settings saved successfully! ✓', 'success');
            
            // Hide status after 3 seconds
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        } catch (error) {
            showStatus('Failed to save settings: ' + error.message, 'error');
        }
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
    }
});
