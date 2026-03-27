# TRAC Morning Survey — Documentación Técnica

## Descripción General

El **Morning Survey** es un cuestionario diario que el atleta completa cada mañana, en ayunas y en reposo. Su propósito es recopilar métricas fisiológicas objetivas y datos subjetivos de bienestar para calcular un perfil de **Readiness** (disposición para entrenar) y generar recomendaciones de entrenamiento automatizadas.

---

## Datos que Trackea

El cuestionario recopila **15 variables** divididas en dos grandes bloques:

### Bloque 1 — Métricas Fisiológicas (Objetivas)

| # | Variable | Tipo de Input | Unidad | Rango | Descripción |
|---|----------|---------------|--------|-------|-------------|
| 1 | **HRV / VFC** | Numérico | ms | 1–300 | Variabilidad de frecuencia cardíaca. Medida acostado, en ayunas, sin estimulantes. |
| 2 | **Test Ortostático** | 4 campos (HR1–HR4) | bpm | — | Frecuencia cardíaca en 4 fases: acostado → de pie → estabilizado → recuperación. |
| 3 | **Tap Speed Test** | Test interactivo | taps | — | Velocidad de tapping con un dedo. Genera: total de taps, varianza inter-tap y cantidad de pausas. |
| 4 | **Peso Corporal** | Numérico | kg | 30–250 | Peso sin ropa, en ayunas, post-baño. |
| 5 | **Contexto del Día** | Selección múltiple | — | — | Factor externo que puede afectar las métricas (Normal, Viaje, Estrés, Alcohol, Enfermedad, Menstruación, Lesión, Otro). |

### Bloque 2 — Cuestionario Subjetivo

Todas las preguntas subjetivas usan una **escala de 1 a 5** que luego se convierte a **0–10**:

| # | Variable | Pregunta |
|---|----------|----------|
| 6 | **Push Soreness** | Dolor/rigidez en pectoral, deltoides y tríceps |
| 7 | **Pull Soreness** | Dolor/rigidez en espalda y bíceps |
| 8 | **Legs Soreness** | Dolor/rigidez en cuádriceps, isquiotibiales y glúteos |
| 9 | **Lesión / Molestia** | Estado de lesiones o molestias activas |
| 10 | **Cansancio** | Nivel de fatiga general al despertar |
| 11 | **Carga de Trabajo** | Percepción de la última sesión de entrenamiento |
| 12 | **Recuperación** | Qué tan recuperado se siente hoy |
| 13 | **Horas de Sueño** | Cantidad de horas dormidas |
| 14 | **Calidad de Sueño** | Qué tan reparador fue el sueño |
| 15 | **Alimentación** | Adherencia al plan nutricional de ayer |
| 16 | **Motivación** | Ganas de entrenar hoy |

---

## Conversión de Escalas Subjetivas

Los valores subjetivos (1–5) se convierten a una escala 0–10 con dos escalas distintas según la categoría:

### Escala Fatigue (más alto = peor)
Variables: Push/Pull/Legs Soreness, Lesión, Cansancio, Carga de Trabajo

| Respuesta (1–5) | Valor (0–10) |
|------------------|--------------|
| 1 | 0.0 |
| 2 | 2.5 |
| 3 | 5.0 |
| 4 | 7.5 |
| 5 | 10.0 |

### Escala Fitness (más alto = mejor → se invierte)
Variables: Recuperación, Horas de Sueño, Calidad de Sueño, Alimentación, Motivación

| Respuesta (1–5) | Valor (0–10) |
|------------------|--------------|
| 1 | 10.0 |
| 2 | 7.5 |
| 3 | 5.0 |
| 4 | 2.5 |
| 5 | 0.0 |

---

## Métricas Derivadas (calculadas automáticamente)

A partir de los datos crudos, el sistema calcula las siguientes métricas derivadas:

### Métricas HRV

| Métrica | Fórmula | Descripción |
|---------|---------|-------------|
| **ln_HRV** | `ln(HRV)` | Logaritmo natural del HRV. Normaliza la distribución sesgada del RMSSD. |
| **lnHRV_7d_mean** | Promedio móvil de `ln_HRV` sobre los **últimos 7 días** | Media semanal del lnHRV. Suaviza la variabilidad diaria para detectar tendencias. |
| **CV_lnHRV** | `(SD / Media) × 100` de los últimos 7 días de `ln_HRV` | Coeficiente de variación del lnHRV. Una reducción sostenida puede indicar riesgo de NFOR (Non-Functional Overreaching). |
| **lnRMSSD/RR ratio** | `ln_HRV / (60000 / HR1)` | Ratio entre la variabilidad parasimpática y el intervalo RR. Detecta saturación vagal. |

