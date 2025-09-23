# Nirvana MCP Extension

A Chrome extension that captures Nirvana auth tokens and provides API access to Nirvana task data.

## Features

- **Token Interception**: Automatically captures auth tokens from Nirvana API calls
- **Data Caching**: Efficient caching system with 5-minute timeout
- **Modular Architecture**: Clean separation of concerns with dedicated modules
- **Spotlight Integration**: Enhanced spotlight with task search capabilities
- **Storage Management**: Persistent token storage using Chrome storage API

## Architecture

### Core Modules

1. **inject.js**: Page-context script that intercepts fetch calls to capture auth tokens
2. **nirvana-api.js**: API client class for making authenticated requests to Nirvana
3. **token-manager.js**: Handles token capture, storage, and initial data fetching
4. **nirvana-data.js**: Data management with caching and basic query utilities
5. **spotlight.js**: Minimal UI for creating quick test tasks

### File Structure

```
├── manifest.json          # Extension manifest with permissions
├── background.js          # Service worker for extension commands
├── inject.js             # Token interceptor (runs in page context)
└── content/
    ├── nirvana-api.js    # API client module
    ├── token-manager.js  # Token management
    ├── nirvana-data.js   # Data utilities (cache/search)
    ├── bridge.js         # Extension bridge
    ├── spotlight.js      # Enhanced UI
    └── spotlight.css     # Styling
```

## Usage

### Basic Setup

1. The extension automatically injects the token interceptor when loaded
2. Navigate to Nirvana and perform any action that triggers an API call
3. The token will be captured and stored automatically
4. Data will be fetched and cached for quick access

### Spotlight Commands

- **Open Spotlight**: `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac)
- **Refresh Data**: Type `/refresh` and press Enter
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