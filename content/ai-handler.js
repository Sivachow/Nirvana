// ai-handler.js - AI-powered natural language processing for Nirvana commands

class AIHandler {
    constructor(api) {
        this.api = api;
        this.apiKey = null;
        this.loadAPIKey();
    }

    async loadAPIKey() {
        try {
            const result = await chrome.storage.local.get(['openai_api_key']);
            this.apiKey = result.openai_api_key;
        } catch (error) {
            console.error('[AI Handler] Failed to load API key:', error);
        }
    }

    async setAPIKey(key) {
        this.apiKey = key;
        await chrome.storage.local.set({ openai_api_key: key });
    }

    /**
     * Define available functions for the AI to call
     */
    getFunctionDefinitions() {
        return [
            {
                name: "add_task",
                description: "Create a new task in Nirvana. Use this when the user wants to add, create, or make a new task.",
                parameters: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "The task name/title"
                        },
                        note: {
                            type: "string",
                            description: "Additional details or notes about the task"
                        },
                        list: {
                            type: "string",
                            enum: ["inbox", "next", "waiting", "scheduled", "someday"],
                            description: "Which list to add the task to. Default is 'next'"
                        }
                    },
                    required: ["name"]
                }
            },
            {
                name: "update_task",
                description: "Update an existing task's name, note, or list. Use this when the user wants to modify, edit, or change a task.",
                parameters: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "The task ID to update"
                        },
                        name: {
                            type: "string",
                            description: "New task name (optional)"
                        },
                        note: {
                            type: "string",
                            description: "New task note (optional)"
                        },
                        list: {
                            type: "string",
                            enum: ["inbox", "next", "waiting", "scheduled", "someday", "trash"],
                            description: "Move to a different list (optional)"
                        }
                    },
                    required: ["id"]
                }
            },
            {
                name: "complete_task",
                description: "Mark a task as completed. Use this when the user wants to complete, finish, or mark done a task.",
                parameters: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "The task ID to complete"
                        }
                    },
                    required: ["id"]
                }
            },
            {
                name: "delete_task",
                description: "Delete a task (move to trash). Use this when the user wants to delete, remove, or trash a task.",
                parameters: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "The task ID to delete"
                        }
                    },
                    required: ["id"]
                }
            },
            {
                name: "search_tasks",
                description: "Search for tasks by name or note content. Use this when the user wants to find, search, or look for tasks.",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query to find tasks"
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "list_tasks",
                description: "List all tasks in a specific list/state. Use this when the user wants to see tasks in a particular list.",
                parameters: {
                    type: "object",
                    properties: {
                        list: {
                            type: "string",
                            enum: ["inbox", "next", "waiting", "scheduled", "someday"],
                            description: "Which list to retrieve tasks from"
                        }
                    },
                    required: ["list"]
                }
            }
        ];
    }

    /**
     * Execute a function call from the AI
     */
    async executeFunction(functionName, args) {
        console.log(`[AI Handler] Executing function: ${functionName}`, args);

        try {
            switch (functionName) {
                case "add_task": {
                    const result = await this.api.addTask(
                        args.name,
                        args.note || '',
                        args.list || 'next'
                    );
                    // Proactively refresh cached data so the new task shows up immediately
                    try {
                        const dm = window.__nirvanaDataManager;
                        if (dm) {
                            await dm.getData(true); // force refresh
                        }
                    } catch (e) {
                        console.warn('[AI Handler] Post-add cache refresh failed:', e);
                    }
                    return "Task added successfully.";
                }

                case "update_task":
                    return await this.api.updateTask(args);

                case "complete_task":
                    return await this.api.complete(args.id);

                case "delete_task":
                    return await this.api.deleteTask(args.id);

                case "search_tasks":
                    const dataManager = window.__nirvanaDataManager;
                    if (!dataManager) {
                        throw new Error('Data manager not available');
                    }
                    await dataManager.getData(false);
                    const results = dataManager.searchTasks(args.query);
                    return {
                        success: true,
                        count: results.length,
                        tasks: results.slice(0, 10).map(t => ({
                            id: t.id,
                            name: t.name,
                            note: t.note,
                            state: t.state
                        }))
                    };

                case "list_tasks":
                    const dm = window.__nirvanaDataManager;
                    if (!dm) {
                        throw new Error('Data manager not available');
                    }
                    await dm.getData(false);
                    const tasks = dm.getTasksByState(args.list);
                    return {
                        success: true,
                        count: tasks.length,
                        tasks: tasks.slice(0, 10).map(t => ({
                            id: t.id,
                            name: t.name,
                            note: t.note
                        }))
                    };

                default:
                    throw new Error(`Unknown function: ${functionName}`);
            }
        } catch (error) {
            console.error(`[AI Handler] Function execution failed:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async processInput(userInput, conversationHistory = []) {
        console.log('[AI Handler] Processing input:', userInput);

        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured. Please set it in the extension options.');
        }

        const toItem = (role, text) => ({
            role: role === "user" || role === "assistant" || role === "system" ? role : "user",
            content: [{ type: "input_text", text: String(text ?? "") }]
        });

        const input = [
            toItem("system", `You are an AI assistant integrated into the Nirvana task management app. 
You help users manage their tasks through natural language commands.

When users ask to create, update, delete, complete, search, or list tasks, call the appropriate function.
Be concise and helpful. If a task ID is needed but not provided, search for the task first.

Available task lists:
- inbox: New items that haven't been processed
- next: Tasks to do soon  
- waiting: Waiting for something/someone
- scheduled: Scheduled for a specific date
- someday: Maybe later`),
            ...(Array.isArray(conversationHistory) ? conversationHistory : [])
                .filter(m => m && (m.role === "user" || m.role === "assistant"))
                .map(m => toItem(m.role, typeof m.content === "string" ? m.content : JSON.stringify(m.content))),
            toItem("user", userInput)
        ];

        const tools = (this.getFunctionDefinitions?.() || []).map(def => ({
            type: "function",
            name: def.name,
            description: def.description,
            parameters: def.parameters
        }));

        const callResponses = async (body) => {
            const res = await fetch('https://api.openai.com/v1/responses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                let detail;
                try { detail = await res.json(); } catch { /* ignore */ }
                console.error('[OpenAI Responses] error payload:', detail);
                const msg = detail?.error?.message || `OpenAI API request failed (${res.status})`;
                throw new Error(msg);
            }
            return res.json();
        };

        // 1) initial model call
        let response = await callResponses({
            model: 'gpt-5-mini',
            input,
            tools,
            parallel_tool_calls: true
        });

        console.log('[AI Handler] Initial response id:', response?.id);

        // Helper: pull new-style tool calls (Responses API) - only handle new format
        const getToolCalls = (r) => {
            const outputs = r.output ?? [];
            return outputs.filter(o => o && (o.type === 'tool_call' || o.type === 'function_call'));
        };

        console.log('[AI Handler] Tool calls found:', getToolCalls(response));

        // 2) Tool-call loop (new format only)
        // 2) Tool-call loop (new format only)
        // 2) Tool-call loop (new format only) — REPLACEMENT START
        // 2) Tool-call loop (new format only) — REPLACEMENT START
        let lastFunctionCalled = null;
        while (true) {
            const calls = getToolCalls(response);
            if (!calls.length) break;
            console.log(`[AI Handler] Processing ${calls.length} tool call(s)...`);

            const toolResults = [];
            for (const c of calls) {
                const originalCallId = c.call_id ?? c.id ?? Math.random().toString(36).slice(2);
                try {
                    const name = c.name;
                    lastFunctionCalled = name;

                    // parse args (arguments is usually JSON string)
                    let args = {};
                    if (typeof c.arguments === 'string') {
                        try { args = JSON.parse(c.arguments); } catch (e) { args = { __raw_arguments: c.arguments }; }
                    } else if (c.arguments && typeof c.arguments === 'object') {
                        args = c.arguments;
                    } else if (c.input && typeof c.input === 'object') {
                        args = c.input;
                    }

                    const result = await this.executeFunction(name, args);
                    toolResults.push({ call_id: originalCallId, output: result });
                } catch (err) {
                    toolResults.push({ call_id: originalCallId, output: { error: String(err?.message || err) } });
                }
            }

            // Build continuation input items — **output must be a string OR an array**
            const continuationInputs = toolResults.map(t => {
                // stringify structured results; keep plain strings as-is
                const text = (typeof t.output === 'string') ? t.output : (() => {
                    try { return JSON.stringify(t.output); } catch { return String(t.output); }
                })();

                return {
                    type: "function_call_output",
                    call_id: t.call_id,
                    // <- IMPORTANT: output is an array of content objects (not an object)
                    output: [
                        { type: "output_text", text }
                    ]
                };
            });

            // send continuation
            response = await callResponses({
                model: 'gpt-5-mini',
                previous_response_id: response.id,
                input: continuationInputs,
            });

            console.log('[AI Handler] Tool call continuation response id:', response?.id);
        }
        // 2) Tool-call loop (new format only) — REPLACEMENT END

        // 3) Extract final text (same logic)
        const parts = [];
        for (const item of (response.output || [])) {
            if (item.type === "message" && Array.isArray(item.content)) {
                for (const c of item.content) {
                    if ((c.type === "output_text" || c.type === "text") && c.text) parts.push(c.text);
                }
            }
        }

        return {
            response: parts.join("\n").trim(),
            functionCalled: lastFunctionCalled
        };
    }


}

// Export
window.AIHandler = AIHandler;