### Métricas Ortostáticas

| Métrica | Fórmula | Descripción |
|---------|---------|-------------|
| **OrthoResponse** | `HR2 − HR1` | Respuesta ortostática: diferencia entre FC de pie y acostado. |
| **VagalRecovery** | `HR2 − HR3` | Recuperación vagal: cuánto baja la FC tras ponerse de pie. |
| **PosturalCost** | `HR4 − HR1` | Costo postural: diferencia entre FC final de pie y FC en reposo. |
| **POTS_Flag** | `OrthoResponse > 30` | Bandera de POTS (Síndrome de Taquicardia Ortostática Postural). Si delta > 30 bpm → no entrenar. |

---

## Z-Scores

Cada métrica individual se convierte a un **Z-Score** (puntuación estándar) que indica cuántas desviaciones estándar se aleja del promedio personal del atleta.

### Cómo se calcula

```
Z = (valor_actual − media_ventana) / desviación_estándar_ventana
```

### Ventanas de cálculo

| Tipo de Métrica | Ventana (días) |
|-----------------|----------------|
| Métricas subjetivas (soreness, sueño, etc.) | **28 días** |
| Tap Speed Test | **28 días** |
| Métricas ortostáticas (HR1–HR4, OrthoResponse, etc.) | **14 días** |
| Métricas HRV (lnHRV_7d_mean, CV_lnHRV, lnRMSSD/RR) | **14–28 días** |

### Reglas especiales
- **Mínimo 7 datos** en la ventana para calcular un Z-Score válido. Si hay menos, Z = 0 y se marca `INSUFFICIENT_DATA`.
- **Días con contexto ≠ "Normal"** (viaje, enfermedad, etc.) se **excluyen** de la ventana para no contaminar el baseline.
- El Z-Score de **Tap Speed Test se invierte** (`× -1`), ya que más taps = mejor (contrario al resto donde mayor valor = peor).

---

## Métricas Compuestas

### Fatigue Score
Promedio de los Z-Scores de las siguientes métricas:
- Z-HR1, Z-HR2, Z-HR4
- Z-OrthoResponse, Z-PosturalCost
- Z-Push Soreness, Z-Pull Soreness, Z-Legs Soreness
- Z-Lesión/Molestia, Z-Cansancio, Z-Carga de Trabajo Percibida
- Z-Tap Speed Test

### Fitness Score
Promedio de los Z-Scores de las siguientes métricas:
- Z-ln_HRV (lnHRV 7d mean)
- Z-Recuperación Percibida
- Z-Horas de Sueño, Z-Calidad de Sueño
- Z-Alimentación, Z-Motivación
- Z-VagalRecovery

### Readiness Score
```
Readiness = Fitness − Fatigue
```
Un valor positivo indica buena disposición para entrenar. Un valor negativo indica fatiga acumulada.

---

## STF / LTF (Short-Term y Long-Term Fatigue)

Se calculan usando **EWMA** (Exponentially Weighted Moving Average) sobre el Fatigue Score:

| Métrica | Lambda (λ) | Equivalente aproximado | Descripción |
|---------|------------|------------------------|-------------|
| **STF** (Short-Term Fatigue) | 0.25 | ~7 días | Fatiga de corto plazo. Reacciona rápido a cambios recientes. |
| **LTF** (Long-Term Fatigue) | 0.069 | ~28 días | Fatiga acumulada de largo plazo. Más estable, refleja tendencias. |

### Fórmula EWMA
```
EWMA_t = λ × valor_t + (1 − λ) × EWMA_{t-1}
```

### STF/LTF Ratio
```
STF_LTF_Ratio = STF / LTF
```
- **> 1**: La fatiga reciente supera la acumulada → posible exceso agudo.
- **< 1**: La fatiga reciente es menor que la acumulada → buena recuperación reciente.

---

## Trend 7d

Tendencia de los últimos 7 días del Readiness Score, calculada por **regresión lineal** (pendiente de la recta de mínimos cuadrados).

