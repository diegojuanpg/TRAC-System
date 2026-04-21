# Documentación Integral del Sistema TRAC

Este documento detalla el funcionamiento completo del sistema TRAC, su arquitectura técnica, el flujo de los datos, las matemáticas detrás de sus métricas y la filosofía de diseño detrás del panel de visualización.

---

## 1. Arquitectura y Estructura del Sistema

El sistema TRAC utiliza una arquitectura **descentralizada y sin servidor (Serverless)**, separando la lógica de cálculo del almacenamiento, lo que permite escalabilidad por atleta y un rendimiento en tiempo real.

### Componentes Principales:
1. **Frontend (Cerebro del Sistema):** Desarrollado en React con Vite. Aquí reside toda la lógica de cálculo pesado (`tracEngine.ts`). Las matemáticas se ejecutan directamente en el navegador (o dispositivo móvil) del atleta, eliminando la necesidad de servidores costosos.
2. **Backend / API (Puente):** Google Apps Script (`datalogger.js`). Actúa estrictamente como una API REST (recibiendo peticiones `POST` y `GET`). No realiza ningún cálculo; su único trabajo es recibir la data procesada por el frontend y persistirla de forma segura.
3. **Base de Datos (Almacenamiento):** Google Sheets. Cada atleta tiene su propia hoja de cálculo donde se almacena el historial cronológico. Esto democratiza el sistema y facilita la auditoría visual de los datos por parte del entrenador.

### Flujo y Depósito de Datos:
1. El atleta abre la aplicación (Frontend) y completa el `Morning Survey` (Encuesta Matutina).
2. Al presionar "Enviar", la aplicación hace un `GET` silencioso a Google Apps Script para descargar los últimos ~28 días de historial del atleta.
3. El motor local (`tracEngine.ts`) concatena los datos de la encuesta de hoy con el historial, recalcula todas las métricas dinámicas (Z-Scores, Tendencias).
4. El Frontend hace un `POST` enviando la fila completamente calculada de regreso a `datalogger.js`.
5. El script deposita la información cruda y calculada en la pestaña `TRAC_database` de la hoja de Google Sheets del atleta.

---

## 2. Datos Trackeados (Inputs del Atleta)

El sistema captura información subjetiva y objetiva cada mañana mediante la encuesta (`surveySteps.ts`). 

### Datos Objetivos:
- **Test Ortostático:** Mide la respuesta de la Frecuencia Cardíaca (HR) a los cambios de postura (Acostado vs Parado). Se extraen HR1, HR2, HR3, HR4.
- **Tap Speed Test:** Prueba neurocognitiva de toques en pantalla. Mide la fatiga del Sistema Nervioso Central (SNC).
- **Peso Corporal:** Fluctuaciones de masa.
- **Contexto del Día:** Variables externas (viajes, enfermedad, menstruación).

### Datos Subjetivos (Cuestionarios en escala 1-5 convertidos a 0-10):
- **Carga de Trabajo:** Esfuerzo percibido el día anterior.
- **Fatiga Muscular Localizada (Soreness):** Dolor en empuje, tracción y piernas.
- **Molestias / Lesiones:** Restricciones articulares.
- **Cansancio General:** Fatiga sistémica al despertar.
- **Recuperación, Sueño, Nutrición y Motivación:** Parámetros de bienestar general.

---

## 3. Cálculos y Fórmulas Matemáticas

El sistema no utiliza valores absolutos (e.g., "70 latidos por minuto") para diagnosticar, ya que esto varía radicalmente entre individuos. Todo se convierte a **estadística relativa** usando Z-Scores.

### A. Estandarización (Z-Scores)
Transforma cualquier métrica en "desviaciones estándar respecto al promedio del atleta", usando una ventana temporal móvil (típicamente 28 o 14 días).

**Fórmula:**
$$ Z = \frac{X_i - \mu}{\sigma} $$

*Donde:*
- $X_i$ = Valor de hoy.
- $\mu$ = Media aritmética de la ventana histórica (ej. últimos 14 días).
- $\sigma$ = Desviación estándar de esa misma ventana.

*Por qué:* Permite comparar "peras con manzanas". Un Z-Score de `+1.0` en fatiga muscular significa exactamente el mismo nivel de anomalía estadística que un `+1.0` en frecuencia cardíaca ortostática.

### B. Métricas Compuestas (Composites)
Se agrupan los Z-Scores en tres grandes pilares promediando los valores relevantes:

- **Fatigue:** $Promedio(Z_{HR}, Z_{Soreness}, Z_{Cansancio}, Z_{TapSpeed...})$
- **Fitness:** $Promedio(Z_{Recuperacion}, Z_{Sueno}, Z_{Nutricion}, Z_{VagalRecovery...})$
- **Readiness (Disposición):** $Fitness - Fatigue$

