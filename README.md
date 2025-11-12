# 📘 BDNR Analytics - Monorepo Setup Guide

## 🚀 Pasos de instalación

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/juanpeyrot/bdnr-analytics-monorepo
```

```bash
cd bdnr-analytics-monorepo
```

### 2️⃣ Colocar el archivo .env en la raíz del proyecto

Asegurate de que el archivo .env esté correctamente configurado con todas las variables necesarias para el sistema.

### 3️⃣ Construir y levantar los contenedores

```bash
docker compose up -d --build
```

Luego de levantados los contenedores, es recomendable esperar unos segundos para que todos los servicios estén completamente operativos.

🌐 Acceso

Una vez levantado el entorno, podés acceder al frontend desde:

👉 http://localhost:4200

Desde allí podés interactuar con todo el sistema completo (frontend, API y base de datos).
