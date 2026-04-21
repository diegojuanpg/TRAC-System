# Especificaciones Técnicas: Métricas y Algoritmos TRAC

Este documento proporciona una explicación detallada de los datos recolectados por el sistema TRAC, las transformaciones matemáticas aplicadas y las fórmulas utilizadas para generar los diagnósticos de rendimiento y fatiga.

---

## 1. Datos Recolectados (Entradas Crudas)

El sistema recolecta tres tipos de datos diariamente:

### A. Test Ortostático (Objetivo)
Mide la respuesta del sistema cardiovascular al cambio de postura (de decúbito supino a bipedestación).
- **HR1 (Reposibilidad):** Frecuencia cardíaca promedio en reposo (acostado).
- **HR2 (Pico):** Frecuencia cardíaca máxima alcanzada al ponerse de pie.
- **HR3 (Estabilizado):** Frecuencia cardíaca estabilizada tras 30-60 segundos de pie.
- **HR4 (Final):** Frecuencia cardíaca al finalizar el protocolo.

### B. Tap Speed Test (Neurocognitivo)
Mide la velocidad de conducción nerviosa y fatiga del Sistema Nervioso Central (SNC).
- **Tap Total:** Cantidad de pulsaciones en el tiempo determinado.
- **Tap Variance:** Variabilidad en el ritmo de los taps.
- **Tap Pauses:** Cantidad de micro-pausas detectadas.

### C. Cuestionario de Bienestar (Subjetivo)
Escalas de 1 a 5 que evalúan la percepción del atleta.
- **Fatiga:** Push Soreness, Pull Soreness, Legs Soreness, Lesión/Molestia, Cansancio, Carga de Trabajo.
- **Aptitud (Fitness):** Recuperación Percibida, Horas de Sueño, Calidad de Sueño, Alimentación, Motivación.

---

## 2. Normalización de Datos

Para que los datos sean comparables, el sistema realiza dos tipos de transformaciones:

### Escalamiento de Bienestar (1-5 → 0-10)
Se convierten las respuestas subjetivas a una escala decimal.

- **Variables de Fatiga (Menos es mejor):**
  $$Valor_{Norm} = (Valor_{Raw} - 1) \times 2.5$$
  *(Ejemplo: 1 → 0 fatiga, 5 → 10 fatiga)*

- **Variables de Aptitud (Más es mejor):**
  $$Valor_{Norm} = 10 - ((Valor_{Raw} - 1) \times 2.5)$$
  *(Ejemplo: 1 → 10 aptitud, 5 → 0 aptitud)*

### Métricas Base de Ortostatismo
- **OrthoResponse:** $\Delta HR_{pico} = HR2 - HR1$
- **VagalRecovery:** $\Delta HR_{rec} = HR2 - HR3$
- **PosturalCost:** $\Delta HR_{total} = HR4 - HR1$

---

## 3. El Motor Estadístico: Z-Score

La métrica fundamental de TRAC no es el valor absoluto, sino el **Z-Score**. Esto permite evaluar qué tan lejos está el dato de hoy respecto al promedio histórico del propio atleta.

$$Z = \frac{x - \mu}{\sigma}$$

Donde:
- $x$: Valor del día actual.
- $\mu$: Media móvil (Rolling Mean) de los últimos 28 días (14 días para métricas ortostáticas).
- $\sigma$: Desviación estándar de la misma ventana de tiempo.

> [!IMPORTANT]
> **Filtrado de Contexto:** Al calcular $\mu$ y $\sigma$ para el historial basal, el sistema **descarta** automáticamente los días marcados con contextos especiales (Viaje, Estrés extremo, Alcohol, Enfermedad, etc.). Esto asegura que el "promedio" represente el estado normal del atleta y no se vea contaminado por anomalías externas.

> [!NOTE]
> Para el **Tap Speed Test**, el signo se invierte ($Z = -Z$) dado que una disminución en la velocidad indica una caída en el rendimiento (Z negativo).

---

## 4. Métricas Compuestas (Composites)

TRAC agrupa los Z-Scores individuales en tres pilares:

### Fatigue (Fatiga Sistémica)
Promedio de los Z-Scores de: HR1, HR2, HR4, OrthoResponse, PosturalCost, Dolores musculares, Cansancio, Carga percibida y Tap Speed.

### Fitness (Capacidad de Recuperación)
Promedio de los Z-Scores de: Recuperación percibida, Horas de sueño, Calidad de sueño, Alimentación, Motivación y VagalRecovery.

### Readiness (Estado de Preparación)
Es la métrica principal del sistema:
$$Readiness = Fitness - Fatigue$$

A su vez, se calcula el **Z-Readiness** aplicando la fórmula del Z-Score sobre el valor de Readiness resultante.

---

## 5. Tendencias y Carga (Algoritmo EWMA)

Para evaluar la acumulación de fatiga a corto y largo plazo, se utiliza el **Suavizado Exponencial de Media Móvil (EWMA)**.

$$EWMA_t = \lambda \cdot x_t + (1 - \lambda) \cdot EWMA_{t-1}$$

### STF (Short Term Fatigue)
Mide la fatiga aguda (últimos ~7 días).
- **Factor:** $\lambda = 0.25$

### LTF (Long Term Fatigue)
Mide la fatiga crónica o tolerancia basal (últimos ~28 días).
- **Factor:** $\lambda = 0.069$

### ACWR (Acute:Chronic Workload Ratio)
Relación entre carga aguda y crónica para predecir riesgo de lesión.
$$ACWR = 1 - \left( \frac{STF - LTF}{2} \right)$$
*Interpretación:*
- **0.8 a 1.3:** "Sweet Spot" (Carga óptima).
- **> 1.5:** "Danger Zone" (Riesgo crítico de lesión).

