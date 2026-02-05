---
description: Cómo configurar GitHub para que el CI/CD funcione correctamente
---

Para que la automatización de GitHub funcione, debes configurar los "Secrets" en tu repositorio:

1. Ve a tu repositorio en GitHub.
2. Navega a **Settings > Secrets and variables > Actions**.
3. Añade los siguientes **Repository secrets**:

| Secret Name | Descripción | Requerido para |
|-------------|-------------|----------------|
| `JWT_SECRET` | Clave secreta para tokens JWT | Tests de integración |
| `GEMINI_API_KEY` | (Opcional) Tu API Key de Google Gemini | Tests de IA |

// turbo
4. Verifica el estado del pipeline en la pestaña **Actions** después de tu próximo `git push`.
