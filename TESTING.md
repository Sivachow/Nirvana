# Testing the Nirvana AI Extension

## Quick Test Steps

### 1. Load the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the Nirvana extension folder
5. Extension should appear in your extensions list

### 2. Configure API Key
**Option A: Via Options Page**
1. Right-click the extension icon
2. Click "Options"
3. Enter your OpenAI API key
4. Click "Save Settings"

**Option B: Via Spotlight**
1. Go to https://focus.nirvanahq.com/
2. Press `Cmd+Shift+K` (or `Ctrl+Shift+K`)
3. Type: `/setkey sk-YOUR_KEY_HERE`
4. Press Enter

### 3. Test Token Capture
1. Navigate to https://focus.nirvanahq.com/
2. Open Chrome DevTools (F12 or Cmd+Option+I)
3. Go to Console tab
4. You should see: `[Nirvana MCP] Token captured and stored`
5. If not, perform any action in Nirvana (click a list, add a task, etc.)

### 4. Test Basic Commands

Open spotlight with `Cmd+Shift+K` and try:

#### Create Tasks
```
Add buy groceries to my next list
Create a task called call John
Add meeting tomorrow with note discuss project timeline to scheduled
```

#### Search Tasks
```
Find all tasks about project
Search for groceries
Show me tasks with meeting in the name
```

#### List Tasks
```
Show me all my next tasks
List all waiting tasks
What's in my inbox?
```

#### Update Tasks
```
Complete the groceries task
Mark the meeting task as done
Move the call John task to someday
```

#### Delete Tasks
```
Delete the test task
Remove the old task about shopping
```

### 5. Verify Results
After each command:
1. Check spotlight for AI response
2. Verify in Nirvana UI that action was performed
3. Check Console for any errors

## Test Checklist

- [ ] Extension loads without errors
- [ ] API key saves successfully
- [ ] Token is captured on page load
- [ ] Spotlight opens with Cmd+Shift+K
- [ ] Can create a task
- [ ] Can search tasks
- [ ] Can list tasks by state
- [ ] Can complete a task
- [ ] Can delete a task
- [ ] AI responds naturally
- [ ] Errors are displayed clearly

## Common Issues & Solutions

### Issue: "API key not configured"
**Solution**: Set API key in Options page or use `/setkey` command

### Issue: "Auth token not set"
**Solution**: 
- Refresh Nirvana page
- Perform any action in Nirvana to trigger API call
- Check Console for token capture message

### Issue: Spotlight doesn't open
**Solution**:
- Check if you're on focus.nirvanahq.com
- Try clicking the extension icon instead
- Reload the extension in chrome://extensions/

### Issue: Functions not executing
**Solution**:
- Verify token was captured (check Console)
- Verify API key is set correctly
- Check Network tab for failed API calls
- Look for errors in Console

### Issue: "Task not found" errors
**Solution**:
- Be more specific with task names
- Try searching first: "Find tasks about X"
- Use exact task name from search results

## Debug Commands

### Check Token
```javascript
// In DevTools Console
window.__nirvanaTokenManager.getAuthToken()
```

### Check Data Manager
```javascript
// Get all tasks
const dm = window.__nirvanaDataManager;
await dm.getData(true);
dm.getDataByType('task')
```

### Test API Directly
```javascript
// Test API
const api = window.__nirvanaTokenManager.api;
await api.fetchEverything('0');
```

### Test AI Handler
```javascript
// Test AI
const handler = new AIHandler(window.__nirvanaTokenManager.api);
await handler.loadAPIKey();
const result = await handler.processInput("Add test task to next");
console.log(result);
```

## Sample Test Session

Here's a complete test session you can run:

```
# Open spotlight (Cmd+Shift+K)

# Create a test task
> Add test task 1 to next
[AI should confirm task created]

# Search for it
> Find tasks with test in the name
[AI should list tasks found]

# Complete it
> Complete test task 1
[AI should confirm completion]

# Create another
> Create a task called test task 2 with note this is for testing to next
[AI should confirm task created]

# Move it
> Move test task 2 to someday
[AI should confirm task moved]

# Delete it
> Delete test task 2
[AI should confirm deletion]

# Clear conversation
> /clear
[Should see "Conversation cleared!"]
```

## Performance Checks

- Spotlight opens: < 200ms
- AI response time: 1-3 seconds
- Task creation: < 500ms after AI response
- Search: < 200ms (uses cache)

## Security Checks

- [ ] API key not visible in Console logs
- [ ] Token not logged in plain text
- [ ] All requests use HTTPS
- [ ] Storage uses Chrome's encrypted storage
- [ ] No sensitive data in error messages

## Next Steps After Testing

1. **Report Issues**: Note any bugs or unexpected behavior
2. **Try Edge Cases**: Very long task names, special characters, etc.
3. **Test Permissions**: Try on non-Nirvana sites (should not inject)
4. **Monitor Performance**: Check memory usage in Task Manager
5. **User Testing**: Get feedback from actual Nirvana users

## Useful Links

- OpenAI API Dashboard: https://platform.openai.com/usage
- Chrome Extensions: chrome://extensions/
- Extension Storage: DevTools > Application > Storage > Local Storage
- Background Service Worker: Click "Service Worker" link in extensions page
