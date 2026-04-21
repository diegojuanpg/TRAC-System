# TRAC System — Arquitectura y Lógica de Cálculo

Este documento detalla el funcionamiento interno del sistema TRAC, explicando cómo se extraen los datos, cómo se procesan y bajo qué reglas se calculan las métricas de monitoreo del rendimiento.

## 1. Arquitectura del Sistema
El sistema TRAC utiliza un modelo **Descentralizado**:
-   **Frontend (React + Vite):** Es el "cerebro". Aquí reside toda la lógica de cálculo pesada. Esto permite que el sistema sea extremadamente rápido y que los cálculos se realicen en el dispositivo del atleta.
-   **Backend (Google Apps Script):** Actúa únicamente como un puente (API) para leer y escribir datos en Google Sheets. No realiza cálculos, solo persiste la información.
-   **Almacenamiento (Google Sheets):** Funciona como base de datos histórica.

---

## 2. Flujo de Datos (Extracción)
1.  **Captura:** El atleta completa el `Morning Survey` o `Nutrition Form`.
2.  **Preparación:** Antes de enviar, el sistema descarga las últimas 50 filas de historial desde la hoja de cálculo.
3.  **Procesamiento Local:** El motor `tracEngine.ts` combina los nuevos datos con el historial para recalcular todas las métricas de tendencia.
4.  **Envío:** Se envía la fila (o el set de filas completo si hubo recalculo histórico) al script `datalogger.js` mediante un `POST` con un token de seguridad.

---

## 3. Lógica de Cálculo (`tracEngine.ts`)

### A. Normalización mediante Z-Scores
Para que los datos sean comparables, el sistema no usa valores absolutos (como "80 bpm"), sino que los convierte a **Z-Scores** basados en el promedio y la desviación estándar del propio atleta en una ventana móvil (generalmente de 28 o 14 días).
-   **Fórmula:** `Z = (Valor Actual - Media Histórica) / Desviación Estándar`.
-   Esto permite saber si el dato de hoy es "normal" para ese atleta específico o si se desvía de su tendencia.

### B. Métricas Compuestas
El sistema agrupa los Z-Scores en dos grandes pilares:
-   **Fatigue (Fatiga):** Promedio de Z-Scores de métricas negativas (Dolores musculares, HR1, HR2, HR4, Cansancio, Tap Speed Test).
-   **Fitness (Estado de Forma):** Promedio de Z-Scores de métricas positivas (Recuperación percibida, Calidad de sueño, Motivación, Recuperación Vagal).
-   **Readiness (Disposición):** Se calcula como `Fitness - Fatigue`. Un valor positivo indica que el atleta está listo para cargas altas; un valor negativo sugiere precaución.

### C. Análisis del Sistema Nervioso Autónomo (ANS)
El motor clasifica el estado del atleta en perfiles específicos:
-   **OPTIMAL:** Readiness positivo y sin alertas críticas.
-   **SNS Dominant (Simpático):** Respuesta ortostática elevada (Z-OrthoResponse > 1.5). Indica estrés del sistema de "lucha o huida".
-   **PSNS Dominant (Parasimpático):** HR de reposo y costo postural inusualmente bajos. Indica fatiga acumulada por volumen.
-   **Balanced Fatigued:** Fatiga general donde todas las métricas caen proporcionalmente.

### D. Algoritmo TRAC_Action (Prescripción)
Es el motor final de reglas que dicta la recomendación del día:
-   **POTS Flag:** Si el cambio de frecuencia cardíaca al pararse es >30 bpm, ordena reposo total por riesgo de desmayo o deshidratación severa.
-   **Z-Readiness:** Si el Readiness cae por debajo de umbrales críticos (-1.0, -1.5, -2.0), el sistema escala la alerta (Nivel 1, 2 o 3).
-   **Ajuste de RPE:** Basado en el perfil ANS, el sistema sugiere: "Entrenar normal", "Capar RPE a 6", "Reducir series -1", o "Descanso completo".

---

## 4. Archivos Clave para Análisis
Si deseas que otra IA profundice en el código, los archivos esenciales son:

1.  [`src/lib/tracEngine.ts`](file:///c:/Users/Diego/Documents/GitHub/TRAC%20System/src/lib/tracEngine.ts): **Contiene absolutamente toda la lógica matemática.**
2.  [`datalogger.js`](file:///c:/Users/Diego/Documents/GitHub/TRAC%20System/datalogger.js): Explica cómo se guardan los datos en Google Sheets.
3.  [`src/data/surveySteps.ts`](file:///c:/Users/Diego/Documents/GitHub/TRAC%20System/src/data/surveySteps.ts): Define qué preguntas se hacen y cómo se categorizan.

---
*Este documento ha sido generado automáticamente para facilitar la auditoría y exportación de la lógica del sistema TRAC.*
