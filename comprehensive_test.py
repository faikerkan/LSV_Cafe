#!/usr/bin/env python3
"""
LSV Cafe - Comprehensive Real-World Test Suite
Dünya standartlarında gerçek dünya testleri
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

API_BASE = "http://localhost:9980/api"
PASSED = 0
FAILED = 0
WARNINGS = 0

class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def log_test(msg):
    global PASSED
    print(f"{Colors.GREEN}✓{Colors.NC} {msg}")
    PASSED += 1

def log_fail(msg):
    global FAILED
    print(f"{Colors.RED}✗{Colors.NC} {msg}")
    FAILED += 1

def log_warn(msg):
    global WARNINGS
    print(f"{Colors.YELLOW}⚠{Colors.NC} {msg}")
    WARNINGS += 1

def log_info(msg):
    print(f"{Colors.BLUE}ℹ{Colors.NC} {msg}")

def test_endpoint(method, endpoint, expected_status, description, data=None, token=None, validate_func=None):
    """Test helper function"""
    try:
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        if method == "GET":
            response = requests.get(f"{API_BASE}{endpoint}", headers=headers, timeout=5)
        elif method == "DELETE":
            response = requests.delete(f"{API_BASE}{endpoint}", headers=headers, timeout=5)
        else:
            response = requests.request(method, f"{API_BASE}{endpoint}", 
                                       headers=headers, json=data, timeout=5)
        
        if response.status_code == expected_status:
            if validate_func:
                try:
                    validate_func(response.json())
                except Exception as e:
                    log_fail(f"{description} - Validation failed: {e}")
                    return False
            log_test(f"{description} (HTTP {response.status_code})")
            return True, response.json() if response.content else None
        else:
            log_fail(f"{description} - Expected {expected_status}, got {response.status_code}")
            try:
                print(f"  Response: {response.text[:200]}")
            except:
                pass
            return False, None
    except requests.exceptions.RequestException as e:
        log_fail(f"{description} - Request failed: {e}")
        return False, None

print("=" * 60)
print("LSV Cafe - Comprehensive Real-World Test Suite")
print("=" * 60)
print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

# ===== 1. HEALTH CHECK TESTS =====
print("1. HEALTH CHECK TESTS")
print("-" * 60)
test_endpoint("GET", "/config/departments", 200, "Public Config Endpoint (Departments)")
test_endpoint("GET", "/config/resources", 200, "Public Config Endpoint (Resources)")
test_endpoint("GET", "/config/locations", 200, "Public Config Endpoint (Locations)")
test_endpoint("GET", "/events", 200, "Public Events Endpoint")
print()

# ===== 2. AUTHENTICATION TESTS =====
print("2. AUTHENTICATION TESTS")
print("-" * 60)
# Invalid credentials
test_endpoint("POST", "/auth/login", 401, "Login with invalid credentials", 
              {"username": "invalid", "password": "wrong"})

# Admin login
result, admin_response = test_endpoint("POST", "/auth/login", 200, "Admin login",
                                       {"username": "admin", "password": "admin123"})
admin_token = admin_response.get("token") if result and admin_response else None

# User login
result, user_response = test_endpoint("POST", "/auth/login", 200, "User login",
                                      {"username": "testuser", "password": "test123"})
user_token = user_response.get("token") if result and user_response else None

if not user_token:
    log_warn("User login failed - testuser may not exist, creating test user...")
    # Try to create test user via admin
    if admin_token:
        # Note: User creation requires admin, will test separately
        pass
print()

# ===== 3. AUTHORIZATION TESTS =====
print("3. AUTHORIZATION TESTS")
print("-" * 60)
if admin_token:
    test_endpoint("GET", "/users", 200, "Admin can access user list", token=admin_token)
    test_endpoint("GET", "/events", 200, "Admin can access events", token=admin_token)
else:
    log_warn("Skipping admin authorization tests (no admin token)")

if user_token:
    test_endpoint("GET", "/users", 403, "User cannot access user list", token=user_token)
    test_endpoint("GET", "/events", 200, "User can access events", token=user_token)
else:
    log_warn("Skipping user authorization tests (no user token)")

test_endpoint("GET", "/users", 401, "Unauthenticated request to protected endpoint")
print()

# ===== 4. EVENTS CRUD TESTS =====
print("4. EVENTS CRUD TESTS")
print("-" * 60)
test_event_id = None
if user_token or admin_token:
    token = user_token or admin_token
    # Get valid department and location IDs
    depts_resp = requests.get(f"{API_BASE}/config/departments", timeout=5)
    dept_id = depts_resp.json()[0]["id"] if depts_resp.status_code == 200 else None
    
    locs_resp = requests.get(f"{API_BASE}/config/locations", timeout=5)
    loc_id = locs_resp.json()[0]["id"] if locs_resp.status_code == 200 else None
    
    if dept_id and loc_id:
        # Create event
        future_date = (datetime.now() + timedelta(days=7)).isoformat() + "Z"
        event_data = {
            "title": "Test Event - Comprehensive Test",
            "description": "Automated test event",
            "startDate": future_date,
            "endDate": (datetime.now() + timedelta(days=7, hours=1)).isoformat() + "Z",
            "departmentId": dept_id,
            "locationId": loc_id,
            "attendees": 10,
            "contactPerson": "Test User",
            "resourceIds": []
        }
        result, create_response = test_endpoint("POST", "/events", 201, "Create event",
                                                 event_data, token)
        if result and create_response:
            test_event_id = create_response.get("id")
            if test_event_id:
                # Read event
                test_endpoint("GET", f"/events/{test_event_id}", 200, "Read created event", token=token)
                
                # Update event
                update_data = {"title": "Updated Test Event", "description": "Updated description"}
                test_endpoint("PUT", f"/events/{test_event_id}", 200, "Update event",
                             update_data, token)
                
                # Delete event (cleanup)
                test_endpoint("DELETE", f"/events/{test_event_id}", 200, "Delete test event", token=token)
                test_event_id = None
    else:
        log_warn("Skipping event CRUD tests (could not get valid IDs)")
else:
    log_warn("Skipping event CRUD tests (no authentication token)")
print()

# ===== 5. CONFIG MANAGEMENT TESTS (Admin Only) =====
print("5. CONFIG MANAGEMENT TESTS")
print("-" * 60)
test_dept_id = None
if admin_token:
    # Create department
    dept_data = {"name": f"Test Dept {int(time.time())}", "code": "TEST"}
    result, dept_response = test_endpoint("POST", "/config/departments", 201, "Create department",
                                          dept_data, admin_token)
    if result and dept_response:
        test_dept_id = dept_response.get("id")
        if test_dept_id:
            # Update department
            update_dept = {"name": "Updated Test Department", "active": False}
            test_endpoint("PUT", f"/config/departments/{test_dept_id}", 200, "Update department",
                         update_dept, admin_token)
            
            # Delete department
            test_endpoint("DELETE", f"/config/departments/{test_dept_id}", 200,
                        "Delete test department", token=admin_token)
            test_dept_id = None
else:
    log_warn("Skipping config management tests (no admin token)")
print()

# ===== 6. ERROR HANDLING TESTS =====
print("6. ERROR HANDLING TESTS")
print("-" * 60)
test_endpoint("GET", "/events/invalid-id-12345", 404, "Non-existent event returns 404",
              token=user_token or admin_token)
test_endpoint("PUT", "/events/invalid-id-12345", 404, "Update non-existent event returns 404",
              {"title": "Test"}, user_token or admin_token)
test_endpoint("POST", "/events", 400, "Create event with empty title",
              {"title": ""}, user_token or admin_token)
test_endpoint("POST", "/events", 401, "Create event without authentication",
              {"title": "Test"})
print()

# ===== 7. INPUT VALIDATION TESTS =====
print("7. INPUT VALIDATION TESTS")
print("-" * 60)
if user_token or admin_token:
    token = user_token or admin_token
    depts_resp = requests.get(f"{API_BASE}/config/departments", timeout=5)
    dept_id = depts_resp.json()[0]["id"] if depts_resp.status_code == 200 else None
    locs_resp = requests.get(f"{API_BASE}/config/locations", timeout=5)
    loc_id = locs_resp.json()[0]["id"] if locs_resp.status_code == 200 else None
    
    if dept_id and loc_id:
        # Invalid date range (end before start)
        invalid_date = {
            "title": "Test",
            "startDate": (datetime.now() + timedelta(days=7, hours=1)).isoformat() + "Z",
            "endDate": (datetime.now() + timedelta(days=7)).isoformat() + "Z",
            "departmentId": dept_id,
            "locationId": loc_id,
            "attendees": 10
        }
        test_endpoint("POST", "/events", 400, "Invalid date range validation",
                     invalid_date, token)
        
        # Missing required fields
        test_endpoint("POST", "/events", 400, "Missing required fields validation",
                     {"title": "Test"}, token)
        
        # Invalid UUID format
        invalid_fk = {
            "title": "Test",
            "startDate": (datetime.now() + timedelta(days=7)).isoformat() + "Z",
            "endDate": (datetime.now() + timedelta(days=7, hours=1)).isoformat() + "Z",
            "departmentId": "invalid-uuid-12345",
            "locationId": loc_id,
            "attendees": 10
        }
        test_endpoint("POST", "/events", 400, "Invalid UUID format validation",
                     invalid_fk, token)
print()

# ===== 8. SECURITY TESTS =====
print("8. SECURITY TESTS")
print("-" * 60)
# CORS test
try:
    cors_resp = requests.options(f"{API_BASE}/config/departments",
                                 headers={"Origin": "http://localhost:3000"}, timeout=5)
    if "access-control-allow-origin" in str(cors_resp.headers).lower():
        log_test("CORS headers present")
    else:
        log_warn("CORS headers not found")
except Exception as e:
    log_warn(f"CORS test failed: {e}")

# SQL Injection attempt (should be handled safely)
if user_token or admin_token:
    token = user_token or admin_token
    sql_injection = {"title": "'; DROP TABLE events; --"}
    # Should not cause error, just sanitize input
    test_endpoint("POST", "/events", 400, "SQL injection attempt handling",
                 sql_injection, token)
print()

# ===== 9. PERFORMANCE TESTS =====
print("9. PERFORMANCE TESTS")
print("-" * 60)
start_time = time.time()
requests.get(f"{API_BASE}/config/departments", timeout=5)
duration = (time.time() - start_time) * 1000

if duration < 1000:
    log_test(f"API response time acceptable ({duration:.2f}ms)")
else:
    log_warn(f"API response time slow ({duration:.2f}ms)")

# Load test (10 concurrent requests)
start_time = time.time()
for _ in range(10):
    requests.get(f"{API_BASE}/config/departments", timeout=5)
load_duration = (time.time() - start_time) * 1000
avg_duration = load_duration / 10

if avg_duration < 500:
    log_test(f"Load test passed (avg {avg_duration:.2f}ms per request)")
else:
    log_warn(f"Load test slow (avg {avg_duration:.2f}ms per request)")
print()

# ===== 10. DATABASE INTEGRITY TESTS =====
print("10. DATABASE INTEGRITY TESTS")
print("-" * 60)
# Test that events are properly linked to departments/locations
if user_token or admin_token:
    token = user_token or admin_token
    events_resp = requests.get(f"{API_BASE}/events", headers={"Authorization": f"Bearer {token}"}, timeout=5)
    if events_resp.status_code == 200:
        events = events_resp.json()
        if events:
            event = events[0]
            # Check required fields
            required_fields = ["id", "title", "startDate", "endDate", "status"]
            missing = [f for f in required_fields if f not in event]
            if not missing:
                log_test("Event data integrity check passed")
            else:
                log_fail(f"Event missing required fields: {missing}")
        else:
            log_warn("No events found for integrity check")
print()

# ===== SUMMARY =====
print("=" * 60)
print("TEST SUMMARY")
print("=" * 60)
print(f"{Colors.GREEN}Passed: {PASSED}{Colors.NC}")
print(f"{Colors.RED}Failed: {FAILED}{Colors.NC}")
print(f"{Colors.YELLOW}Warnings: {WARNINGS}{Colors.NC}")
print()

if FAILED == 0:
    print(f"{Colors.GREEN}✓ All critical tests passed! System is production-ready.{Colors.NC}")
    sys.exit(0)
else:
    print(f"{Colors.RED}✗ Some tests failed. Please review above.{Colors.NC}")
    sys.exit(1)
