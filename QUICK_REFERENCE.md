# 🎯 Quick Reference Card

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+K` (Mac) | Open Spotlight |
| `Ctrl+Shift+K` (Win/Linux) | Open Spotlight |
| `Esc` | Close Spotlight |
| `Enter` | Send Command |

## Special Commands
| Command | Description |
|---------|-------------|
| `/setkey sk-...` | Set OpenAI API key |
| `/clear` | Clear conversation history |

## Example Commands

### 📝 Create Tasks
```
Add buy groceries to next
Create task called call John
Add meeting with note discuss project to scheduled
Add review PR with note check code quality to next
```

### 🔍 Search Tasks
```
Find all tasks about project
Search for groceries
Show tasks with meeting
Find tasks about shopping
```

### ✅ Complete Tasks
```
Complete the groceries task
Mark the meeting task as done
Finish the call John task
Complete task about emails
```

### 📋 List Tasks
```
Show me all my next tasks
List all waiting tasks
What's in my inbox?
Show my someday tasks
List scheduled tasks
```

### 📝 Update Tasks
```
Move groceries to someday
Change meeting to scheduled
Update project task note to add deadline
Move the shopping task to next
```

### 🗑️ Delete Tasks
```
Delete the test task
Remove the old shopping task
Trash the completed task
Delete task about old project
```

## AI Functions Available

| Function | Purpose | Example |
|----------|---------|---------|
| `add_task` | Create new task | "Add X to list" |
| `update_task` | Modify existing | "Move X to Y" |
| `complete_task` | Mark as done | "Complete X" |
| `delete_task` | Move to trash | "Delete X" |
| `search_tasks` | Find by keyword | "Find tasks about X" |
| `list_tasks` | Show by state | "Show my next tasks" |

## Nirvana Lists

| List | Description |
|------|-------------|
| `inbox` | New, unprocessed items |
| `next` | Tasks to do soon |
| `waiting` | Waiting for someone/something |
| `scheduled` | Scheduled for specific date |
| `someday` | Maybe later |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not configured" | Set in Options or use `/setkey` |
| "Auth token not set" | Refresh Nirvana page |
| Spotlight won't open | Check you're on focus.nirvanahq.com |
| Function fails | Check Console for errors |

## API Costs (GPT-4o-mini)
- Per command: ~$0.001 (1/10th of a cent)
- 100 commands: ~$0.10
- 1000 commands: ~$1.00

## Files

### Core
- `content/ai-handler.js` - AI integration
- `content/spotlight.js` - UI
- `content/nirvana-api.js` - API client

### Configuration  
- `options.html` - Settings page
- `manifest.json` - Extension config

### Documentation
- `INTEGRATION_COMPLETE.md` - Start here
- `README.md` - Quick guide
- `DEVELOPER_GUIDE.md` - Technical details
- `TESTING.md` - How to test
- `MCP_GUIDE.md` - Future MCP integration
- `ARCHITECTURE.md` - System diagrams

## Getting Started

1. **Get API Key**
   - https://platform.openai.com/api-keys
   - Copy key (starts with `sk-`)

2. **Load Extension**
   - chrome://extensions/
   - Developer mode ON
   - Load unpacked → select folder

3. **Configure**
   - Right-click icon → Options
   - Paste API key → Save

4. **Test**
   - Go to focus.nirvanahq.com
   - Press Cmd+Shift+K
   - Type: "Add test task to next"

## Support

- Check `INTEGRATION_COMPLETE.md` for overview
- Check `TESTING.md` for troubleshooting
- Check Console (F12) for errors
- Look for `[AI Handler]` or `[Nirvana MCP]` messages

## Security

✅ API key encrypted by Chrome
✅ All traffic over HTTPS
✅ No data stored on servers
✅ Works only on Nirvana domain

---

**Need more help?** Read the full documentation files!
