# Montas Stoacat — Vercel Ready

## Pasos
1) En tu Google Sheet, asegúrate que la pestaña se llama **`registros`**.
2) En Apps Script, pega `apps-script/Code.gs` (ya viene con tu SHEET_ID) y **Implementa** como *Aplicación web* (Ejecutar como: Tú, Acceso: Cualquiera con el enlace). Copia la URL que termina en **/exec**.
3) En **Vercel → Project → Settings → Environment Variables** agrega:
   `NEXT_PUBLIC_APPS_SCRIPT_URL = https://script.google.com/macros/s/XXXX/exec`
4) Importa el repo en Vercel y **Deploy**.

## Probar
- Abre la app, crea un registro. Debe verse en Google Sheets (`registros`) y crear el evento en Google Calendar.
