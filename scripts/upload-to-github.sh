#!/bin/bash
# GitHub'a Yükleme Scripti
# Bu script projeyi GitHub'a yükler

echo "📤 GitHub'a Yükleme Başlatılıyor..."
echo ""

# Kullanıcıdan GitHub repository bilgilerini al
read -p "GitHub kullanıcı adınız: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ Kullanıcı adı boş olamaz!"
    exit 1
fi

# Repository adı (varsayılan)
REPO_NAME="lsv-cafe-rezervasyon"

echo ""
echo "📋 Ayarlar:"
echo "   Kullanıcı: $GITHUB_USER"
echo "   Repository: $REPO_NAME"
echo "   URL: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "⚠️  Önce GitHub'da repository oluşturduğunuzdan emin olun!"
echo "   https://github.com/new"
echo ""

read -p "Devam etmek istiyor musunuz? (evet/hayır): " confirm

if [ "$confirm" != "evet" ]; then
    echo "❌ İptal edildi"
    exit 0
fi

# Git yapılandırmasını kontrol et
if ! git config user.name > /dev/null 2>&1; then
    echo ""
    echo "Git yapılandırması bulunamadı. Lütfen bilgilerinizi girin:"
    read -p "Adınız Soyadınız: " GIT_NAME
    read -p "Email adresiniz: " GIT_EMAIL
    
    git config --global user.name "$GIT_NAME"
    git config --global user.email "$GIT_EMAIL"
    echo "✅ Git yapılandırması tamamlandı"
fi

echo ""
echo "🔧 Git repository başlatılıyor..."

# Git repository varsa kontrol et
if [ -d .git ]; then
    echo "✅ Git repository zaten mevcut"
else
    git init
    echo "✅ Git repository başlatıldı"
fi

echo ""
echo "📦 Dosyalar ekleniyor..."
git add .

echo ""
echo "💾 Commit oluşturuluyor..."
git commit -m "Initial commit: Production-ready LSV Cafe Event Management System

Features:
- PostgreSQL backend with Prisma ORM
- JWT authentication
- Event conflict detection
- Docker deployment ready
- Comprehensive testing (15+ tests)
- Ubuntu deployment with custom ports
- Automated backup scripts
- Complete documentation in Turkish and English" || {
    echo "⚠️  Commit zaten var veya değişiklik yok"
}

echo ""
echo "🔗 GitHub repository ekleniyor..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

echo ""
echo "🌿 Ana branch ayarlanıyor..."
git branch -M main

echo ""
echo "🚀 GitHub'a yükleniyor..."
echo "   (Kullanıcı adı ve şifre/token sorabilir)"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Başarıyla GitHub'a yüklendi!"
    echo ""
    echo "🌐 Repository URL:"
    echo "   https://github.com/$GITHUB_USER/$REPO_NAME"
    echo ""
    echo "📥 Ubuntu'da klonlamak için:"
    echo "   git clone https://github.com/$GITHUB_USER/$REPO_NAME.git"
    echo ""
    echo "📚 Deployment için bakınız:"
    echo "   GITHUB-DEPLOYMENT-TR.md"
else
    echo ""
    echo "❌ Yükleme başarısız!"
    echo ""
    echo "🔑 Token gerekiyorsa:"
    echo "   1. GitHub → Settings → Developer settings"
    echo "   2. Personal access tokens → Tokens (classic)"
    echo "   3. Generate new token → repo scope seçin"
    echo "   4. Token'ı kopyalayın ve şifre yerine kullanın"
    echo ""
    echo "Tekrar denemek için:"
    echo "   ./scripts/upload-to-github.sh"
fi
