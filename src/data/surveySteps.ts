// Step definitions for the Morning Survey
export interface ScaleOption {
  value: number;
  label: string;
}

export interface StepDefinition {
  id: string;
  type: 'number' | 'scale' | 'tap' | 'ortho' | 'context' | 'training' | 'ostrc';
  category: string;
  question: string;
  hint: string;
  unit?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: ScaleOption[];
}

export const STEPS: StepDefinition[] = [
  {
    id: 'ortho', type: 'ortho', category: 'Cuestionario objetivo', question: 'Test Ortostático',
    hint: 'Medí la frecuencia cardíaca en cada fase del protocolo'
  },
  {
    id: 'tap', type: 'tap', category: 'Cuestionario objetivo', question: 'Tap Speed Test',
    hint: 'Con el antebrazo apoyado y usando tu mano dominante, realiza la mayor cantidad de taps posibles.'
  },
  {
    id: 'bodyweight', type: 'number', category: '', question: 'Peso Corporal',
    hint: 'Debes pesarte sin ropa, en ayunas y luego de ir al baño.',
    unit: 'KG', placeholder: '78.5', min: 30, max: 250
  },
  {
    id: 'contexto', type: 'context', category: '', question: 'Contexto del día',
    hint: '¿Algún factor altera tu rendimiento hoy?'
  },
  {
    id: 'push_soreness', type: 'scale', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Push Soreness',
    hint: 'Dolor/rigidez en pectoral, deltoides y tríceps.',
    options: [
      { value: 1, label: 'Sin dolor ni rigidez.' },
      { value: 2, label: 'Dolor muy leve. Apenas perceptible.' },
      { value: 3, label: 'Algo de dolor. Notorio pero no severo.' },
      { value: 4, label: 'Dolor considerable. Notorio en actividades diarias.' },
      { value: 5, label: 'Dolor severo en todo el rango de movimiento.' },
    ]
  },
  {
    id: 'pull_soreness', type: 'scale', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Pull Soreness',
    hint: 'Dolor/rigidez en toda la espalda y bíceps.',
    options: [
      { value: 1, label: 'Sin dolor ni rigidez.' },
      { value: 2, label: 'Dolor muy leve. Apenas perceptible.' },
      { value: 3, label: 'Algo de dolor. Notorio pero no severo.' },
      { value: 4, label: 'Dolor considerable. Notorio en actividades diarias.' },
      { value: 5, label: 'Dolor severo en todo el rango de movimiento.' },
    ]
  },
  {
    id: 'legs_soreness', type: 'scale', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Legs Soreness',
    hint: 'Dolor/rigidez en cuádriceps, isquiotibiales, y glúteos.',
    options: [
      { value: 1, label: 'Sin dolor ni rigidez.' },
      { value: 2, label: 'Dolor muy leve. Apenas perceptible.' },
      { value: 3, label: 'Algo de dolor. Notorio pero no severo.' },
      { value: 4, label: 'Dolor considerable. Notorio en actividades diarias.' },
      { value: 5, label: 'Dolor severo en todo el rango de movimiento.' },
    ]
  },
  {
    id: 'lesion', type: 'ostrc', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Lesión / Molestia',
    hint: 'Reporte estructurado (OSTRC). Si no hay dolor, terminás en un toque.',
  },
  {
    id: 'cansancio', type: 'scale', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Fatiga general',
    hint: 'Nivel de fatiga general al despertar.',
    options: [
      { value: 1, label: 'Me siento muy descansado.' },
      { value: 2, label: 'Me siento descansado.' },
      { value: 3, label: 'Normal. Ni cansado ni descansado.' },
      { value: 4, label: 'Más cansado de lo normal.' },
      { value: 5, label: 'Siempre estoy cansado.' },
    ]
  },
  {
    id: 'carga', type: 'training', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Carga de Entrenamiento',
    hint: 'Registrá tu sesión: RPE × duración. Tocá un día para agregar o editar.',
  },
  {
    id: 'recuperacion', type: 'scale', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Recuperación',
    hint: 'Qué tan recuperado te sentís hoy.',
    options: [
      { value: 1, label: 'Muy bien recuperado. Sin fatiga.' },
      { value: 2, label: 'Bien recuperado. Un poco de fatiga.' },
      { value: 3, label: 'Recuperación parcial. Algo de fatiga.' },
      { value: 4, label: 'Poco recuperado. Fatigado.' },
      { value: 5, label: 'Muy mal recuperado. Altamente fatigado.' },
    ]
  },
  {
    id: 'horas_sueno', type: 'scale', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Horas de Sueño',
    hint: 'Cantidad de horas dormidas anoche.',
    options: [
      { value: 1, label: '8 horas o más.' },
      { value: 2, label: '7-8 horas.' },
      { value: 3, label: '6-7 horas.' },
      { value: 4, label: '5-6 horas.' },
      { value: 5, label: 'Menos de 5 horas.' },
    ]
  },
  {
    id: 'calidad_sueno', type: 'scale', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Calidad de Sueño',
    hint: 'Qué tan reparador fue tu sueño.',
    options: [
      { value: 1, label: 'Dormí de un tirón. Completamente descansado.' },
      { value: 2, label: 'Me desperté una vez pero volví a dormir rápido.' },
      { value: 3, label: 'Sueño interrumpido o tardé en dormirme.' },
      { value: 4, label: 'Noche muy mala. Fragmentado o superficial.' },
      { value: 5, label: 'Casi no dormí.' },
    ]
  },
  {
    id: 'alimentacion', type: 'scale', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Disponibilidad energética',
    hint: '¿Sentís que comiste lo suficiente para tu carga de ayer?',
    options: [
      { value: 1, label: 'Bien comido y energizado.' },
      { value: 2, label: 'Adecuado. Sin déficit notorio.' },
      { value: 3, label: 'Justo. Algo de hambre durante el día.' },
      { value: 4, label: 'Faltó comida. Sensación de agotamiento.' },
      { value: 5, label: 'Muy poco. Bajón energético severo.' },
    ]
  },
  {
    id: 'motivacion', type: 'scale', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Motivación',
    hint: 'Ganas de entrenar hoy.',
    options: [
      { value: 1, label: 'Quiero entrenar.' },
      { value: 2, label: 'Tengo algunas ganas de entrenar.' },
      { value: 3, label: 'Me es indiferente.' },
      { value: 4, label: 'Tengo pocas ganas.' },
      { value: 5, label: 'No quiero entrenar.' },
    ]
  },
  {
    id: 'estres', type: 'scale', category: 'SUBJECTIVE QUESTIONNAIRE', question: 'Estrés psicológico',
    hint: 'Estrés percibido fuera del entrenamiento (trabajo, estudios, vida personal).',
    options: [
      { value: 1, label: 'Muy relajado. Sin estrés notable.' },
      { value: 2, label: 'Calmo. Estrés bajo.' },
      { value: 3, label: 'Estrés moderado. Manejable.' },
      { value: 4, label: 'Estrés alto. Difícil de manejar.' },
      { value: 5, label: 'Estrés extremo. Saturado.' },
    ]
  },
];

export const CONTEXT_OPTIONS = [
  { id: 'Normal', icon: 'circle-dot', label: 'Normal' },
  { id: 'Viaje', icon: 'plane', label: 'Viaje' },
  { id: 'Alcohol', icon: 'wine', label: 'Alcohol' },
  { id: 'Enfermedad', icon: 'thermometer', label: 'Enfermedad' },
  { id: 'Menstruación', icon: 'circle', label: 'Menstruación' },
  { id: 'Lesión', icon: 'bandage', label: 'Lesión' },
  { id: 'Otro', icon: 'more-horizontal', label: 'Otro' },
];

export interface FormData {
  [key: string]: string | number | undefined;
}