### C. Suavizado Exponencial (EWMA) para Fatiga Aguda (STF) y Crónica (LTF)
Se utiliza la Media Móvil Exponencial Ponderada para entender la tendencia temporal de la fatiga.

**Fórmula EWMA:**
$$ EWMA_t = (Valor_{Actual} \times \lambda) + (EWMA_{t-1} \times (1 - \lambda)) $$

- **STF (Fatiga a Corto Plazo):** Usa un $\lambda = 0.25$ (mayor peso a los últimos 7 días). Representa el estrés agudo.
- **LTF (Fatiga a Largo Plazo):** Usa un $\lambda = 0.069$ (memoria extendida a 28 días). Representa la capacidad de carga base crónica.

### D. ACWR (Acute:Chronic Workload Ratio)
En lugar de dividir (lo que genera problemas con números negativos en Z-Scores), TRAC aplica una traslación afín:

**Fórmula:**
$$ ACWR = 1 - \left( \frac{STF - LTF}{2} \right) $$

*Por qué:* Nos dice a qué ritmo estamos acumulando estrés vs nuestra tolerancia histórica. Si es mayor a 1.5, hay un pico grave de fatiga y alto riesgo de lesión.

---

## 4. Desarrollo del Dashboard y UI/UX

El `MonitoringDashboard` (Dashboard de Rendimiento) fue desarrollado con un enfoque estricto en la usabilidad rápida, premium y altamente visual. 

### Filosofía de Diseño:
- **Dark Mode y Minimalismo:** Se utiliza fondo oscuro (`bg-[#0E0E0E]`) con acentos brillantes (verde, amarillo, rojo). Esto reduce la fatiga visual del entrenador y resalta únicamente lo importante.
- **Semáforos (Color Coding):** El cerebro procesa colores antes que números. Todo en el dashboard reacciona dinámicamente:
  - 🟢 **Verde:** Óptimo / Listo.
  - 🟡/🟠 **Amarillo/Naranja:** Precaución / Fatiga Leve a Moderada.
  - 🔴 **Rojo:** Peligro / Descanso mandatorio.
- **Gauges (Relojes Circulares):** Se usan componentes `PremiumGauge` para el ACWR, STF y LTF. Un gauge indica intuitivamente "qué tan lleno está el tanque" o "qué tan cerca de la línea roja estamos", algo que un número crudo no logra comunicar eficazmente.
- **Unificación de Alertas:** En lugar de hacer que el atleta o el coach lea decenas de métricas, el motor procesa todo y devuelve una **tarjeta de Recomendación Única** en el centro de la pantalla.

---

## 5. Recomendaciones y el Sistema Nervioso Autónomo (ANS)

La instrucción final (`TRAC_Action`) asocia el perfil del Sistema Nervioso con ajustes prescriptivos en el entrenamiento (Volumen e Intensidad).

El sistema analiza las frecuencias cardíacas de reposo (HR1) y ortostáticas (al pararse, HR2) para determinar qué rama del sistema nervioso está dominando y por lo tanto, qué tipo de fatiga sufre el atleta:

### 1. Sistema Simpático y SNC (Ajustes de Carga)
El sistema analiza el Readiness para el estado general y luego usa los tests objetivos para precisar el ajuste:

- **Nivel 1 (Z > 0.5):** ÓPTIMO - Capacidad máxima. Sistema totalmente listo para rendir al 100%.
- **Nivel 2 (+0.5 a -0.5):** BUENO - Estado equilibrado. Entrenar según lo planeado.
- **Nivel 3 (-0.5 a -1.0):** PRECAUCIÓN - Fatiga leve. Evitar excesos y monitorizar sensaciones.
- **Nivel 4 (-1.0 a -1.5):** ALERTA - Fatiga moderada. Reducción de carga necesaria.
- **Nivel 5 (Z ≤ -1.5):** CRÍTICO - Agotamiento severo. Descanso o sesión regenerativa.

### 2. Cruce con Tests Objetivos
- **Test Ortostático (Fatiga SNS):** Si se detecta una respuesta elevada (Z > 1.5), el sistema recomienda bajar la **INTENSIDAD** (kilos/RPE).
- **Tap Speed Test (Fatiga SNC):** Si se detecta una caída en la velocidad (Z > 1.0), el sistema recomienda bajar el **VOLUMEN** (series/ejercicios).
- **Si ambos fallan:** Se recomienda bajar ambos (Fatiga Sistémica).

### 4. Banderas Rojas y Riesgo Ortostático (`POTS_Flag`)
- **Fisiología:** El pulso salta más de 30 bpm al ponerse de pie. 
- **Asociación:** Signo clínico inequívoco de deshidratación severa, enfermedad incubándose o disfunción autonómica aguda.
- **Recomendación:** `REPOSO TOTAL. No entrenar.` (Bloqueo absoluto por riesgo de lesión o síncope).
