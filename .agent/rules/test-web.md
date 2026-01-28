---
trigger: always_on
glob:
description: MANDATORY web testing protocol - NO multiple tabs, backend logs FIRST
---

# Web Testing Protocol (MANDATORY)

## 🚨 CRITICAL RULES (MUST FOLLOW)

### Rule 1: SINGLE BROWSER SESSION ONLY
**NEVER open multiple tabs to the same URL in a loop.**
- ✅ Open browser ONCE per test
- ❌ DO NOT open multiple tabs trying to "retry" or "refresh"
- ❌ DO NOT call browser_subagent multiple times for the same page

### Rule 2: CHECK LARAVEL LOGS BEFORE BROWSER
**ALWAYS check backend logs BEFORE opening browser.**

```bash
# MANDATORY pre-flight check
tail -n 50 /Users/hainc/duan/agent/laravel-backend/storage/logs/laravel.log | grep -i error
```

**If there are Laravel errors → FIX BACKEND FIRST → THEN test browser (once)**

### Rule 3: BLANK PAGE = BACKEND ERROR (90% of cases)
When browser shows blank/white page:
1. **STOP** opening more tabs
2. **CHECK** Laravel logs immediately
3. **FIX** backend error
4. **THEN** test again (single tab)

**DO NOT assume it's a frontend issue.**

---

## Testing Workflow (MANDATORY SEQUENCE)

```
1. Check Laravel logs
   ↓
2. Fix any backend errors found
   ↓
3. Open browser ONCE
   ↓
4. If blank → GOTO step 1
   ↓
5. Test feature
   ↓
6. Document results
```

---

## Browser Subagent Usage

### ✅ CORRECT Usage
```javascript
// Open page once with clear task
browser_subagent({
    task: "Navigate to URL, verify element exists, take screenshot"
})
```

### ❌ FORBIDDEN Usage
```javascript
// DO NOT DO THIS
browser_subagent({ task: "Open URL" })
browser_subagent({ task: "Try again" })     // ❌ FORBIDDEN
browser_subagent({ task: "Refresh" })       // ❌ FORBIDDEN
browser_subagent({ task: "Open URL again" }) // ❌ FORBIDDEN
```

---

## Common Laravel Errors That Cause Blank Pages

| Error Type | Log Pattern | Fix |
|------------|-------------|-----|
| Undefined variable | `Undefined variable $xyz` | Add variable to Inertia::render() props |
| Route not found | `NotFoundHttpException` | Check route exists: `php artisan route:list` |
| DB error | `SQLSTATE` | Fix query or migration |
| Missing column | `Column not found: 1054` | Fix database schema or query |

---

## Summary (3 Rules)

1. **Check Laravel logs FIRST** (before browser)
2. **Open browser ONCE** (no multiple tabs)
3. **Blank page = Backend error** (fix Laravel first)

**VIOLATION OF THESE RULES = WASTED TIME + BROWSER TAB SPAM**
