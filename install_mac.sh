#!/bin/bash
# ==============================================================================
# LOCASYST PRO - Script d'installation & Démarrage pour macOS (Apple Silicon ARM / Intel)
# ==============================================================================

set -e

echo "=========================================================="
echo "      🚀 INSTALLATEUR LOCASYST PRO - macOS (ARM & Intel)   "
echo "=========================================================="
echo ""

# 1. Détection de l'architecture Mac
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    echo "🍏 Architecture détectée : Apple Silicon (ARM64 - M1/M2/M3/M4)"
elif [ "$ARCH" = "x86_64" ]; then
    echo "🍏 Architecture détectée : Mac Intel (x86_64)"
else
    echo "🍏 Architecture détectée : $ARCH"
fi
echo ""

# 2. Vérification de Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas détecté sur votre Mac."
    echo "👉 Veuillez installer Node.js (version 18 ou supérieure recommandée) :"
    echo "   - Soit via le site officiel : https://nodejs.org/"
    if [ "$ARCH" = "arm64" ]; then
        echo "   - Soit via Homebrew : brew install node"
    else
        echo "   - Soit via Homebrew : brew install node"
    fi
    echo ""
    read -p "Appuyez sur Entrée pour quitter..."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js est installé : $NODE_VERSION"
echo ""

# 3. Vérification de npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas détecté. Veuillez réinstaller Node.js."
    exit 1
fi

# 4. Installation des dépendances
echo "📦 Installation / mise à jour des dépendances du projet..."
npm install
echo "✅ Dépendances installées avec succès."
echo ""

# 5. Création du lanceur direct sur le Bureau (Optionnel)
DESKTOP_PATH="$HOME/Desktop"
LAUNCHER_NAME="Lancer Locasyst Pro.command"

if [ -d "$DESKTOP_PATH" ]; then
    CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cat << EOF > "$DESKTOP_PATH/$LAUNCHER_NAME"
#!/bin/bash
cd "$CURRENT_DIR"
echo "🚀 Démarrage de Locasyst Pro..."
open "http://localhost:3000"
npm run dev
EOF
    chmod +x "$DESKTOP_PATH/$LAUNCHER_NAME"
    echo "🖥️  Raccourci créé sur votre Bureau : '$LAUNCHER_NAME'"
    echo ""
fi

# 6. Démarrage de l'application
echo "=========================================================="
echo "  ✅ Locasyst Pro est prêt !"
echo "  🌐 Ouverture dans votre navigateur : http://localhost:3000"
echo "=========================================================="
echo ""

# Ouvrir le navigateur par défaut
sleep 2 && open "http://localhost:3000" &

# Lancer le serveur de développement
npm run dev
