import { supabase } from './supabase';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLog {
  id: string;
  food_item_id: string;
  date: string;
  meal_type?: string;
  food_items?: FoodItem;
}

export interface Exercise {
  id: string;
  name: string;
  is_weighted: boolean;
}

export interface WorkoutSplit {
  id: string;
  name: string;
}

export interface WorkoutSet {
  id: string;
  log_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight: number | null;
  exercises?: { name: string };
}

export interface WorkoutLog {
  id: string;
  date: string;
  duration_minutes: number;
  workout_sets?: WorkoutSet[];
}

// Nutrition
export const getFoodItems = async () => {
  const { data, error } = await supabase.from('food_items').select('*').order('name');
  if (error) throw error;
  return data as FoodItem[];
};

export const createFoodItem = async (food: Omit<FoodItem, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not logged in');

  const { data, error } = await supabase.from('food_items').insert({ ...food, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
};

export const getMealLogs = async (date: string) => {
  const { data, error } = await supabase
    .from('meal_logs')
    .select('*, food_items(*)')
    .eq('date', date);
  if (error) throw error;
  return data as MealLog[];
};

export const getRecentMealLogs = async (days = 7) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const dateStr = date.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('meal_logs')
    .select('*, food_items(*)')
    .gte('date', dateStr)
    .order('date', { ascending: true });
  if (error) throw error;
  return data as MealLog[];
};

export const logMeal = async (food_item_id: string, date: string, meal_type: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not logged in');

  const { data, error } = await supabase
    .from('meal_logs')
    .insert({ food_item_id, date, meal_type, user_id: user.id })
    .select('*, food_items(*)')
    .single();
  if (error) throw error;
  return data;
};

export const deleteMealLog = async (id: string) => {
  const { error } = await supabase.from('meal_logs').delete().eq('id', id);
  if (error) throw error;
};

// Workouts
export const getExercises = async () => {
  const { data, error } = await supabase.from('exercises').select('*').order('name');
  if (error) throw error;
  return data as Exercise[];
};

export const createExercise = async (name: string, is_weighted: boolean) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not logged in');

  const { data, error } = await supabase.from('exercises').insert({ name, is_weighted, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
};

export const getWorkoutLogs = async () => {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*, workout_sets(*, exercises(name))')
    .order('date', { ascending: false });
  if (error) throw error;
  return data as WorkoutLog[];
};

export const getRecentWorkoutLogs = async (days = 7) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const dateStr = date.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .gte('date', dateStr)
    .order('date', { ascending: true });
  if (error) throw error;
  return data as WorkoutLog[];
};

export const getWorkoutSplits = async () => {
  const { data, error } = await supabase.from('workout_splits').select('*').order('created_at');
  if (error) throw error;
  return data as WorkoutSplit[];
};

export const createWorkoutSplit = async (name: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not logged in');

  const { data, error } = await supabase.from('workout_splits').insert({ name, user_id: user.id }).select().single();
  if (error) throw error;
  return data as WorkoutSplit;
};

export const getExerciseHistory = async (exercise_id: string, limit = 5) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not logged in');

  const { data, error } = await supabase
    .from('workout_sets')
    .select('*, workout_logs(date)')
    .eq('exercise_id', exercise_id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

export const startWorkoutLog = async (date: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not logged in');

  const { data, error } = await supabase.from('workout_logs').insert({ date, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
};

export const deleteWorkoutLog = async (id: string) => {
  const { error } = await supabase.from('workout_logs').delete().eq('id', id);
  if (error) throw error;
};

export const addWorkoutSet = async (log_id: string, exercise_id: string, set_number: number, reps: number, weight: number | null) => {
  const { data, error } = await supabase.from('workout_sets').insert({
    log_id, exercise_id, set_number, reps, weight
  }).select('*, exercises(name)').single();
  if (error) throw error;
  return data;
};

export const deleteWorkoutSet = async (id: string) => {
  const { error } = await supabase.from('workout_sets').delete().eq('id', id);
  if (error) throw error;
};