- **Positivo**: El readiness está mejorando.
- **Negativo**: El readiness está empeorando.
- Requiere al menos **3 datos** en la ventana de 7 días.

---

## ANS Profile (Perfil del Sistema Nervioso Autónomo)

Basado en la combinación de Z-Scores de HRV y métricas ortostáticas, se clasifica el estado del SNA en:

| Perfil | Condición | Significado |
|--------|-----------|-------------|
| **OPTIMAL** | Z-Readiness > 0 y Alert = 0 | Estado óptimo. Posibilidad de PRs. |
| **SNS_DOMINANT** | Z-lnHRV < −1.0 y Z-OrthoResponse > 1.0 | Dominancia simpática. Reducir intensidad drásticamente. |
| **PSNS_DOMINANT** | Z-lnHRV < −1.0, Z-HR1 < −1.0, Z-PosturalCost < −1.0 | Dominancia parasimpática. Reducción moderada. |
| **PSNS_SATURATION** | Igual a PSNS + Z-lnRMSSD/RR < −1.0 | Saturación parasimpática (superforma). HRV bajo por tono vagal alto, no por fatiga. |
| **BALANCED_FATIGUED** | Z-Readiness < −1.0 (sin perfil específico) | Fatiga generalizada sin patrón claro del SNA. |
| **INSUFFICIENT_DATA** | Menos de 7 días de datos | Datos insuficientes para clasificar. |

---

## Alert Level (Nivel de Alerta)

Basado en el Z-Score del Readiness:

| Nivel | Condición (Z-Readiness) | Acción |
|-------|-------------------------|--------|
| **0** | > −1.0 | Sin alerta. Sesión según plan. |
| **1** | ≤ −1.0 | Fatiga leve. Reducción preventiva (RPE −1). |
| **2** | ≤ −1.5 | Fatiga moderada. Sesión ligera (RPE 5–6). |
| **3** | ≤ −2.0 | Fatiga crítica. Descanso completo o regenerativa. |

---

## TRAC Action (Recomendación de Entrenamiento)

La acción final combina POTS_Flag, Alert Level, ANS Profile y NFOR Risk:

| Prioridad | Condición | Recomendación |
|-----------|-----------|---------------|
| 1 | POTS_Flag = true | **REPOSO TOTAL** — Delta ortostático crítico (>30bpm). No entrenar. |
| 2 | Alert Level = 3 | **Descanso completo** o sesión regenerativa (RPE 2–3). |
| 3 | NFOR Risk + Alert = 0 | **Alerta NFOR** — CV del HRV en declive. Reducir volumen preventivamente. |
| 4 | SNS_DOMINANT | **Fatiga Simpática** — Reducir intensidad (cap RPE 6). Volumen moderado. |
| 5 | PSNS_DOMINANT | **Fatiga Parasimpática** — RPE −1, volumen 65–70%. |
| 6 | PSNS_SATURATION | **Superforma** — Sesión normal, posibilidad de PR. |
| 7 | BALANCED_FATIGUED | **Fatiga Generalizada** — RPE −1 y Series −1. |
| 8 | Alert Level = 2 | **Fatiga Moderada** — RPE 5–6. |
| 9 | Alert Level = 1 | **Fatiga Leve** — RPE −1 preventivo. |
| 10 | Alert = 0, datos suficientes | **Readiness Óptimo** — Sesión según plan. Posibilidad de PR. |
| 11 | Fallback | **Datos Insuficientes** — Entrenar según sensaciones. |

---

## NFOR Risk (Non-Functional Overreaching)

```
NFOR_Risk = true si Z-CV_lnHRV < −1.0
```

Detecta cuando la variabilidad del HRV se está reduciendo de forma sostenida, lo cual es un indicador temprano de sobreentrenamiento no funcional, incluso cuando el Readiness global aparenta estar bien.

---

## Resumen de Ventanas Temporales

| Ventana | Duración | Uso |
|---------|----------|-----|
| **7 días** | 1 semana | lnHRV_7d_mean, CV_lnHRV, Trend_7d, STF (via EWMA λ=0.25) |
| **14 días** | 2 semanas | Z-Scores de métricas ortostáticas y HRV derivadas |
| **28 días** | 4 semanas | Z-Scores de métricas subjetivas y tap test, LTF (via EWMA λ=0.069) |
