# Authentication API Documentation

## Tổng quan

API Authentication cung cấp các endpoint để quản lý xác thực người dùng sử dụng JWT tokens.

## Base URL

```
http://localhost:8000
```

## Endpoints

### 1. Đăng ký người dùng mới

**POST** `/api/auth/register`

Tạo tài khoản người dùng mới.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Response (Success - 201)

```json
{
  "success": true,
  "message": "User registered successfully",
  "user_id": 1,
  "email": "user@example.com"
}
```

#### Response (Error - 400)

```json
{
  "success": false,
  "message": "Email already exists"
}
```

### 2. Đăng nhập

**POST** `/api/auth/login`

Xác thực người dùng và trả về JWT token.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 1,
  "email": "user@example.com"
}
```

#### Response (Error - 401)

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 3. Kiểm tra Token (Verify)

**GET** `/api/auth/verify`

Xác minh JWT token và trả về thông tin người dùng từ token.

#### Headers

```
Authorization: Bearer <token>
```

#### Response (Success - 200)

```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "email": "user@example.com"
  }
}
```

#### Response (Error - 401)

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 4. Lấy thông tin người dùng hiện tại

**GET** `/api/auth/me`

Lấy thông tin người dùng từ database dựa trên token.

#### Headers

```
Authorization: Bearer <token>
```

#### Response (Success - 200)

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### Response (Error - 401)

```json
{
  "success": false,
  "message": "No token provided"
}
```

## Sử dụng

### Python với aiohttp

```python
import aiohttp

async def check_login(token: str):
    """Kiểm tra xem người dùng đã đăng nhập hay chưa."""

    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": f"Bearer {token}"}

        async with session.get(
            "http://localhost:8000/api/auth/verify",
            headers=headers
        ) as resp:
            result = await resp.json()

            if result.get("success"):
                user = result.get("user")
                print(f"User logged in: {user['email']}")
                return True
            else:
                print("User not logged in or token expired")
                return False
```

### Python với requests

```python
import requests

def check_login(token: str) -> bool:
    """Kiểm tra xem người dùng đã đăng nhập hay chưa."""

    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(
        "http://localhost:8000/api/auth/verify",
        headers=headers
    )

    result = response.json()

    if result.get("success"):
        user = result.get("user")
        print(f"User logged in: {user['email']}")
        return True
    else:
        print("User not logged in or token expired")
        return False
```

### JavaScript/TypeScript

```javascript
async function checkLogin(token) {
    try {
        const response = await fetch('http://localhost:8000/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            console.log('User logged in:', result.user.email);
            return true;
        } else {
            console.log('User not logged in or token expired');
            return false;
        }
    } catch (error) {
        console.error('Error checking login:', error);
        return false;
    }
}
```

### cURL

```bash
# Đăng nhập và lấy token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'

# Kiểm tra token
curl -X GET http://localhost:8000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Lấy thông tin user
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Các lưu ý

1. **Token Format**: Token phải được gửi trong header `Authorization` với prefix `Bearer `
2. **Token Expiration**: Token mặc định hết hạn sau 24 giờ (có thể cấu hình qua `JWT_EXPIRATION_HOURS`)
3. **Security**:
   - Luôn sử dụng HTTPS trong production
   - Không lưu token trong localStorage nếu có thể
   - Implement token refresh nếu cần session dài hạn
4. **Error Handling**: Luôn kiểm tra field `success` trong response

## Testing

Chạy test để kiểm tra tất cả endpoints:

```bash
python tests/test_auth_check.py
```

## Environment Variables

Cần thiết lập các biến môi trường sau:

```bash
# Required
JWT_SECRET=your-super-secret-key-here

# Optional (with defaults)
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
API_HOST=0.0.0.0
API_PORT=8000
PASSWORD_MIN_LENGTH=8
```
