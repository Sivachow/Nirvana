# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Browser                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Nirvana Web App (focus.nirvanahq.com)       │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  Page Context (Isolated)                        │    │   │
│  │  │                                                  │    │   │
│  │  │  • inject.js (Token Interceptor)                │    │   │
│  │  │    └── Wraps window.fetch()                     │    │   │
│  │  │    └── Extracts authtoken                       │    │   │
│  │  │    └── Posts to content script                  │    │   │
│  │  └──────────────────┬───────────────────────────────┘    │   │
│  │                     │ postMessage (token)                │   │
│  │  ┌──────────────────▼───────────────────────────────┐    │   │
│  │  │  Content Script Context                          │    │   │
│  │  │                                                   │    │   │
│  │  │  1. nirvana-api.js                               │    │   │
│  │  │     • API client                                 │    │   │
│  │  │     • Request signing                            │    │   │
│  │  │     • CRUD operations                            │    │   │
│  │  │                                                   │    │   │
│  │  │  2. token-manager.js                             │    │   │
│  │  │     • Captures token from inject.js              │    │   │
│  │  │     • Stores in chrome.storage.local             │    │   │
│  │  │     • Initializes API client                     │    │   │
│  │  │                                                   │    │   │
│  │  │  3. nirvana-data.js                              │    │   │
│  │  │     • Data caching (5min TTL)                    │    │   │
│  │  │     • Search/filter utilities                    │    │   │
│  │  │                                                   │    │   │
│  │  │  4. ai-handler.js                                │    │   │
│  │  │     • OpenAI integration                         │    │   │
│  │  │     • Function definitions                       │    │   │
│  │  │     • Function execution                         │    │   │
│  │  │                                                   │    │   │
│  │  │  5. spotlight.js                                 │    │   │
│  │  │     • UI component                               │    │   │
│  │  │     • User input handling                        │    │   │
│  │  │     • Response display                           │    │   │
│  │  │                                                   │    │   │
│  │  │  6. bridge.js                                    │    │   │
│  │  │     • Initialization                             │    │   │
│  │  │     • Keyboard shortcuts                         │    │   │
│  │  │     • Event coordination                         │    │   │
│  │  └────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Extension Context (Background)                   │   │
│  │                                                           │   │
│  │  • background.js (Service Worker)                        │   │
│  │    └── Command listener (Cmd+Shift+K)                    │   │
│  │    └── Sends message to content script                   │   │
│  │                                                           │   │
│  │  • options.html/js (Settings Page)                       │   │
│  │    └── API key configuration                             │   │
│  │    └── Stores in chrome.storage.local                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────┘

External Services:
┌────────────────────┐         ┌────────────────────┐
│  OpenAI API        │         │  Nirvana API       │
│  (GPT-4o-mini)     │         │  (gc-api.nirvanahq)│
│                    │         │                    │
│  • Chat completions│         │  • /everything     │
│  • Function calling│         │  • task.save       │
└────────────────────┘         └────────────────────┘
```

## Data Flow Diagrams

### 1. Token Capture Flow

```
┌──────────┐
│  User    │
│  Loads   │
│  Page    │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Nirvana makes    │
│ API call with    │
│ authtoken param  │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ inject.js wraps  │
│ fetch() and      │
│ extracts token   │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Posts token via  │
│ window.post-     │
│ Message()        │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ token-manager.js │
│ receives token   │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Stores in        │
│ chrome.storage   │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Sets token on    │
│ NirvanaAPI       │
│ instance         │
└──────────────────┘
```

### 2. User Command Flow

```
┌──────────┐
│   User   │
│  Presses │
│  Cmd+K   │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│  Spotlight       │
│  Opens           │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  User types:     │
│  "Add buy milk"  │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  ai-handler.js   │
│  processInput()  │
└────┬─────────────┘
     │
     ▼
┌──────────────────────────────────┐
│  OpenAI API                       │
│  • System prompt                  │
│  • User message                   │
│  • Function definitions           │
│  ─────────────────────────────    │
│  Returns: {                       │
│    function_call: {               │
│      name: "add_task",            │
│      arguments: {                 │
│        name: "buy milk",          │
│        list: "next"               │
│      }                            │
│    }                              │
│  }                                │
└────┬──────────────────────────────┘
     │
     ▼
┌──────────────────┐
│  ai-handler.js   │
│  executeFunction │
│  ("add_task")    │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  nirvana-api.js  │
│  addTask()       │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Nirvana API     │
│  POST /everything│
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Result returns  │
│  to AI handler   │
└────┬─────────────┘
     │
     ▼
┌──────────────────────────────────┐
│  Send result back to OpenAI:     │
│  {                                │
│    role: "function",              │
│    name: "add_task",              │
│    content: "{success: true}"     │
│  }                                │
│  ─────────────────────────────    │
│  OpenAI generates natural response│
│  "I've added 'buy milk' to        │
│   your Next list."                │
└────┬──────────────────────────────┘
     │
     ▼
┌──────────────────┐
│  Display in      │
│  Spotlight       │
└──────────────────┘
```

### 3. Search Flow

```
User: "Find tasks about project"
       │
       ▼
AI determines: search_tasks function
       │
       ▼
ai-handler.executeFunction("search_tasks", {query: "project"})
       │
       ▼
nirvana-data.js.searchTasks("project")
       │
       ▼
Check cache (5min TTL)
       │
   ┌───┴────┐
   │        │
