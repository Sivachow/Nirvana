chrome.commands.onCommand.addListener(async (cmd) => {
    if (cmd !== "open_spotlight") return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https:\/\/focus\.nirvanahq\.com\//.test(tab.url || "")) return;
    
    try {
        await chrome.tabs.sendMessage(tab.id, { type: "toggle" });
    } catch {
        const target = { tabId: tab.id };
        await Promise.allSettled([
            chrome.scripting.insertCSS({ target, files: ["content/spotlight.css"] }),
            chrome.scripting.executeScript({ target, files: [
                "content/nirvana-api.js",
                "content/token-manager.js",
                "content/nirvana-data.js",
                "content/bridge.js",
                "content/spotlight.js"
            ] })
        ]);
        chrome.tabs.sendMessage(tab.id, { type: "toggle" }).catch(() => {});
    }
});
