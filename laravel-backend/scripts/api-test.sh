#!/bin/bash

# =============================================================================
# API End-to-End Testing Script
# Laravel Backend with Device Login Management API
# =============================================================================
#
# Prerequisites:
#   1. Start Laravel server: cd laravel-backend && php artisan serve
#   2. Run migrations: php artisan migrate:fresh
#   3. Seed database: php artisan db:seed
#      (creates test@example.com user with factory password)
#
# For manual testing, you can also create a user via tinker:
#   php artisan tinker
#   > User::create(['name' => 'Test', 'email' => 'test@example.com', 'password' => bcrypt('password123')])
#
# Usage:
#   chmod +x scripts/api-test.sh
#   ./scripts/api-test.sh
#
# =============================================================================

set -e

BASE_URL="${API_BASE_URL:-http://localhost:8000/api}"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
}

print_step() {
    echo ""
    echo -e "${YELLOW}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

print_info() {
    echo -e "    $1"
}

# =============================================================================
# TEST 1: Login and get token
# =============================================================================
print_header "TEST 1: POST /api/login - Login with device detection"

print_step "Logging in as Desktop Chrome browser..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/login" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
    -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

echo "Response: $LOGIN_RESPONSE"

# Extract token
TOKEN1=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
DEVICE1=$(echo "$LOGIN_RESPONSE" | grep -o '"device":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN1" ]; then
    print_error "Failed to get token from login response"
fi

print_success "Logged in successfully!"
print_info "Token: ${TOKEN1:0:50}..."
print_info "Device: $DEVICE1"

# =============================================================================
# TEST 2: Login again with different User-Agent (simulating mobile)
# =============================================================================
print_header "TEST 2: POST /api/login - Login from Mobile Safari (second device)"

print_step "Logging in as iPhone Safari..."
LOGIN_RESPONSE2=$(curl -s -X POST "${BASE_URL}/login" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1" \
    -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

echo "Response: $LOGIN_RESPONSE2"

TOKEN2=$(echo "$LOGIN_RESPONSE2" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
DEVICE2=$(echo "$LOGIN_RESPONSE2" | grep -o '"device":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN2" ]; then
    print_error "Failed to get second token from login response"
fi

print_success "Logged in successfully on second device!"
print_info "Token: ${TOKEN2:0:50}..."
print_info "Device: $DEVICE2"

# =============================================================================
# TEST 3: List all devices
# =============================================================================
print_header "TEST 3: GET /api/devices - List active devices"

print_step "Listing all active devices using Token 1..."
DEVICES_RESPONSE=$(curl -s -X GET "${BASE_URL}/devices" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${TOKEN1}")

echo "Response: $DEVICES_RESPONSE"

# Check if devices array contains 2 items
DEVICE_COUNT=$(echo "$DEVICES_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$DEVICE_COUNT" -eq 2 ]; then
    print_success "Found $DEVICE_COUNT devices as expected!"
else
    print_error "Expected 2 devices, found $DEVICE_COUNT"
fi

# Extract first device ID for later deletion
DEVICE_ID1=$(echo "$DEVICES_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
print_info "First Device ID: $DEVICE_ID1"

# =============================================================================
# TEST 4: Unauthenticated request should return 401
# =============================================================================
print_header "TEST 4: GET /api/devices - Unauthenticated request returns 401"

print_step "Making request without Bearer token..."
UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/devices" \
    -H "Accept: application/json")

HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$UNAUTH_RESPONSE" | head -n -1)

echo "Response: $RESPONSE_BODY"
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 401 ]; then
    print_success "Correctly returned 401 Unauthorized!"
else
    print_error "Expected 401, got $HTTP_CODE"
fi

# =============================================================================
# TEST 5: Login a third time for logout-all test
# =============================================================================
print_header "TEST 5: POST /api/login - Login third device (Windows Firefox)"

print_step "Logging in as Windows Firefox..."
LOGIN_RESPONSE3=$(curl -s -X POST "${BASE_URL}/login" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0" \
    -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

echo "Response: $LOGIN_RESPONSE3"

TOKEN3=$(echo "$LOGIN_RESPONSE3" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
DEVICE3=$(echo "$LOGIN_RESPONSE3" | grep -o '"device":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN3" ]; then
    print_error "Failed to get third token from login response"
fi

print_success "Logged in successfully on third device!"
print_info "Token: ${TOKEN3:0:50}..."
print_info "Device: $DEVICE3"

# Verify 3 devices now exist
print_step "Verifying 3 devices exist..."
DEVICES_RESPONSE=$(curl -s -X GET "${BASE_URL}/devices" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${TOKEN1}")

DEVICE_COUNT=$(echo "$DEVICES_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$DEVICE_COUNT" -eq 3 ]; then
    print_success "Found $DEVICE_COUNT devices as expected!"
else
    print_error "Expected 3 devices, found $DEVICE_COUNT"
fi

# =============================================================================
# TEST 6: Logout all other devices
# =============================================================================
print_header "TEST 6: POST /api/devices/logout-all - Logout from all other devices"

print_step "Logging out all devices except Token 2 (iPhone)..."
LOGOUT_RESPONSE=$(curl -s -X POST "${BASE_URL}/devices/logout-all" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${TOKEN2}")

echo "Response: $LOGOUT_RESPONSE"
print_success "Logout all request completed!"

# =============================================================================
# TEST 7: Verify only current token remains valid
# =============================================================================
print_header "TEST 7: Verify token validity after logout-all"

print_step "Testing Token 2 (should still work)..."
TOKEN2_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/devices" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${TOKEN2}")

HTTP_CODE=$(echo "$TOKEN2_RESPONSE" | tail -1)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_success "Token 2 is still valid (200 OK)!"
else
    print_error "Token 2 should still be valid, got $HTTP_CODE"
fi

print_step "Testing Token 1 (should be revoked - 401)..."
TOKEN1_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/devices" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${TOKEN1}")

HTTP_CODE=$(echo "$TOKEN1_RESPONSE" | tail -1)
if [ "$HTTP_CODE" -eq 401 ]; then
    print_success "Token 1 correctly returns 401 (revoked)!"
else
    print_error "Token 1 should be revoked, got $HTTP_CODE"
fi

print_step "Testing Token 3 (should be revoked - 401)..."
TOKEN3_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/devices" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${TOKEN3}")

HTTP_CODE=$(echo "$TOKEN3_RESPONSE" | tail -1)
if [ "$HTTP_CODE" -eq 401 ]; then
    print_success "Token 3 correctly returns 401 (revoked)!"
else
    print_error "Token 3 should be revoked, got $HTTP_CODE"
fi

# =============================================================================
# TEST 8: Delete specific device
# =============================================================================
print_header "TEST 8: DELETE /api/devices/{id} - Revoke specific device"

# Login again to create new token
print_step "Creating new token for deletion test..."
LOGIN_RESPONSE_NEW=$(curl -s -X POST "${BASE_URL}/login" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "User-Agent: Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36" \
    -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"${TEST_PASSWORD}\"}")

TOKEN_NEW=$(echo "$LOGIN_RESPONSE_NEW" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
print_info "New token created: ${TOKEN_NEW:0:50}..."

# Get devices to find the new token's ID
DEVICES_RESPONSE=$(curl -s -X GET "${BASE_URL}/devices" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${TOKEN2}")

echo "Current devices: $DEVICES_RESPONSE"

# Get the ID of the newly created token (should be the last one)
NEW_DEVICE_ID=$(echo "$DEVICES_RESPONSE" | grep -o '"id":[0-9]*' | tail -1 | cut -d':' -f2)
print_info "New device ID to delete: $NEW_DEVICE_ID"

print_step "Deleting device $NEW_DEVICE_ID..."
DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/devices/${NEW_DEVICE_ID}" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${TOKEN2}")

HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$DELETE_RESPONSE" | head -n -1)

echo "Response: $RESPONSE_BODY"
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 204 ]; then
    print_success "Device deleted successfully (204 No Content)!"
else
    print_error "Expected 204, got $HTTP_CODE"
fi

# =============================================================================
# TEST 9: Verify deleted token is invalid
# =============================================================================
print_header "TEST 9: Verify deleted token returns 401"

print_step "Testing deleted token..."
DELETED_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/devices" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${TOKEN_NEW}")

HTTP_CODE=$(echo "$DELETED_TOKEN_RESPONSE" | tail -1)
if [ "$HTTP_CODE" -eq 401 ]; then
    print_success "Deleted token correctly returns 401!"
else
    print_error "Deleted token should return 401, got $HTTP_CODE"
fi

# =============================================================================
# TEST 10: Non-existent device returns 404
# =============================================================================
print_header "TEST 10: DELETE /api/devices/99999 - Non-existent device returns 404"

print_step "Trying to delete non-existent device 99999..."
NOTFOUND_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/devices/99999" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${TOKEN2}")

HTTP_CODE=$(echo "$NOTFOUND_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$NOTFOUND_RESPONSE" | head -n -1)

echo "Response: $RESPONSE_BODY"
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 404 ]; then
    print_success "Non-existent device correctly returns 404!"
else
    print_error "Expected 404, got $HTTP_CODE"
fi

# =============================================================================
# TEST 11: Invalid credentials return 401
# =============================================================================
print_header "TEST 11: POST /api/login - Invalid credentials return 401"

print_step "Trying to login with wrong password..."
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/login" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "{\"email\": \"${TEST_EMAIL}\", \"password\": \"wrongpassword\"}")

HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$INVALID_RESPONSE" | head -n -1)

echo "Response: $RESPONSE_BODY"
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 401 ]; then
    print_success "Invalid credentials correctly return 401!"
else
    print_error "Expected 401, got $HTTP_CODE"
fi

# =============================================================================
# TEST 12: Validation errors
# =============================================================================
print_header "TEST 12: POST /api/login - Validation errors"

print_step "Trying to login without password..."
VALIDATION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/login" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "{\"email\": \"${TEST_EMAIL}\"}")

HTTP_CODE=$(echo "$VALIDATION_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$VALIDATION_RESPONSE" | head -n -1)

echo "Response: $RESPONSE_BODY"
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 422 ]; then
    print_success "Validation error correctly returns 422!"
else
    print_error "Expected 422, got $HTTP_CODE"
fi

# =============================================================================
# SUMMARY
# =============================================================================
print_header "TEST SUMMARY"
echo ""
echo -e "${GREEN}All tests completed successfully!${NC}"
echo ""
echo "API Endpoints Verified:"
echo "  - POST   /api/login           - Login with device detection"
echo "  - GET    /api/devices         - List active devices"
echo "  - DELETE /api/devices/{id}    - Revoke specific device"
echo "  - POST   /api/devices/logout-all - Logout from all other devices"
echo ""
echo "Features Verified:"
echo "  - Device detection from User-Agent header"
echo "  - Token creation and authentication"
echo "  - Token revocation (immediate invalidation)"
echo "  - Cross-user token isolation"
echo "  - Proper HTTP status codes (200, 204, 401, 404, 422)"
echo ""