Cache    Cache
Valid    Expired
   │        │
   │        └─► Fetch from API
   │                │
   └────────────────┴─► Return filtered results
                         │
                         ▼
                    AI generates response:
                    "I found 3 tasks about project:
                     1. Project planning
                     2. Project review
                     3. Project documentation"
```

## Component Responsibilities

```
┌─────────────────────────────────────────────────────────────┐
│                     Component Matrix                         │
├──────────────────┬──────────────────────────────────────────┤
│ inject.js        │ • Intercept fetch calls                  │
│                  │ • Extract auth tokens                    │
│                  │ • Send to content script                 │
├──────────────────┼──────────────────────────────────────────┤
│ token-manager.js │ • Receive tokens from inject             │
│                  │ • Store in chrome.storage                │
│                  │ • Initialize API client                  │
│                  │ • Manage token lifecycle                 │
├──────────────────┼──────────────────────────────────────────┤
│ nirvana-api.js   │ • API request signing                    │
│                  │ • CRUD operations (add/update/delete)    │
│                  │ • Task state management                  │
│                  │ • Error handling                         │
├──────────────────┼──────────────────────────────────────────┤
│ nirvana-data.js  │ • Data caching (5min TTL)                │
│                  │ • Search & filter operations             │
│                  │ • State-based queries                    │
│                  │ • Cache invalidation                     │
├──────────────────┼──────────────────────────────────────────┤
│ ai-handler.js    │ • OpenAI integration                     │
│                  │ • Function schema definitions            │
│                  │ • Function execution routing             │
│                  │ • Conversation management                │
│                  │ • Natural language response generation   │
├──────────────────┼──────────────────────────────────────────┤
│ spotlight.js     │ • UI rendering                           │
│                  │ • User input capture                     │
│                  │ • Response display                       │
│                  │ • Keyboard handling                      │
│                  │ • Special commands (/setkey, /clear)     │
├──────────────────┼──────────────────────────────────────────┤
│ bridge.js        │ • Module initialization                  │
│                  │ • Global keyboard shortcuts              │
│                  │ • Event coordination                     │
│                  │ • Message passing                        │
├──────────────────┼──────────────────────────────────────────┤
│ background.js    │ • Extension commands (Cmd+K)             │
│                  │ • Service worker lifecycle               │
│                  │ • Message routing                        │
├──────────────────┼──────────────────────────────────────────┤
│ options.html/js  │ • Settings UI                            │
│                  │ • API key management                     │
│                  │ • Configuration storage                  │
└──────────────────┴──────────────────────────────────────────┘
```

## Security Boundaries

```
┌──────────────────────────────────────────────────────────┐
│                    Security Model                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────┐                              │
│  │  Page Context          │ Low Trust                    │
│  │  (inject.js)           │                              │
│  │  • Only extracts token │                              │
│  │  • No API access       │                              │
│  └───────┬────────────────┘                              │
│          │ postMessage (token only)                      │
│          ▼                                                │
│  ┌────────────────────────┐                              │
│  │  Content Script        │ High Trust                   │
│  │  • Validates tokens    │                              │
│  │  • Makes API calls     │                              │
│  │  • Stores secrets      │                              │
│  └───────┬────────────────┘                              │
│          │ chrome.storage.local (encrypted by browser)   │
│          ▼                                                │
│  ┌────────────────────────┐                              │
│  │  Chrome Storage        │ Secure                       │
│  │  • authtoken           │                              │
│  │  • openai_api_key      │                              │
│  └────────────────────────┘                              │
│                                                           │
│  External APIs (HTTPS only):                             │
│  • https://api.openai.com                                │
│  • https://gc-api.nirvanahq.com                          │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## State Management

```
Global State (window.*):
┌─────────────────────────────────────────┐
│ window.__nirvanaTokenManager            │
│   ├── api: NirvanaAPI                   │
│   ├── isInjected: boolean               │
│   └── methods: init, fetchData, etc.    │
│                                          │
│ window.__nirvanaDataManager             │
│   ├── cache: {tasks, projects, etc.}    │
│   ├── lastFetch: timestamp              │
│   └── methods: getData, search, etc.    │
│                                          │
│ window.__nirvanaSpotlight               │
│   └── toggle: function                  │
│                                          │
│ window.AIHandler                        │
│   ├── api: NirvanaAPI                   │
│   ├── apiKey: string                    │
│   └── methods: processInput, etc.       │
└─────────────────────────────────────────┘

Chrome Storage (persistent):
┌─────────────────────────────────────────┐
│ chrome.storage.local                    │
│   ├── authtoken: string                 │
│   └── openai_api_key: string            │
└─────────────────────────────────────────┘

Component State (local):
┌─────────────────────────────────────────┐
│ ai-handler.js                           │
│   └── conversationHistory: Message[]    │
│                                          │
│ spotlight.js                            │
│   ├── input: HTMLInputElement           │
│   ├── responseDiv: HTMLDivElement       │
│   └── conversationHistory: Message[]    │
└─────────────────────────────────────────┘
```

## Performance Characteristics

```
Operation                   | Latency      | Caching
─────────────────────────────────────────────────────
Token Capture               | ~0ms         | N/A
Spotlight Open              | ~50-100ms    | N/A
Data Fetch (cached)         | ~10-50ms     | ✅ 5min TTL
Data Fetch (fresh)          | ~300-800ms   | ❌
AI Processing (OpenAI)      | ~1-3s        | ❌
Task Creation (API)         | ~300-500ms   | ❌
Search (cached)             | ~10-50ms     | ✅
Complete Flow (cache hit)   | ~1.5-3.5s    | Partial
Complete Flow (cache miss)  | ~2-4s        | None
```
