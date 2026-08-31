# Guide d'Installation & Démarrage - Locasyst Pro

Ce projet comprend des scripts d'installation automatisés pour exécuter **Locasyst Pro** en local sur **macOS** (Apple Silicon ARM M1/M2/M3/M4 & Intel) ainsi que sur **Windows 10 et 11**.

---

## 🍏 1. Installation sur macOS (Apple Silicon ARM / Intel)

### Prérequis :
- **Node.js (version 18 ou supérieure)** : téléchargeable gratuitement sur [nodejs.org](https://nodejs.org) ou via Homebrew (`brew install node`).

### Instructions :
1. Ouvrez le **Terminal** de votre Mac.
2. Déplacez-vous dans le dossier du projet ou faites un clic droit sur le dossier > *« Nouveau terminal au dossier »*.
3. Donnez les droits d'exécution au script si nécessaire :
   ```bash
   chmod +x install_mac.sh
   ```
4. Exécutez le script :
   ```bash
   ./install_mac.sh
   ```
5. Le script vérifie l'architecture (ARM64 ou Intel x86_64), installe les dépendances, crée un raccourci sur votre Bureau et ouvre automatiquement l'application sur `http://localhost:3000`.

---

## 🪟 2. Installation sur Windows 10 et Windows 11

### Prérequis :
- **Node.js (version 18 ou supérieure)** : téléchargeable gratuitement sur [nodejs.org](https://nodejs.org) (choisissez l'installateur Windows `.msi`).

### Instructions :
1. Double-cliquez simplement sur le fichier **`install_windows.bat`**.
2. Le script installe les dépendances requises, configure un raccourci sur votre Bureau Windows et démarre le serveur local.
3. Votre navigateur s'ouvre automatiquement sur `http://localhost:3000`.

---

## 🛠️ Commandes manuelles (si vous préférez la ligne de commande)

Dans le dossier du projet :
```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur local
npm run dev

# 3. Compiler pour la production
npm run build

# 4. Lancer en production
npm start
```
