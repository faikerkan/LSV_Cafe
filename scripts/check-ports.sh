#!/bin/bash
# Quick Port Check Script
# Bu script portların kullanılabilir olup olmadığını kontrol eder

echo "🔍 Port Kullanılabilirlik Kontrolü"
echo "=================================="
echo ""

check_port() {
    local port=$1
    local name=$2
    
    if command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":${port} "; then
            echo "❌ Port ${port} (${name}) - KULLANILIYOR"
            echo "   Detay: $(sudo netstat -tulpn 2>/dev/null | grep ":${port} " || echo 'Detay alınamadı')"
            return 1
        else
            echo "✅ Port ${port} (${name}) - Kullanılabilir"
            return 0
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln 2>/dev/null | grep -q ":${port} "; then
            echo "❌ Port ${port} (${name}) - KULLANILIYOR"
            echo "   Detay: $(sudo ss -tulpn 2>/dev/null | grep ":${port} " || echo 'Detay alınamadı')"
            return 1
        else
            echo "✅ Port ${port} (${name}) - Kullanılabilir"
            return 0
        fi
    else
        echo "⚠️  netstat veya ss komutu bulunamadı"
        return 2
    fi
}

echo "Önerilen Portlar (Düşük Çakışma İhtimalli):"
echo ""

check_port 8880 "HTTP"
check_port 8443 "HTTPS"
check_port 54320 "PostgreSQL"

echo ""
echo "Alternatif Portlar:"
echo ""

check_port 9980 "HTTP (Alternatif 1)"
check_port 9943 "HTTPS (Alternatif 1)"
check_port 55432 "PostgreSQL (Alternatif 1)"

echo ""
check_port 7780 "HTTP (Alternatif 2)"
check_port 7743 "HTTPS (Alternatif 2)"
check_port 56432 "PostgreSQL (Alternatif 2)"

echo ""
echo "=================================="
echo ""
echo "💡 Kullanım önerisi:"
echo "   Kullanılabilir portları .env.ubuntu dosyanızda belirtin"
echo ""
