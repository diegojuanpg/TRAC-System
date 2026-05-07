import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import {
  fetchNutritionHistory,
  fetchGoals,
  fetchRefeeds,
} from '@/lib/nutritionApi';
import { Goals, EMPTY_GOALS, NutritionRow } from '@/lib/nutritionMath';

const MOCK_ROWS: NutritionRow[] = [
  {date:"2026-02-04",bodyweight:78.5,calories:2174,protein:148,carbs:234,fat:72,fiber:24,water:1.9,steps:8498,cardio:0},
  {date:"2026-02-05",bodyweight:78.4,calories:2304,protein:152,carbs:282,fat:63,fiber:25,water:2.7,steps:10062,cardio:35},
  {date:"2026-02-06",bodyweight:78.2,calories:2238,protein:167,carbs:273,fat:53,fiber:28,water:2.9,steps:7818,cardio:25},
  {date:"2026-02-07",bodyweight:78.7,calories:2556,protein:154,carbs:321,fat:73,fiber:19,water:2.7,steps:3728,cardio:0},
  {date:"2026-02-08",bodyweight:78.7,calories:2475,protein:123,carbs:363,fat:59,fiber:18,water:2.0,steps:3929,cardio:0},
  {date:"2026-02-09",bodyweight:78.2,calories:2217,protein:162,carbs:232,fat:71,fiber:27,water:2.8,steps:8718,cardio:0},
  {date:"2026-02-10",bodyweight:78.2,calories:2308,protein:153,carbs:260,fat:73,fiber:32,water:2.3,steps:7289,cardio:30},
  {date:"2026-02-11",bodyweight:78.3,calories:2084,protein:153,carbs:190,fat:79,fiber:22,water:2.6,steps:9304,cardio:20},
  {date:"2026-02-12",bodyweight:78.4,calories:2238,protein:145,carbs:252,fat:72,fiber:28,water:3.4,steps:8930,cardio:50},
  {date:"2026-02-13",bodyweight:78.2,calories:2361,protein:136,carbs:301,fat:68,fiber:27,water:2.5,steps:6134,cardio:50},
  {date:"2026-02-14",bodyweight:78.6,calories:2409,protein:160,carbs:220,fat:99,fiber:23,water:2.5,steps:6691,cardio:0},
  {date:"2026-02-15",bodyweight:78.4,calories:2541,protein:135,carbs:334,fat:74,fiber:27,water:3.0,steps:5955,cardio:20},
  {date:"2026-02-16",bodyweight:78.3,calories:2133,protein:169,carbs:243,fat:54,fiber:26,water:2.1,steps:7762,cardio:0},
  {date:"2026-02-17",bodyweight:78.5,calories:2158,protein:126,carbs:229,fat:82,fiber:24,water:2.3,steps:7966,cardio:35},
  {date:"2026-02-18",bodyweight:78.6,calories:2408,protein:125,carbs:340,fat:61,fiber:25,water:2.5,steps:7866,cardio:40},
  {date:"2026-02-19",bodyweight:78.3,calories:2207,protein:161,carbs:254,fat:61,fiber:24,water:2.4,steps:5258,cardio:30},
  {date:"2026-02-20",bodyweight:78.5,calories:2323,protein:139,carbs:300,fat:63,fiber:29,water:2.2,steps:8444,cardio:35},
  {date:"2026-02-21",bodyweight:78.6,calories:2465,protein:135,carbs:346,fat:60,fiber:21,water:2.9,steps:5031,cardio:0},
  {date:"2026-02-22",bodyweight:78.3,calories:2512,protein:131,carbs:360,fat:61,fiber:33,water:2.5,steps:6522,cardio:0},
  {date:"2026-02-23",bodyweight:78.3,calories:2113,protein:166,carbs:220,fat:63,fiber:31,water:1.9,steps:7413,cardio:60},
  {date:"2026-02-24",bodyweight:78.2,calories:2370,protein:144,carbs:298,fat:67,fiber:22,water:2.2,steps:5460,cardio:0},
  {date:"2026-02-25",bodyweight:78.5,calories:2077,protein:132,carbs:207,fat:80,fiber:28,water:2.6,steps:7315,cardio:0},
  {date:"2026-02-26",bodyweight:78.0,calories:2181,protein:157,carbs:220,fat:75,fiber:26,water:2.4,steps:9053,cardio:0},
  {date:"2026-02-27",bodyweight:77.6,calories:2092,protein:135,carbs:233,fat:69,fiber:25,water:2.5,steps:6899,cardio:0},
  {date:"2026-02-28",bodyweight:77.5,calories:2535,protein:157,carbs:337,fat:62,fiber:30,water:2.5,steps:8355,cardio:0},
  {date:"2026-03-01",bodyweight:77.9,calories:2420,protein:127,carbs:325,fat:68,fiber:18,water:2.2,steps:6081,cardio:0},
  {date:"2026-03-02",bodyweight:78.6,calories:2288,protein:162,carbs:257,fat:68,fiber:30,water:2.6,steps:9614,cardio:0},
  {date:"2026-03-03",bodyweight:77.9,calories:1907,protein:149,carbs:175,fat:68,fiber:26,water:2.8,steps:6836,cardio:35},
  {date:"2026-03-04",bodyweight:78.0,calories:2180,protein:169,carbs:214,fat:72,fiber:21,water:2.4,steps:7849,cardio:0},
  {date:"2026-03-05",bodyweight:78.5,calories:2192,protein:158,carbs:260,fat:58,fiber:21,water:3.3,steps:6484,cardio:0},
  {date:"2026-03-06",bodyweight:77.8,calories:2067,protein:165,carbs:190,fat:72,fiber:22,water:2.5,steps:7670,cardio:0},
  {date:"2026-03-07",bodyweight:78.1,calories:2465,protein:166,carbs:322,fat:57,fiber:24,water:3.2,steps:5724,cardio:0},
  {date:"2026-03-08",bodyweight:77.8,calories:2334,protein:156,carbs:286,fat:63,fiber:28,water:2.3,steps:7901,cardio:0},
  {date:"2026-03-09",bodyweight:77.7,calories:2180,protein:160,carbs:257,fat:57,fiber:31,water:2.8,steps:6579,cardio:0},
  {date:"2026-03-10",bodyweight:78.1,calories:2174,protein:131,carbs:298,fat:51,fiber:29,water:2.6,steps:10853,cardio:0},
  {date:"2026-03-11",bodyweight:78.6,calories:1981,protein:158,carbs:202,fat:60,fiber:24,water:3.1,steps:7222,cardio:0},
  {date:"2026-03-12",bodyweight:78.2,calories:2232,protein:135,carbs:284,fat:62,fiber:30,water:2.6,steps:11666,cardio:0},
  {date:"2026-03-13",bodyweight:77.6,calories:2058,protein:168,carbs:212,fat:60,fiber:21,water:1.7,steps:6877,cardio:30},
  {date:"2026-03-14",bodyweight:78.1,calories:2450,protein:164,carbs:268,fat:80,fiber:27,water:2.9,steps:7464,cardio:50},
  {date:"2026-03-15",bodyweight:78.5,calories:2597,protein:122,carbs:374,fat:68,fiber:21,water:2.5,steps:5302,cardio:60},
  {date:"2026-03-16",bodyweight:78.0,calories:2472,protein:138,carbs:329,fat:67,fiber:26,water:2.2,steps:8972,cardio:0},
  {date:"2026-03-17",bodyweight:77.9,calories:2458,protein:121,carbs:354,fat:62,fiber:32,water:1.6,steps:10492,cardio:20},
  {date:"2026-03-18",bodyweight:78.5,calories:2464,protein:167,carbs:251,fat:88,fiber:25,water:2.7,steps:5780,cardio:0},
  {date:"2026-03-19",bodyweight:78.0,calories:2059,protein:139,carbs:252,fat:55,fiber:29,water:2.5,steps:10355,cardio:0},
  {date:"2026-03-20",bodyweight:78.2,calories:2116,protein:145,carbs:274,fat:49,fiber:23,water:2.2,steps:10005,cardio:0},
  {date:"2026-03-21",bodyweight:78.0,calories:2386,protein:177,carbs:278,fat:63,fiber:21,water:2.4,steps:7432,cardio:0},
  {date:"2026-03-22",bodyweight:77.8,calories:2575,protein:119,carbs:354,fat:76,fiber:20,water:1.7,steps:5051,cardio:20},
  {date:"2026-03-23",bodyweight:77.6,calories:2166,protein:160,carbs:228,fat:68,fiber:18,water:2.3,steps:9456,cardio:60},
  {date:"2026-03-24",bodyweight:78.0,calories:1834,protein:148,carbs:198,fat:50,fiber:23,water:3.1,steps:7514,cardio:35},
  {date:"2026-03-25",bodyweight:77.7,calories:2150,protein:141,carbs:248,fat:66,fiber:26,water:2.5,steps:9702,cardio:25},
  {date:"2026-03-26",bodyweight:77.1,calories:2286,protein:129,carbs:312,fat:58,fiber:21,water:2.8,steps:9373,cardio:25},
  {date:"2026-03-27",bodyweight:78.1,calories:2219,protein:140,carbs:257,fat:70,fiber:18,water:2.0,steps:8423,cardio:25},
  {date:"2026-03-28",bodyweight:77.2,calories:2573,protein:128,carbs:425,fat:40,fiber:15,water:1.9,steps:7604,cardio:50},
  {date:"2026-03-29",bodyweight:77.4,calories:2592,protein:133,carbs:340,fat:78,fiber:20,water:2.2,steps:6184,cardio:0},
  {date:"2026-03-30",bodyweight:77.4,calories:2005,protein:129,carbs:230,fat:63,fiber:25,water:2.7,steps:7734,cardio:0},
  {date:"2026-03-31",bodyweight:77.9,calories:2121,protein:148,carbs:232,fat:67,fiber:33,water:2.5,steps:7474,cardio:60},
  {date:"2026-04-01",bodyweight:77.5,calories:2252,protein:121,carbs:273,fat:75,fiber:18,water:2.2,steps:9588,cardio:0},
  {date:"2026-04-02",bodyweight:77.2,calories:2340,protein:151,carbs:288,fat:65,fiber:15,water:2.9,steps:7549,cardio:35},
  {date:"2026-04-03",bodyweight:77.4,calories:2209,protein:135,carbs:269,fat:66,fiber:21,water:1.9,steps:7536,cardio:20},
  {date:"2026-04-04",bodyweight:77.0,calories:2667,protein:139,carbs:386,fat:63,fiber:23,water:1.8,steps:7306,cardio:0},
  {date:"2026-04-05",bodyweight:77.6,calories:2633,protein:137,carbs:368,fat:68,fiber:28,water:2.3,steps:7496,cardio:60},
  {date:"2026-04-06",bodyweight:77.5,calories:2385,protein:152,carbs:278,fat:74,fiber:25,water:2.1,steps:5883,cardio:20},
  {date:"2026-04-07",bodyweight:77.8,calories:2169,protein:159,carbs:235,fat:66,fiber:30,water:2.9,steps:7032,cardio:45},
  {date:"2026-04-08",bodyweight:77.5,calories:2301,protein:168,carbs:261,fat:65,fiber:23,water:2.9,steps:4483,cardio:0},
  {date:"2026-04-09",bodyweight:77.8,calories:2221,protein:133,carbs:328,fat:42,fiber:19,water:2.9,steps:10041,cardio:25},
  {date:"2026-04-10",bodyweight:77.7,calories:2159,protein:138,carbs:271,fat:58,fiber:17,water:2.6,steps:6143,cardio:0},
  {date:"2026-04-11",bodyweight:77.1,calories:2455,protein:170,carbs:284,fat:71,fiber:30,water:2.5,steps:4404,cardio:0},
  {date:"2026-04-12",bodyweight:77.5,calories:2629,protein:140,carbs:362,fat:69,fiber:28,water:1.9,steps:5704,cardio:60},
  {date:"2026-04-13",bodyweight:76.9,calories:2261,protein:139,carbs:291,fat:60,fiber:25,water:3.4,steps:7703,cardio:50},
  {date:"2026-04-14",bodyweight:77.8,calories:2110,protein:165,carbs:228,fat:60,fiber:30,water:2.3,steps:8917,cardio:0},
  {date:"2026-04-15",bodyweight:76.9,calories:2024,protein:133,carbs:236,fat:61,fiber:26,water:2.8,steps:6411,cardio:0},
  {date:"2026-04-16",bodyweight:77.6,calories:1966,protein:154,carbs:196,fat:63,fiber:25,water:2.4,steps:9468,cardio:0},
  {date:"2026-04-17",bodyweight:77.3,calories:2077,protein:137,carbs:243,fat:62,fiber:31,water:2.5,steps:7015,cardio:0},
  {date:"2026-04-18",bodyweight:77.7,calories:2529,protein:174,carbs:328,fat:58,fiber:33,water:3.1,steps:5302,cardio:0},
  {date:"2026-04-19",bodyweight:77.4,calories:2380,protein:129,carbs:340,fat:56,fiber:13,water:1.9,steps:6624,cardio:40},
  {date:"2026-04-20",bodyweight:77.2,calories:2385,protein:152,carbs:307,fat:61,fiber:38,water:1.9,steps:7237,cardio:0},
  {date:"2026-04-21",bodyweight:77.6,calories:2072,protein:164,carbs:228,fat:56,fiber:20,water:2.6,steps:8195,cardio:60},
  {date:"2026-04-22",bodyweight:77.4,calories:2242,protein:154,carbs:290,fat:52,fiber:25,water:2.4,steps:7207,cardio:40},
  {date:"2026-04-23",bodyweight:77.5,calories:2258,protein:135,carbs:292,fat:61,fiber:19,water:2.2,steps:8236,cardio:40},
  {date:"2026-04-24",bodyweight:77.0,calories:2491,protein:115,carbs:373,fat:60,fiber:32,water:2.0,steps:6435,cardio:35},
  {date:"2026-04-25",bodyweight:77.1,calories:2417,protein:160,carbs:289,fat:69,fiber:22,water:2.4,steps:4075,cardio:0},
  {date:"2026-04-26",bodyweight:77.5,calories:2621,protein:153,carbs:365,fat:61,fiber:35,water:2.8,steps:6473,cardio:0},
  {date:"2026-04-27",bodyweight:77.4,calories:2006,protein:153,carbs:216,fat:59,fiber:28,water:2.7,steps:8699,cardio:0},
  {date:"2026-04-28",bodyweight:77.4,calories:2448,protein:160,carbs:340,fat:50,fiber:20,water:2.9,steps:7233,cardio:40},
  {date:"2026-04-29",bodyweight:77.0,calories:1859,protein:132,carbs:186,fat:65,fiber:26,water:2.6,steps:6796,cardio:0},
  {date:"2026-04-30",bodyweight:77.3,calories:2522,protein:171,carbs:298,fat:72,fiber:19,water:4.0,steps:6202,cardio:40},
  {date:"2026-05-01",bodyweight:76.8,calories:2083,protein:158,carbs:192,fat:76,fiber:21,water:2.6,steps:9605,cardio:25},
  {date:"2026-05-02",bodyweight:77.2,calories:2349,protein:153,carbs:292,fat:63,fiber:27,water:2.7,steps:7309,cardio:0},
  {date:"2026-05-03",bodyweight:77.0,calories:2371,protein:150,carbs:303,fat:62,fiber:28,water:2.7,steps:7926,cardio:20},
  {date:"2026-05-04",bodyweight:77.5,calories:2097,protein:134,carbs:258,fat:59,fiber:27,water:2.1,steps:9924,cardio:0},
];

