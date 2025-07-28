# 🚀 Despliegue en Digital Ocean

## Opción 1: App Platform (Recomendado)

### Pasos:
1. **Subir código a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Sistema de rifas inicial"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/rifa-pampero.git
   git push -u origin main
   ```

2. **Crear app en Digital Ocean**:
   - Ve a [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Conecta tu repositorio de GitHub
   - Selecciona "Static Site"
   - Deploy automático ✅

### Costo: ~$5/mes

---

## Opción 2: Droplet + Nginx

### Crear Droplet:
```bash
# En tu Droplet Ubuntu
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Subir archivos:
```bash
# Desde tu computadora
scp -r * root@tu-ip:/var/www/html/
```

### Costo: ~$6/mes (droplet básico)

---

## Opción 3: Spaces (Storage estático)

### Configurar Spaces:
1. Crear Space en Digital Ocean
2. Habilitar CDN
3. Subir archivos via web o CLI
4. Configurar como sitio web estático

### Costo: ~$5/mes

---

## 🔧 Automatización con GitHub Actions

### `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Digital Ocean

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to DO App Platform
      uses: digitalocean/app_action@v1.1.5
      with:
        app_name: rifa-pampero
        token: ${{ secrets.DIGITALOCEAN_TOKEN }}
```