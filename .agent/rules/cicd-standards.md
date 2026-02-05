# Reglas de CI/CD (GitHub Actions)

Estas reglas aseguran que el código en la rama principal sea siempre estable y funcional.

## ✅ Requisitos del Pipeline
1.  **Bloqueo de Merge**: No se debe hacer merge a `main` o `master` si el pipeline de CI falla.
2.  **Integridad de Tests**: Cada nueva funcionalidad debe ir acompañada de un test. Si los tests en el pipeline fallan, se considera un error crítico de desarrollo.
3.  **Compilación Obligatoria**: Tanto el frontend como el backend deben generar su respectiva carpeta `dist/` o `build/` sin errores de TypeScript ni de linting.

## 🛡️ Seguridad en CI
-   **Nunca** subir archivos `.env` al repositorio.
-   El pipeline debe usar **Secretos de GitHub** para cualquier variable de entorno sensible.
-   Se prefiere el uso de `npm ci` o caché de dependencias para acelerar el proceso de integración.

## 🚀 Despliegue (CD)
-   El despliegue automático solo se activará cuando la rama `main` pase todos los tests del pipeline de CI.
-   Se recomienda el uso de entornos de "Staging" o "Preview" para Pull Requests antes de integrar a la rama principal.
