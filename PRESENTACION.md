---
marp: true
theme: gaia
class: lead
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
---

# **FacturaIA**
## Sistema Inteligente de Gestión Financiera

**Trabajo Final de Máster**
*Gestión contable potenciada por Inteligencia Artificial*

---

# 🚨 El Problema

1. **Gestión manual tediosa**: Picar datos de facturas consume horas.
2. **Errores humanos**: Equivocaciones al transcribir importes o fechas.
3. **Desconexión**: Los datos están aislados en PDFs y excels, difícil de consultar.
4. **Falta de insights**: "Sé cuánto tengo en el banco, pero no cuánto gané realmente este mes por categoría".

---

# 💡 La Solución: FacturaIA

Una plataforma integral que **automatiza** la contabilidad mediante IA Generativa.

- 🧾 **Extracción Automática**: De PDF a Datos Estructurados en segundos.
- 🧠 **Clasificación Inteligente**: La IA decide si es "Software", "Viajes" o "Oficina".
- 💬 **Asistente Conversacional (RAG)**: Pregunta a tus datos como si hablaras con un experto.
- 📊 **Dashboard en Tiempo Real**: Visualización clara de la salud financiera.

---

# 🏗️ Arquitectura Técnica

### Frontend
- **React 18 + Vite**: Velocidad y experiencia de usuario fluida (SPA).
- **Tailwind CSS**: Diseño moderno y responsivo.
- **Recharts**: Visualización de datos interactiva.

### Backend
- **Node.js + Express**: API REST robusta y tipada (TypeScript).
- **IA Híbrida**: Sistema multi-proveedor con fallback inteligente.

---

# 🤖 Motor de Inteligencia Artificial

Implementamos una estrategia de **Fallback en Cascada** para garantizar disponibilidad y optimizar costes:

1. **Groq (Llama 3)**: Prioridad 1. Velocidad extrema (casi tiempo real).
2. **Minimax**: Prioridad 2. Alta capacidad de contexto y razonamiento.
3. **Ollama**: Fallback. Ejecución local, privacidad total y coste cero.
4. **OpenRouter**: Respaldo final.

> *El sistema elige automáticamente el mejor proveedor disponible.*

---

# 🔍 RAG: Retrieval-Augmented Generation

No es solo un chat "genérico". FacturaIA inyecta el **contexto financiero real** de la empresa en cada consulta.

1. **Usuario**: "¿Cuánto gasté en marketing?"
2. **Sistema**: Busca facturas de categoría 'Marketing' en la BD.
3. **Prompt**: "Actúa como contable. Aquí están los datos reales: [...]. Responde al usuario."
4. **IA**: "Has gastado 1.200€ en marketing, principalmente en Google Ads."

---

# 🚀 Demo: Flujo de Trabajo

1. **Subida**: Arrastrar factura PDF al sistema.
2. **Procesamiento**:
   - Extracción de texto (OCR/Parsing).
   - Análisis por LLM (JSON estructurado).
3. **Validación**: Usuario revisa y confirma.
4. **Insights**: El dato alimenta inmediatamente los KPI y el Chat.

---

# 📈 Diferenciación

| Software Tradicional | **FacturaIA** |
| :--- | :--- |
| Entrada manual de datos | **Extracción IA** |
| Reportes estáticos | **Chat Conversacional** |
| Configuración rígida | **Agnóstico del proveedor IA** |
| Curva de aprendizaje alta | **Interfaz Intuitiva** |

---

# 🎯 Conclusiones y Futuro

- **Logro**: Hemos democratizado el acceso a herramientas contables de nivel empresarial.
- **Impacto**: Reducción del 90% en tiempo de gestión administrativa.
- **Siguientes pasos**:
   - App móvil con escáner de cámara.
   - Predicción de flujo de caja (Forecasting).
   - Integración bancaria directa (PSD2).

---

# ¡Gracias!

**FacturaIA**
*El futuro de la contabilidad es conversacional.*
