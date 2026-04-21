# TRAC System — Diccionario de Métricas Resultantes

Este documento detalla todas las **Métricas Resultantes (Derivadas y Computadas)** del sistema TRAC. Estas son variables que el sistema calcula internamente a partir de los datos crudos ingresados por el atleta (frecuencia cardíaca, encuestas de bienestar, test neurocognitivo, etc.). 

Su función es triangular la información para emitir un diagnóstico preciso sobre el estado de recuperación, fatiga y preparación del sistema nervioso.

---

## Métricas de Agrupación (Composites)

El sistema normaliza los datos crudos convirtiéndolos en **Z-Scores** (estadística individual basada en el historial de los últimos 14-28 días del atleta) para luego agruparlos:

*   **`Fatigue`**
    *   **Cálculo:** Promedio de todos los factores de agotamiento (Dolores musculares, Z-Scores ortostáticos, caídas en velocidad del Tap Speed Test).
    *   **Indica:** La carga de fatiga general sistémica y muscular que el cuerpo está acarreando.

*   **`Fitness`**
    *   **Cálculo:** Promedio de todos los factores de recuperación (Buena alimentación, calidad de sueño, motivación, recuperación percibida y recuperación vagal ortostática).
    *   **Indica:** El nivel de recuperación y disposición energética positiva del cuerpo.

*   **`Z-Readiness`**
    *   **Cálculo:** `Fitness` - `Fatigue`. 
    *   **Indica:** La métrica rey y la resultante absoluta de preparación. Si es positivo (verde), estás listo para absorber carga de entrenamiento. Si es muy negativo, tu cuerpo está luchando con el estrés.

---

## Métricas de Tendencia y Carga Acumulada

Estas métricas evalúan la carga de hoy en el contexto de cómo ha sido la tendencia de las semanas anteriores utilizando Suavizado Exponencial (EWMA):

*   **`STF` (Short Term Fatigue)**
    *   **Cálculo:** Se calcula mediante un Suavizado Exponencial (EWMA) sobre el historial de *Readiness*. Utiliza un factor de suavización (`lambda = 0.25`), lo cual le da el mayor peso matemático a los últimos **7 días**. Técnicamente no es un promedio simple, sino ponderado hacia la fatiga más reciente.
    *   **Indica:** La fatiga aguda y estado de preparación a muy corto plazo que tu cuerpo acumuló esta semana.

*   **`LTF` (Long Term Fatigue)**
    *   **Cálculo:** También utiliza Suavizado Exponencial (EWMA) sobre el historial de *Readiness*, pero con un factor drásticamente menor (`lambda = 0.069`). Esto estira la memoria del cálculo haciendo que resalte la tendencia de los últimos **28 días**.
    *   **Indica:** Tu nivel basal, tolerancia al esfuerzo y fatiga a nivel crónico mensual.

*   **`ACWR` (Acute:Chronic Workload Ratio / STF_LTF_Ratio)**
    *   **Cálculo:** Para evitar los clásicos errores matemáticos de "dividir por cero" o cruce de signos al trabajar puramente con Z-Scores, TRAC aplica una traslación afín: `1 - ((STF - LTF) / 2)`.
    *   **Indica:** El ritmo al que estás acumulando estrés mapeado a las zonas universales de Tim Gabbett:
        *   **`< 0.8` (Desadaptación):** Estás perdiendo nivel físico aceleradamente (o en medio de un *tapering* de descarga extrema).
        *   **`0.8` a `1.3` (Sweet Spot):** Zona óptima de progreso deportivo. Estás asimilando correctamente la carga.
        *   **`> 1.5` (Zona de Peligro):** Picos mortales. Acumulaste demasiada carga muy rápido (más del 50% extra vs tu mes histórico). El riesgo de lesión de tejidos se dispara de forma crítica.
---

## Indicadores de Prescripción y Alertas (Algoritmo Final)

Estas son las cuatro columnas resolutivas que el motor de cálculo usa para emitir la recomendación táctica del día:

*   **`POTS_Flag`**
    *   **Cálculo:** Verdadero/Falso. Se dispara si `OrthoResponse` (Latidos al pararse - Latidos en reposo) es mayor a `30 bpm`.
    *   **Indica:** Alerta roja inmediata de estrés ortostático. Generalmente denota deshidratación grave, infección en incubación, o fatiga de alarma. Bloquea el resto del sistema.

*   **`Alert_Level`**
    *   **Cálculo:** Escala gradual de `0` a `3`. Depende de cuántas desviaciones estándar haya caído el `Z-Readiness`.
    *   **Indica:** La severidad general del agotamiento. Un nivel 0 es un estado óptimo, mientras que un nivel 3 requiere acción regenerativa obligatoria.

*   **`ANS_Profile` (Perfil del Sistema Nervioso Autónomo)**
    *   **Cálculo:** Diagnóstico cruzado basado en los resultados del test ortostático (`OrthoResponse`, `HR1`, `PosturalCost`) y el `Z-Readiness`.
    *   **Indica:** Clasifica la naturaleza biológica de tu fatiga en 4 estados:
        *   `OPTIMAL`: Sistema equilibrado.
        *   `BALANCED_FATIGUED`: Agotamiento metabólico normal por entrenamiento.
        *   `SNS_DOMINANT`: Sobre-estimulación del Sistema Simpático (lucha o huida). Los latidos se disparan exageradamente con los cambios de postura.
        *   `PSNS_DOMINANT`: Inhibición del Sistema Parasimpático por volumen de entrenamiento profundo. Los latidos caen inusualmente por debajo del promedio debido a fatiga acumulada (no utiliza VFC/HRV).

*   **`TRAC_Action`**
    *   **Cálculo / Lógica:** Es la instrucción final del sistema. Se evalúa en "cascada", bajando desde las banderas más graves hasta el estado óptimo. Todas las posibles salidas (y su porqué) son:

        5.  **"CRÍTICO: Agotamiento severo. Descanso o sesión regenerativa."**
            *(Se dispara si Z-Readiness ≤ -1.5).*
        
        ### Diagnóstico Objetivo (SNS / SNC)
        Una vez definido el nivel de Readiness, el sistema cruza los datos para especificar el ajuste:
        - **Si Z-OrthoResponse > 1.5 (Fatiga SNS):** Se recomienda bajar la INTENSIDAD (kilos/RPE).
        - **Si Z-Tap Speed > 1.0 (Fatiga SNC):** Se recomienda bajar el VOLUMEN (series/repeticiones).