---

## 6. Algoritmo de Decisión (TRAC Action)

### Alerta de Preparación (Z-Readiness)
El nivel de alerta se determina por los umbrales de desviación estándar:

| Nivel | Estado | Umbral (Z) |
| :--- | :--- | :--- |
| **1** | Óptimo | $Z > 0.5$ |
| **2** | Bueno | $0.5 \geq Z > -0.5$ |
| **3** | Precaución | $-0.5 \geq Z > -1.0$ |
| **4** | Alerta | $-1.0 \geq Z > -1.5$ |
| **5** | Crítico | $Z \leq -1.5$ |

### Diagnóstico de la Naturaleza de la Fatiga
El sistema diferencia entre fatiga periférica (SNS) y fatiga central (SNC):

1.  **Fatiga del Sistema Nervioso Simpático (SNS):**
    - **Criterio:** $Z_{OrthoResponse} > 1.5$
    - **Acción:** Bajar **Intensidad** (Cargas pesadas, RPE alto).
2.  **Fatiga del Sistema Nervioso Central (SNC):**
    - **Criterio:** $Z_{TapSpeed} > 1.0$
    - **Acción:** Bajar **Volumen** (Series, repeticiones totales).
3.  **Banderas Rojas (POTS):**
    - **Criterio:** $OrthoResponse > 30 \text{ bpm}$
    - **Acción:** Reposo Total (Indicador de deshidratación, enfermedad o sobreentrenamiento agudo).

---

## 7. Sistema de Monitoreo de Estrés: Periférico vs Central

Este documento detalla la estructura, las fórmulas matemáticas y la fundamentación fisiológica de los dos índices de estrés (Periférico y Central) diseñados para el ecosistema de monitoreo mediante Z-Scores.

### A. Peripheral Stress Score (Score de Estrés Periférico)

**Objetivo:** Cuantificar el desgaste, la inflamación y el daño estructural localizado en el tejido musculoesquelético.

#### Fórmula Matemática
$$Peripheral\_Stress=\frac{Z_{PushSoreness}+Z_{PullSoreness}+Z_{LegsSoreness}+Z_{Lesion}}{4}$$

#### Lógica Fisiológica
El estrés periférico se define como la reducción en la eficacia en la unión neuromuscular y los cambios bioquímicos localizados dentro de la fibra muscular, como la depleción de sustratos y la acumulación de metabolitos `[1]`. Su impacto es puramente local y se manifiesta clínicamente a través del dolor muscular de aparición tardía (DOMS) y la tensión mecánica residual en ligamentos y articulaciones `[2]`. 

Al promediar exclusivamente las métricas subjetivas de *Push Soreness*, *Pull Soreness*, *Legs Soreness* y *Lesión/Molestia*, el algoritmo aísla el daño celular y estructural. De esta forma, el índice no se contamina si el atleta está lidiando con factores cardiovasculares o estrés mental externo, reflejando de forma precisa si la maquinaria muscular periférica está recuperada para soportar un nuevo estímulo de volumen `[3]`.

### B. Central Stress Score (Score de Estrés Central)

**Objetivo:** Cuantificar la fatiga de la corteza motora, la desregulación del sistema nervioso autónomo y la carga sistémica global del atleta.

#### Fórmula Matemática
$$Central\_Stress=\frac{Z_{TapSpeed}+Z_{OrthoResponse}+Z_{Cansancio}-Z_{CalidadSueno}}{4}$$
*(Nota matemática: Se resta la Calidad del Sueño porque en tu sistema un Z-Score positivo en esta variable indica "mejor aptitud". Al restarlo, una mala noche de sueño se convierte en un número positivo que suma puntos a la fatiga total).*

#### Lógica Fisiológica
A diferencia del estrés localizado, la fatiga central tiene su origen en el cerebro y la médula espinal, manifestándose como un impulso deficiente en la salida motora cortical que altera drásticamente los procesos de contracción muscular a nivel global `[1]`. Este score integra cuatro vectores fundamentales para detectar el colapso sistémico:

1. **Test de Tecleo Rápido ($Z_{TapSpeed}$):** Las terminaciones nerviosas de las manos son regiones de extrema sensibilidad motora. El Tap Speed Test actúa como una ventana directa y objetiva hacia el sistema nervioso central; un descenso en la tasa de tecleo indica la incapacidad del cerebro para mantener la frecuencia de reclutamiento de unidades motoras a alta velocidad.
2. **Respuesta Ortostática ($Z_{OrthoResponse}$):** Registra el estrés cardiovascular y alerta sobre la hiperactividad del sistema nervioso simpático (el encargado de la respuesta de alerta o "lucha/huida") `[4]`. Un pico en esta variable revela que el eje neuroendocrino está sobreestimulado e incapaz de regresar a la homeostasis basal.
3. **Cansancio General ($Z_{Cansancio}$):** Refleja las alteraciones químicas en el cerebro asociadas al ejercicio extenuante `[5]`. Esta fatiga se experimenta como letargo sistémico y apatía, limitando la tolerancia del individuo para generar fuerza máxima independientemente de que los músculos estén sanos.
4. **Calidad de Sueño ($-Z_{CalidadSueno}$):** Someter al organismo a un estado agudo y prolongado de estrés en el sistema nervioso central conduce irremediablemente a interrupciones en la arquitectura del sueño y la vigilia cognitiva `[1]`. Las sesiones de alta demanda neurológica afectan la modulación autonómica durante la noche, convirtiendo al sueño en un poderoso biomarcador de la recuperación sistémica.
