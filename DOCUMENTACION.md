# Rifas Rodríguez — Documentación Técnica

> **Repositorio:** https://github.com/JJ-MP/rifas-rodriguez-app  
> **Stack:** HTML5 + Vanilla JS + Canvas API (sin frameworks, sin dependencias)  
> **Deploy:** Vercel (sitio estático)

---

## 1. Descripción general

Aplicación web para gestionar rifas de 100 números (00–99). Permite marcar números como vendidos visualmente, previsualizar el resultado en tiempo real sobre un flyer personalizado, ajustar la posición de la tabla de números, y descargar la imagen final en alta resolución (PNG 1536×2752 px).

---

## 2. Estructura de archivos

```
rifas-rodriguez-app/
├── index.html          # Toda la app (HTML + CSS + JS en un solo archivo)
├── flyer_base.jpeg     # Imagen de fondo por defecto (2.2 MB, 1536×2752 px)
├── vercel.json         # Configuración de deploy estático en Vercel
└── README.md           # Instrucciones básicas
```

---

## 3. Persistencia de datos (sin backend)

La app usa el navegador como base de datos local. No hay servidor ni API.

### 3.1 localStorage

| Clave            | Tipo       | Contenido                                       |
|------------------|------------|-------------------------------------------------|
| `rifas_sold`     | JSON Array | Lista de números vendidos. Ej: `["01","02","15"]` |
| `rifas_pos`      | JSON Object| Configuración de posición de la tabla (ver §5)  |

#### Esquema `rifas_sold`
```json
["01", "02", "03", "15", "22", "47"]
```
- Array de strings de 2 caracteres, siempre con cero a la izquierda (`"01"`, no `"1"`).
- Valores posibles: `"00"` a `"99"`.
- Si la clave no existe, se cargan los **números por defecto** (ver §4).

#### Esquema `rifas_pos`
```json
{
  "overlayY": 26.1,
  "gridY":    26.9,
  "marginX":  3.1,
  "marginB":  4.2
}
```
Todos los valores son porcentajes (%) relativos al tamaño del canvas.

---

### 3.2 IndexedDB

Base de datos: `rifasDB` (versión 1)  
Object store: `files`

| Key           | Tipo     | Contenido                           |
|---------------|----------|-------------------------------------|
| `"flyer"`     | `Blob`   | Imagen del flyer (cualquier formato)|
| `"flyerName"` | `string` | Nombre del archivo subido           |

La imagen se guarda como `Blob` nativo (no base64), lo que permite almacenar archivos grandes (>5MB) sin el límite de localStorage.

---

## 4. Lógica de números

### Números libres por defecto (no vendidos al iniciar)
```
00, 40, 49, 50, 54, 55, 58, 60, 61, 64, 65, 66,
70, 75, 77, 87, 88, 89, 91, 95, 98, 99
```

Todo lo demás (78 números) se marca como vendido por defecto.

### Función `buildDefault()` — equivalencia
```javascript
const FREE_NUMBERS = new Set([
  '00','40','49','50','54','55','58',
  '60','61','64','65','66','70','75','77',
  '87','88','89','91','95','98','99'
]);
// sold = todos los de 00-99 que NO estén en FREE_NUMBERS
```

---

## 5. Configuración de posición de tabla

Todos los valores son porcentajes del alto/ancho del canvas.

| Parámetro    | Default | Rango  | Descripción                                      |
|--------------|---------|--------|--------------------------------------------------|
| `overlayY`   | 26.1%   | 0–80%  | Dónde empieza la sombra oscura sobre el flyer    |
| `gridY`      | 26.9%   | 0–80%  | Dónde empieza la grilla de números               |
| `marginX`    | 3.1%    | 0–20%  | Margen izquierdo y derecho de la tabla           |
| `marginB`    | 4.2%    | 0–20%  | Margen inferior de la tabla                      |

Equivalencia con el render original (Puppeteer):
- `overlayY` → `top: 720px` de `2752px` = 26.16%
- `gridY` → `top: 740px` de `2752px` = 26.89%
- `marginX` → `(1536-1440)/2 = 48px` de `1536px` = 3.125%
- `marginB` → `bottom: 115px` de `2752px` = 4.18%

---

## 6. Render del canvas (`drawRifa`)

Función central que dibuja la imagen final. Usada tanto para el preview como para la descarga.

```javascript
drawRifa(ctx, width, height, soldSet, posConfig)
```

| Parámetro  | Tipo              | Descripción                                 |
|------------|-------------------|---------------------------------------------|
| `ctx`      | CanvasRenderingContext2D | Contexto del canvas               |
| `width`    | number            | Ancho en píxeles del canvas                 |
| `height`   | number            | Alto en píxeles del canvas                  |
| `soldSet`  | Set\<string\>     | Conjunto de números vendidos (ej: `"07"`)   |
| `posConfig`| object            | Objeto con `overlayY`, `gridY`, `marginX`, `marginB` |

### Capas dibujadas (en orden):
1. **Imagen de fondo** — el flyer cargado por el usuario
2. **Overlay oscuro** — `rgba(0,0,0,0.60)` desde `overlayY` hacia abajo
3. **Celdas de la grilla** — 100 celdas (10×10), con fondo semitransparente
4. **Bordes de celdas** — `rgba(255,255,255,0.85)` de 2.5px
5. **Números** — font Montserrat 900, 54px (escalado), blanco con sombra
6. **X roja** — sobre celdas vendidas, 95px, `rgba(255,0,0,0.85)`

