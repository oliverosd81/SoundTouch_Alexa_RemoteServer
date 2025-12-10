# SoundTouch Alexa Remote Server

Un servidor bridge que conecta Amazon Alexa con altavoces Bose SoundTouch a través de MongoDB Atlas y Heroku, permitiendo el control por voz después de que Bose descontinuara el soporte cloud para estos dispositivos.

## 🎯 Descripción

Este proyecto es un fork actualizado del trabajo original de [Zach Rose](https://github.com/Zach-Rose-Bose/SoundTouch_Alexa_RemoteServer). El Remote Server actúa como intermediario entre la Lambda de Alexa y el Local Server, almacenando comandos en una cola (`keyStack`) que el Local Server procesa para controlar el altavoz Bose.

### Arquitectura del Sistema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Alexa     │ ──▶ │   Lambda    │ ──▶ │   Remote Server     │ ──▶ │ Local Server │ ──▶ │    Bose     │
│  (Voz)      │     │   (AWS)     │     │ (Heroku + MongoDB)  │     │  (Windows)   │     │ SoundTouch  │
└─────────────┘     └─────────────┘     └─────────────────────┘     └──────────────┘     └─────────────┘
```

## 🔧 Cambios Realizados

### Actualización de Dependencias

El proyecto original utilizaba versiones obsoletas. Se actualizaron las siguientes dependencias:

**package.json actualizado:**
```json
{
  "dependencies": {
    "compression": "^1.0.3",
    "cors": "^2.5.2",
    "helmet": "^3.21.2",
    "loopback": "^3.28.0",
    "loopback-boot": "^3.3.1",
    "loopback-component-explorer": "^6.5.1",
    "loopback-connector-mongodb": "^6.2.0",
    "loopback-datasource-juggler": "^4.28.9",
    "serve-favicon": "^2.0.1",
    "strong-error-handler": "^4.0.0"
  },
  "engines": {
    "node": "20.x"
  }
}
```

**Cambios principales:**
- LoopBack 2.x → LoopBack 3.x
- Node.js 18 → Node.js 20
- Actualización de loopback-connector-mongodb para compatibilidad con MongoDB Atlas

### Corrección de Búsqueda por alexaID

El problema principal era que las funciones `shiftStack` y `pushKey` buscaban usando `findById()` con el `alexaID`, pero LoopBack genera un `id` propio de MongoDB. Se corrigió para usar `findOne()` con filtro por `alexaID`.

**common/models/home.js - Código corregido:**

### Validación de Null

Se añadieron validaciones para evitar errores `TypeError: Cannot read properties of null` cuando el documento no existe en MongoDB.

## 🚀 Despliegue en Heroku

### Prerrequisitos

1. Cuenta en [Heroku](https://heroku.com)
2. Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
3. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) instalado

### Configuración de MongoDB Atlas

1. Crear un cluster gratuito (M0)
2. Crear un usuario de base de datos
3. En **Network Access**, añadir `0.0.0.0/0` para permitir conexiones desde Heroku
4. Obtener el connection string: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`

### Despliegue

```bash
# Clonar el repositorio
git clone https://github.com/oliverosd81/SoundTouch_Alexa_RemoteServer.git
cd SoundTouch_Alexa_RemoteServer

# Crear app en Heroku
heroku create my-bose-bridge --region eu

# Configurar variable de entorno
heroku config:set MONGODB_URI="mongodb+srv://usuario:password@cluster.mongodb.net/bose-bridge?retryWrites=true&w=majority" -a my-bose-bridge

# Desplegar
git push heroku main

# Verificar logs
heroku logs --tail -a my-bose-bridge
```

### Configuración del Datasource

**server/datasources.json:**
```json
{
  "db": {
    "name": "db",
    "connector": "memory"
  },
  "bose_bridge_db": {
    "host": "",
    "port": 0,
    "url": "${MONGODB_URI}",
    "database": "bose-bridge",
    "password": "",
    "name": "bose_bridge_db",
    "user": "",
    "connector": "mongodb"
  }
}
```

## 📡 API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/homes` | GET | Lista todos los homes |
| `/api/homes/findOne?filter={...}` | GET | Busca un home por filtro |
| `/api/homes/{id}` | PUT | Actualiza un home |
| `/api/homes/shiftStack?bridgeID={alexaID}` | GET | Elimina el primer comando del keyStack |
| `/api/homes/pushKey?bridgeID={alexaID}&url={comando}` | GET | Añade un comando al keyStack |

### Estructura del Documento Home

```json
{
  "id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "alexaID": "amzn1.ask.account.XXXX...",
  "keyStack": ["/Bose/key/play", "/Bose/key/pause"],
  "currentState": {
    "speakers": {
      "bose": {
        "name": "Bose",
        "ip": "192.168.1.XXX",
        "port": 8090,
        "mac_address": "XXXXXXXXXXXX",
        "currentVolume": "50",
        "nowPlaying": {...}
      }
    },
    "zonesPlaying": ["bose"]
  }
}
```

## 🐛 Problemas Resueltos

### Error SSL MongoDB
**Síntoma:** `ssl3_read_bytes:tlsv1 alert internal error`

**Solución:** Configurar whitelist de MongoDB Atlas a `0.0.0.0/0` y actualizar `MONGODB_URI` en Heroku.

### Null Pointer Exception
**Síntoma:** `TypeError: Cannot read properties of null (reading 'keyStack')`

**Solución:** Añadir validación `if(!instance)` antes de acceder a propiedades del documento.

### keyStack No Se Vacía (Bucle Infinito)
**Síntoma:** El Local Server ejecuta el mismo comando repetidamente.

**Solución:** Cambiar `findById()` por `findOne({where: {alexaID: bridgeID}})` en `shiftStack` y `pushKey`.

## 🔗 Proyectos Relacionados

- [SoundTouch Alexa Local Server](https://github.com/oliverosd81/SoundTouch_Alexa_LocalServer) - Servidor local que controla el Bose
- [Alexa Skill + Lambda](https://github.com/Zach-Rose-Bose/SoundTouch_Alexa_Skill) - Skill de Alexa

## 🙏 Agradecimientos

Este proyecto es un fork del trabajo original de **[Zach Rose](https://github.com/Zach-Rose-Bose)**:
- [SoundTouch_Alexa_RemoteServer](https://github.com/Zach-Rose-Bose/SoundTouch_Alexa_RemoteServer)

Gracias a Zach por crear la base de este proyecto que permite seguir usando los altavoces Bose SoundTouch con Alexa después de que Bose descontinuara el soporte cloud oficial.

## 📄 Licencia

Este proyecto se distribuye bajo la misma licencia que el proyecto original.

---

**Nota:** Este proyecto fue actualizado en diciembre de 2025 para funcionar con las versiones actuales de Node.js, LoopBack y MongoDB Atlas.
