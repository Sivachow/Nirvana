# Nirvana AI Extension

A Chrome extension that brings AI-powered natural language control to Nirvana task management. Simply open the spotlight with `Cmd+Shift+K` and tell the AI what you want to do.

## Features

- **🤖 AI-Powered Commands**: Use natural language to manage tasks
- **⚡ Quick Spotlight**: Fast keyboard access with `Cmd+Shift+K`
- **🔐 Token Interception**: Automatically captures auth tokens from Nirvana API calls
- **💾 Data Caching**: Efficient caching system with 5-minute timeout
- **🏗️ Modular Architecture**: Clean separation of concerns with dedicated modules
- **🔍 Smart Search**: AI understands context and finds the right tasks

## Quick Start

### 1. Installation
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

### 2. Setup
1. Navigate to [Nirvana](https://focus.nirvanahq.com/)
2. Right-click the extension icon → Options
3. Enter your OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/api-keys))
4. Click Save

### 3. Usage
1. Press `Cmd+Shift+K` (or `Ctrl+Shift+K` on Windows/Linux) anywhere on Nirvana
2. Type natural commands like:
   - "Add buy groceries to my next list"
   - "Find all tasks about the project"
   - "Mark task about meeting as complete"
   - "Move the groceries task to someday"
   - "Delete the old task about shopping"

## Architecture

### Core Modules

1. **inject.js**: Page-context script that intercepts fetch calls to capture auth tokens
2. **nirvana-api.js**: API client class for making authenticated requests to Nirvana
3. **token-manager.js**: Handles token capture, storage, and initial data fetching
4. **nirvana-data.js**: Data management with caching and basic query utilities
5. **ai-handler.js**: AI integration using OpenAI's function calling
6. **spotlight.js**: UI for natural language input and responses

### File Structure

```
├── manifest.json          # Extension manifest with permissions
├── background.js          # Service worker for extension commands
├── inject.js             # Token interceptor (runs in page context)
├── options.html          # Settings page
├── options.js            # Settings page logic
└── content/
    ├── nirvana-api.js    # API client module
    ├── token-manager.js  # Token management
    ├── nirvana-data.js   # Data utilities (cache/search)
    ├── ai-handler.js     # AI integration
    ├── bridge.js         # Extension bridge
    ├── spotlight.js      # Enhanced UI
    └── spotlight.css     # Styling
```

## AI Integration

The extension uses OpenAI's function calling feature to intelligently route user commands to the appropriate Nirvana API functions.

### Available AI Functions

- **add_task**: Create new tasks with name, note, and list
- **update_task**: Modify existing tasks
- **complete_task**: Mark tasks as done
- **delete_task**: Move tasks to trash
- **search_tasks**: Find tasks by keywords
- **list_tasks**: Show all tasks in a specific list

### Example Commands

```
"Add buy milk to next"
"Create a task called call John with note discuss project timeline"
"Find tasks about groceries"
"Complete the task about emails"
"Move the meeting task to scheduled"
"Show me all my next tasks"
"Delete the old project task"
```

### Spotlight Commands

- **Open Spotlight**: `Cmd+Shift+K` (or `Ctrl+Shift+K` on Windows/Linux)
- **Set API Key**: Type `/setkey YOUR_API_KEY` in spotlight
- **Clear Conversation**: Type `/clear` to reset conversation history
- (Search UI not yet implemented; data manager offers programmatic search helpers)

### Programmatic Access

```javascript
// Access the token manager
const tokenManager = window.__nirvanaTokenManager;

// Access the data manager
const dataManager = window.__nirvanaDataManager || new NirvanaDataManager(window.__nirvanaTokenManager);

// Get all tasks
const tasks = dataManager.getDataByType('task');

// Search tasks
const results = dataManager.searchTasks('project');

// Get tasks by state
const activeTasks = dataManager.getTasksByState('active');

// Fetch fresh data
await dataManager.getData(true);
```

### API Methods

#### TokenManager
- `getAuthToken()`: Get current auth token
- `fetchData(since)`: Fetch data from API
- `clearToken()`: Clear stored token

#### NirvanaAPI
- `setAuthToken(token)`: Set authentication token
- `fetchEverything(since)`: Fetch all data
- `request(endpoint, params)`: Generic API request

#### NirvanaDataManager
- `getData(forceRefresh)`: Get cached or fresh data
- `searchTasks(query)`: Search tasks by text (programmatic only)
- `getTasksByState(state)`: Filter tasks by state (programmatic only)
- `clearCache()`: Clear cached data

## Events

The extension dispatches custom events:

```javascript
// Listen for data updates
document.addEventListener('nirvanadata', (event) => {
    console.log('New data received:', event.detail);
});
```

## Error Handling

- All modules include comprehensive error handling
- Errors are logged to console with clear prefixes
- Graceful degradation when dependencies are unavailable
- Token storage failures are handled silently

## Security

- Tokens are stored securely using Chrome storage API
- Injection script runs in isolated page context
- All API calls are made from extension context
- No sensitive data is logged in production

## Development

### Adding New Features

1. Create new modules in the `content/` directory
2. Update `manifest.json` to include new files
3. Follow the existing module pattern with global exports
4. Add proper error handling and logging

### Debugging

- Check console for `[Nirvana MCP]` prefixed messages
- Use Chrome DevTools Extension panel
- Monitor network requests to verify token capture
- Check Chrome storage in DevTools Application tab

## Permissions

- `scripting`: For content script injection
- `activeTab`: For accessing active tab
- `storage`: For token persistence
- `https://focus.nirvanahq.com/*`: Nirvana web app access
- `https://gc-api.nirvanahq.com/*`: API access