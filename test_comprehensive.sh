#!/bin/bash
# LSV Cafe - Comprehensive Test Suite
API_BASE="http://localhost:9980/api"
echo "=== LSV Cafe Comprehensive Tests ==="
echo "1. Health Check"
curl -s "$API_BASE/" | head -1
echo ""
echo "2. Public Endpoints"
curl -s "$API_BASE/config/departments" | head -c 100
echo "..."
echo ""
echo "3. Authentication Test"
curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' "$API_BASE/auth/login" | head -c 200
echo ""