### Resolución de salida
- **Preview:** ancho del contenedor × DPR (máximo ×2), proporcional al aspect ratio 1536:2752
- **Descarga:** 1536×2752 px (resolución completa)

---

## 7. API de funciones JS expuestas globalmente

Estas funciones son accesibles desde consola o desde otro script en la misma página:

| Función              | Descripción                                              |
|----------------------|----------------------------------------------------------|
| `toggle(val)`        | Marca/desmarca un número. `val` = string `"00"`–`"99"`  |
| `markAll()`          | Marca todos los 100 números                              |
| `clearAll()`         | Desmarca todos                                           |
| `resetToDefault()`   | Vuelve al estado por defecto (FREE_NUMBERS libres)       |
| `downloadImage()`    | Genera y descarga el PNG a resolución completa           |
| `onSlider()`         | Actualiza la posición de la tabla desde los sliders      |
| `resetPosition()`    | Vuelve los sliders a los valores por defecto             |
| `showToast(msg)`     | Muestra una notificación temporal en pantalla            |

### Variables de estado globales

| Variable  | Tipo          | Descripción                          |
|-----------|---------------|--------------------------------------|
| `sold`    | `Set<string>` | Números actualmente marcados         |
| `bgImage` | `HTMLImageElement / null` | Imagen de fondo cargada |
| `pos`     | `object`      | Configuración actual de posición     |

---

## 8. Integración con base de datos externa

Para conectar esta app con un backend/DB, los puntos de integración son:

### 8.1 Leer estado actual
```javascript
// Obtener array de números vendidos
const vendidos = [...sold]; // ["01","02","15",...]

// Obtener posición de tabla
const posicion = { ...pos }; // { overlayY, gridY, marginX, marginB }
```

### 8.2 Cargar estado desde DB
```javascript
// Cargar números vendidos desde tu DB y aplicarlos
const numerosDeDB = ["01","02","50"]; // array de strings
sold = new Set(numerosDeDB);
applyState();      // actualiza la UI
schedulePreview(); // actualiza el preview
```

### 8.3 Cargar imagen de fondo desde URL externa
```javascript
async function loadFlyerFromURL(url, nombre) {
  const resp = await fetch(url);
  const blob = await resp.blob();
  await saveFlyerToDB(blob, nombre); // guarda en IndexedDB local
  setFlyerFromBlob(blob, nombre);    // muestra en la app
}
```

### 8.4 Generar imagen y subirla a un servidor
```javascript
async function generarYSubir(endpoint) {
  const canvas = document.getElementById('hiddenCanvas');
  canvas.width = 1536; canvas.height = 2752;
  const ctx = canvas.getContext('2d');
  await document.fonts.ready;
  drawRifa(ctx, 1536, 2752, sold, pos);

  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  const formData = new FormData();
  formData.append('imagen', blob, 'rifas.png');
  formData.append('vendidos', JSON.stringify([...sold]));

  await fetch(endpoint, { method: 'POST', body: formData });
}
```

### 8.5 Sincronización en tiempo real (WebSocket / SSE)
```javascript
const ws = new WebSocket('wss://tu-servidor/rifas');
ws.onmessage = (e) => {
  const { vendidos } = JSON.parse(e.data);
  sold = new Set(vendidos);
  applyState();
  saveSold();        // guarda localmente también
  schedulePreview();
};
```

---

## 9. Notas de compatibilidad

- **IndexedDB:** compatible con todos los navegadores modernos. En modo incógnito el almacenamiento se borra al cerrar la pestaña.
- **Canvas `toBlob`:** en Safari puede requerir polyfill para PNG. Se puede usar `toDataURL` como fallback.
- **Fuentes Montserrat:** cargadas desde Google Fonts. La función `drawRifa` espera `document.fonts.ready` antes de dibujar texto para garantizar que la fuente esté disponible.
- **Aspect ratio del flyer:** el sistema asume `1536×2752 px`. Si el flyer tiene otro ratio, la imagen se estira para llenar el canvas. Se recomienda usar imágenes con ese ratio o ajustar los sliders de posición.

---

## 10. Deploy

### Vercel
```json
{
  "version": 2,
  "builds": [{ "src": "index.html", "use": "@vercel/static" }],
  "routes": [{ "src": "/(.*)", "dest": "/$1" }]
}
```
Cada push a `master` activa un deploy automático.

### Local
Abrir `index.html` directo en el navegador o con Live Server. El `flyer_base.jpeg` debe estar en el mismo directorio.

---

## 11. Flujo de usuario

```
Abrir app
  │
  ├─ ¿Hay flyer en IndexedDB? ──Sí──► Carga automática
  │       │
  │      No──► ¿Existe flyer_base.jpeg en servidor? ──Sí──► Auto-carga y guarda en IndexedDB
  │                     │
  │                    No──► Muestra zona de carga manual
  │
  ├─ ¿Hay números en localStorage? ──Sí──► Carga guardados
  │       │
  │      No──► Carga números por defecto
  │
  └─ Usuario interactúa
        ├─ Toca celda ──► toggle(val) ──► guarda localStorage ──► actualiza preview
        ├─ Mueve slider ──► onSlider() ──► guarda localStorage ──► actualiza preview
        └─ Descarga ──► drawRifa() a 1536×2752 ──► PNG descargado
```
