# API Manual Testing Guide

This document provides curl commands for manually testing the Device Login Management API.

## Prerequisites

1. Start the Laravel server:
   ```bash
   cd laravel-backend
   php artisan serve
   ```

2. Reset database and seed test user:
   ```bash
   php artisan migrate:fresh --seed
   ```

This creates a test user:
- Email: `test@example.com`
- Password: `password123`

---

## Test Cases

### 1. Login (Desktop Chrome)

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Expected Response (200 OK):**
```json
{
  "token": "1|abc123...",
  "device": "Macintosh - OS X - Chrome"
}
```

**Save the token:** `export TOKEN1="<token-value>"`

---

### 2. Login (iPhone Safari)

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Expected Response (200 OK):**
```json
{
  "token": "2|def456...",
  "device": "iPhone - iOS - Safari"
}
```

**Save the token:** `export TOKEN2="<token-value>"`

---

### 3. List All Devices

```bash
curl -X GET http://localhost:8000/api/devices \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN1"
```

**Expected Response (200 OK):**
```json
{
  "devices": [
    {
      "id": 1,
      "name": "Macintosh - OS X - Chrome",
      "last_used_at": "2025-01-01T12:00:00.000000Z"
    },
    {
      "id": 2,
      "name": "iPhone - iOS - Safari",
      "last_used_at": "2025-01-01T12:01:00.000000Z"
    }
  ]
}
```

---

### 4. Unauthenticated Request (401)

```bash
curl -X GET http://localhost:8000/api/devices \
  -H "Accept: application/json"
```

**Expected Response (401 Unauthorized):**
```json
{
  "message": "Unauthenticated."
}
```

---

### 5. Delete Specific Device

```bash
# Replace {id} with actual device ID from step 3
curl -X DELETE http://localhost:8000/api/devices/1 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN2"
```

**Expected Response (204 No Content):** Empty body

---

### 6. Verify Deleted Token is Invalid

```bash
curl -X GET http://localhost:8000/api/devices \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN1"
```

**Expected Response (401 Unauthorized):**
```json
{
  "message": "Unauthenticated."
}
```

---

### 7. Logout All Other Devices

First, login a few more times:
```bash
# Login as Windows Firefox
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Firefox/121.0" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

Then logout all except current:
```bash
curl -X POST http://localhost:8000/api/devices/logout-all \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN2"
```

**Expected Response (200 OK):**
```json
{
  "message": "Successfully logged out from all other devices"
}
```

---

### 8. Verify Only Current Token Remains

```bash
curl -X GET http://localhost:8000/api/devices \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN2"
```

**Expected Response (200 OK):** Only 1 device in the list

---

### 9. Invalid Credentials

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "test@example.com", "password": "wrongpassword"}'
```

**Expected Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

---

### 10. Validation Errors

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "test@example.com"}'
```

**Expected Response (422 Unprocessable Entity):**
```json
{
  "message": "The password field is required.",
  "errors": {
    "password": ["The password field is required."]
  }
}
```

---

### 11. Non-Existent Device (404)

```bash
curl -X DELETE http://localhost:8000/api/devices/99999 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN2"
```

**Expected Response (404 Not Found):**
```json
{
  "message": "Device not found"
}
```

---

## Quick Test Commands (One-Liner)

After starting the server and seeding, run these in order:

```bash
# 1. Login and save token
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"

# 2. List devices
curl -s http://localhost:8000/api/devices -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 3. Test auth required
curl -s -w "\nStatus: %{http_code}\n" http://localhost:8000/api/devices
```

---

## API Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/login` | No | Login with device detection |
| GET | `/api/devices` | Yes | List all active devices |
| DELETE | `/api/devices/{id}` | Yes | Revoke specific device |
| POST | `/api/devices/logout-all` | Yes | Logout from all other devices |

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 204 | Success (No Content) - Used for DELETE |
| 401 | Unauthenticated or Invalid Credentials |
| 404 | Device Not Found |
| 422 | Validation Error |
