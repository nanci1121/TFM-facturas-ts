---
marp: true
theme: gaia
class: lead
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
style: |
  section {
    font-size: 26px;
    justify-content: start;
    text-align: left;
    padding: 50px;
  }
  h1 {
    font-size: 1.8em;
    color: #2563eb;
    margin-bottom: 20px;
  }
  h2 {
    font-size: 1.2em;
    color: #4b5563;
  }
  img[alt~="center"] {
    display: block;
    margin: 0 auto;
  }
---

<!-- _class: lead -->
# **FacturaIA**

## Sistema Inteligente de Gestión Financiera

![w:150 center](https://img.icons8.com/color/480/artificial-intelligence.png)

**Trabajo Final de Máster**
*Gestión contable potenciada por Inteligencia Artificial Generativa*

---

# 🚨 El Problema: Contabilidad Manual

<div class="columns">
<div>

1. **Gestión manual tediosa**
   Picar datos de facturas consume horas valiosas.

2. **Errores humanos**
   Equivocaciones al transcribir importes, fechas o conceptos.

3. **Datos desconectados**
   "Sé cuánto tengo en el banco, pero no cuánto gané realmente por proyecto".

</div>
<div>

![bg right:40% w:400](https://img.freepik.com/free-vector/stress-work-concept-illustration_114360-2561.jpg?t=st=1710000000~exp=1710000000~hmac=example)

</div>
</div>

---

# 💡 La Solución FacturaIA

Una plataforma integral que **automatiza** la contabilidad mediante IA Generativa.

![bg right:35%](https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)

- 🧾 **Extracción Automática**: De PDF a JSON estructurado en segundos.
- 🧠 **Clasificación Inteligente**: La IA decide si es "Infraestructura", "Personal" o "Marketing".
- 💬 **Asistente (RAG)**: Chat conversacional con tus datos financieros.
- 📊 **Dashboard Real-time**: KPIs y evolución financiera al instante.

---

# 🏗️ Arquitectura Técnica

Diseño modular basado en microservicios y contenedores.

```mermaid
graph LR
    A[Usuario] -->|HTTPS| B(Nginx Load Balancer)
    B -->|/api| C[Backend Node.js]
    B -->|/| D[Frontend React]
    C -->|Auth| E[(PostgreSQL)]
    C -->|Uploads| F[Almacenamiento Local]
    C -->|Consulta| G{Orquestador IA}
    G -->|Prioridad 1| H[Groq Llama3]
    G -->|Prioridad 2| I[Minimax]
    G -->|Fallback| J[Ollama Local]
```

---

# 🤖 Motor de Inteligencia Artificial (Híbrido)

Estrategia de **Fallback en Cascada** para optimizar coste y latencia:

| Proveedor | Modelo | Uso Principal | Ventaja |
| :--- | :--- | :--- | :--- |
| **1. Groq** | Llama 3-70b | Extracción rápida | Velocidad extrema (<1s) |
| **2. Minimax** | M2-her | Análisis complejo | Ventana de contexto enorme |
| **3. Ollama** | Llama 3.2 | Datos sensibles | Privacidad total y coste cero |

> *El sistema elige automáticamente el mejor proveedor disponible en tiempo real.*

---

# 🔍 RAG: Chat con tus Datos

No es solo un chat GPT genérico. Inyectamos **contexto financiero real**.

![w:900 center](https://mermaid.ink/img/pako:eNpVkFtqwzAQRfcyqwSS_FAKbaFQAqWQPnQx1saiPbIkjKFkeXcdeyH96865d2askDOnQoWvj4eW0QevT0oH9jQY7bU6eC0D-sB9wBqN1j7-fFqj9xP2C2uM8Qf2wBuj9R77F62v5h_24L3R-mzw5b1K40yFk8aZkz_sM_uT_cn-Yv-wv9k_7N_2n_0f_i_7L_sv_9tfS6dCqS3nQrkqQ6W8rEIlX5ShlC_K8C_5ogzlfFGGcr4o42e-KOM_80UZyvmijP_MF2X8Z74o4z_zRRn_mS_K-M98UcbP_Ff9BwaVdOQ?type=png)

1. **Usuario**: *"¿Cuánto gasté en marketing este mes?"*
2. **Retrieval**: Buscamos facturas de categoría 'Marketing' y fecha 'Mes Actual'.
3. **Generation**: La IA recibe los datos: *"{ total: 1200€, items: [...] }"*.
4. **Respuesta**: *"Has gastado 1.200€, principalmente en campañas de Google Ads."*

---

# 🚀 Demo: Capturas de Pantalla

<!--
  AQUÍ PUEDES PEGAR UNA CAPTURA DE TU DASHBOARD REAL
  Ejemplo: ![w:800 center](./capturas/dashboard.png)
-->

<div class="columns">
<div>

### Dashboard
Visión global del estado financiero.

![w:450 drop-shadow](docs/assets/dashboard.png)

</div>
<div>

### Chat con IA
Consultas en lenguaje natural.

![w:450 drop-shadow](docs/assets/ai-chat.png)

</div>
</div>

---

# 📈 Diferenciación vs Tradicional

| Funcionalidad | Software Tradicional | **FacturaIA** |
| :--- | :--- | :--- |
| **Entrada de datos** | Manual (tecleo propenso a error) | **Automática (IA Vision)** |
| **Consultas** | Reportes estáticos y filtros | **Chat Conversacional** |
| **Flexibilidad** | Proveedor único | **Agnóstico (Multi-LLM)** |
| **Implementación** | On-premise complejo | **Docker Ready** |

---

# 🎯 Conclusiones y Próximos Pasos

- ✅ **Democratización de la IA**: Herramientas enterprise para pymes.
- ✅ **Eficiencia**: Reducción del 90% en tiempo administrativo.
- 🔮 **Futuro**:
    - App móvil con escáner de cámara.
    - Predicción de flujo de caja (Forecasting).
    - Integración bancaria directa (PSD2).

---

<!-- _class: invert lead -->

# ¡Gracias!

**FacturaIA**
*El futuro de la contabilidad es conversacional.*

[GitHub](https://github.com/nanci1121/TFM-facturas-ts) | [Demo](https://facturas.moralesluna.com)