const MOCK_GOALS: Goals = {
  mode: 'cut',
  startWeight: null,
  startWeightMode: 'auto',
  targetWeight: 75,
  targetRatePerWeek: -0.5,
  targetDate: '2026-07-01',
  maintenanceKcal: 2700,
  maintenanceMode: 'auto',
  kcalAdjPerDay: -550,
  balanceKcal: 2150,
  proteinPerKg: 2.0,
  proteinPct: null,
  proteinTarget: 154,
  proteinUnit: 'gkg',
  fatPerKg: 0.9,
  fatPct: null,
  fatTarget: 69,
  fatUnit: 'gkg',
  carbsPerKg: 3.0,
  carbsPct: null,
  carbsTarget: 231,
  carbsUnit: 'gkg',
  kcalTarget: 2150,
  fiberTarget: 25,
  cardioTarget: 30,
  waterTarget: 2.5,
  stepsTarget: 8000,
};

export interface NutritionDataState {
  rows: NutritionRow[];
  goals: Goals;
  refeeds: Set<string>;
  loading: boolean;
  error: string | null;
}

interface UserOverride {
  scriptUrl: string;
  sheetId: string;
}

export function useNutritionData(userOverride?: UserOverride) {
  const { user } = useUser();

  const effectiveScriptUrl = userOverride?.scriptUrl ?? user?.scriptUrl ?? null;
  const effectiveSheetId   = userOverride?.sheetId   ?? user?.sheetId   ?? null;
  const effectiveCtx = { scriptUrl: effectiveScriptUrl, sheetId: effectiveSheetId };

  const [state, setState] = useState<NutritionDataState>({
    rows: [],
    goals: EMPTY_GOALS,
    refeeds: new Set(),
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    // Mock mode: demo user with fake scriptUrl
    if (effectiveScriptUrl === 'mock_url') {
      setState({ rows: MOCK_ROWS, goals: MOCK_GOALS, refeeds: new Set(), loading: false, error: null });
      return;
    }
    if (!effectiveScriptUrl || !effectiveSheetId) {
      setState(s => ({ ...s, loading: false, error: 'Sin configuración de atleta.' }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const [rows, goals, refeeds] = await Promise.all([
        fetchNutritionHistory(effectiveCtx, 500),
        fetchGoals(effectiveCtx).catch(() => EMPTY_GOALS),
        fetchRefeeds(effectiveCtx).catch(() => new Set<string>()),
      ]);
      setState({ rows, goals, refeeds, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido.';
      setState(s => ({ ...s, loading: false, error: msg }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveScriptUrl, effectiveSheetId]);

  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveScriptUrl, effectiveSheetId]);

  return { ...state, refetch, setState, effectiveCtx };
}
