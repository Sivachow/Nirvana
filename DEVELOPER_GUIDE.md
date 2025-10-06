# Nirvana AI Extension - Developer Guide

## Overview

This Chrome extension adds AI-powered natural language control to Nirvana task management using OpenAI's function calling capabilities.

## How It Works

### 1. Token Interception
The extension intercepts Nirvana's API authentication tokens by injecting a script into the page context:
- `inject.js` wraps the native `fetch` function
- Captures `authtoken` parameter from API requests
- Posts token to content script via `window.postMessage`

### 2. API Client
`nirvana-api.js` provides a clean interface to Nirvana's API:
- Handles authentication
- Manages request signing and timestamps
- Provides methods for all task operations

### 3. AI Integration
`ai-handler.js` bridges user input with API calls:
- Uses OpenAI's function calling (tools)
- Defines available functions with JSON schema
- Executes functions and returns results to AI for natural responses

### 4. Data Management
`nirvana-data.js` handles caching and querying:
- 5-minute cache TTL
- Search and filter utilities
- Event-based updates

## AI Function Calling Flow

```
User Input → AI Handler → OpenAI API → Function Call → Nirvana API → Result → AI Response → User
```

### Example Flow

1. User types: "Add buy milk to next"
2. AI Handler sends to OpenAI with function definitions
3. OpenAI returns: `function: add_task, args: {name: "buy milk", list: "next"}`
4. AI Handler executes: `api.addTask("buy milk", "", "next")`
5. Result sent back to OpenAI
6. OpenAI generates: "I've added 'buy milk' to your Next list."
7. User sees response in spotlight

## Function Definitions

Each function has a JSON schema that describes:
- **name**: Function identifier
- **description**: When to use this function
- **parameters**: JSON schema for arguments
- **required**: Which parameters are mandatory

Example:
```javascript
{
    name: "add_task",
    description: "Create a new task in Nirvana",
    parameters: {
        type: "object",
        properties: {
            name: { type: "string", description: "The task name" },
            note: { type: "string", description: "Additional notes" },
            list: { 
                type: "string", 
                enum: ["inbox", "next", "waiting", "scheduled", "someday"],
                description: "Which list to add to"
            }
        },
        required: ["name"]
    }
}
```

## API Methods

### NirvanaAPI

#### Basic Operations
- `addTask(name, note, list)` - Create a new task
- `updateTask({id, name, note, list})` - Update existing task
- `complete(id)` - Mark task as complete
- `deleteTask(id)` - Move task to trash
- `setState(id, state)` - Change task state/list

#### Queries
- `fetchEverything(since)` - Get all data
- `getTaskById(id)` - Find specific task

### AIHandler

- `processInput(userInput, conversationHistory)` - Main method
- `executeFunction(functionName, args)` - Run API calls
- `setAPIKey(key)` - Store OpenAI API key

### NirvanaDataManager

- `getData(forceRefresh)` - Get cached or fresh data
- `searchTasks(query)` - Search by text
- `getTasksByState(state)` - Filter by list

## Extension Architecture

### Content Scripts (Injected into Nirvana)
1. `nirvana-api.js` - API client
2. `token-manager.js` - Token handling
3. `nirvana-data.js` - Data caching
4. `ai-handler.js` - AI integration
5. `bridge.js` - Initialization and event handling
6. `spotlight.js` - UI

### Page Context (Injected via script tag)
- `inject.js` - Token interceptor

### Extension Pages
- `options.html/js` - Settings page for API key
- `background.js` - Service worker for commands

## Security Considerations

1. **Token Storage**: Tokens stored in Chrome's local storage (encrypted by browser)
2. **API Key**: OpenAI key stored locally, never transmitted except to OpenAI
3. **Isolation**: Token interceptor runs in page context, but data is passed securely to content script
4. **HTTPS Only**: All API calls over HTTPS

## Customization

### Adding New Functions

1. Add function definition in `ai-handler.js`:
```javascript
{
    name: "my_new_function",
    description: "What this function does",
    parameters: {
        type: "object",
        properties: {
            // Define parameters
        }
    }
}
```

2. Add handler in `executeFunction`:
```javascript
case "my_new_function":
    return await this.api.myNewMethod(args.param);
```

3. Implement API method in `nirvana-api.js` if needed

### Changing AI Model

In `ai-handler.js`, modify the model parameter:
```javascript
model: 'gpt-4o-mini', // or 'gpt-4', 'gpt-3.5-turbo', etc.
```

### Adjusting AI Behavior

Modify the system prompt in `processInput`:
```javascript
{
    role: "system",
    content: "Your custom system prompt..."
}
```

## Debugging

### Chrome DevTools
1. Right-click extension icon → Inspect popup
2. Check Console for `[AI Handler]`, `[Nirvana MCP]` messages
3. Network tab shows OpenAI API calls

### Common Issues

**"API key not configured"**
- Go to Options page and set OpenAI API key
- Or use `/setkey YOUR_KEY` in spotlight

**"Auth token not set"**
- Refresh Nirvana page to trigger token capture
- Check if extension has proper permissions

**Function calls not working**
- Verify API key is valid
- Check Chrome console for errors
- Ensure token was captured (should see log message)

## Testing

### Manual Testing

1. **Token Capture**: Load Nirvana, check console for "Token captured"
2. **API Key**: Set in options page
3. **Spotlight**: Press Cmd+Shift+K
4. **Simple Task**: "Add test task to next"
5. **Search**: "Find tasks about test"
6. **Update**: "Complete the test task"

### Test Commands

```
# Basic CRUD
"Add meeting with John tomorrow to scheduled"
"Find all tasks about project"
"Mark the meeting task as complete"
"Delete the old test task"

# Complex
"Create a task called review PR with note check code quality and add to next"
"Show me all my waiting tasks"
"Move the groceries task to someday"
```

## Performance

- **Token capture**: Instant (intercepts existing API calls)
- **AI processing**: 1-3 seconds (depends on OpenAI API)
- **Cache**: 5-minute TTL reduces API calls
- **Function execution**: <500ms for most operations

## Future Enhancements

1. **Local AI**: Use Chrome's built-in AI when available
2. **MCP Server**: Create standalone MCP server for desktop apps
3. **Batch Operations**: "Complete all tasks about X"
4. **Smart Suggestions**: Auto-complete based on history
5. **Voice Input**: Speech-to-text integration
6. **Custom Templates**: Pre-defined task templates

## Resources

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Nirvana API](https://focus.nirvanahq.com) (unofficial reverse-engineered)

## License

MIT (or your preferred license)
