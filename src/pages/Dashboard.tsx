import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Dumbbell, Droplets } from 'lucide-react';
import { getRecentMealLogs, getRecentWorkoutLogs } from '../lib/api';
import type { MealLog, WorkoutLog } from '../lib/api';
import './Dashboard.css';

const ProgressRing = ({ progress, color, icon: Icon, label, value, max }: any) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(progress, 100);
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="progress-ring-container glass-panel">
      <div className="progress-ring-header">
        <Icon size={20} color={color} />
        <span>{label}</span>
      </div>
      <div className="progress-ring-wrapper">
        <svg height="100" width="100" className="progress-ring">
          <circle
            stroke="var(--bg-color-tertiary)"
            strokeWidth="8"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />
        </svg>
        <div className="progress-value">
          <span className="value">{value}</span>
          <span className="max">/ {max}</span>
        </div>
      </div>
    </div>
  );
};

const MacroBar = ({ label, current, target, color }: any) => {
  const progress = Math.min((current / target) * 100, 100);
  return (
    <div className="macro-bar">
      <div className="macro-bar-header">
        <span>{label}</span>
        <span>{current} / {target}g</span>
      </div>
      <div className="macro-progress-bg">
        <div 
          className="macro-progress-fill" 
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

const Dashboard = () => {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentMeals, recentWorkouts] = await Promise.all([
          getRecentMealLogs(7),
          getRecentWorkoutLogs(7)
        ]);
        setMeals(recentMeals);
        setWorkouts(recentWorkouts);
      } catch (error) {
        console.error("Error fetching dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    // Generate last 7 days including today
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayMeals = meals.filter(m => m.date === dateStr);
      const calories = dayMeals.reduce((sum, m) => sum + (m.food_items?.calories || 0), 0);
      
      const dayWorkouts = workouts.filter(w => w.date === dateStr);
      // Let's plot active minutes (default to 45 mins if not logged or just count workouts)
      // For now we'll plot number of workouts * 45 for visual scale, or actual duration if available.
      const activeTime = dayWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 45), 0);

      data.push({ name: dayName, calories, activeTime });
    }
    return data;
  }, [meals, workouts]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter(m => m.date === todayStr);
  const todayWorkouts = workouts.filter(w => w.date === todayStr);

  const todayCalories = todayMeals.reduce((sum, m) => sum + (m.food_items?.calories || 0), 0);
  const todayProtein = todayMeals.reduce((sum, m) => sum + (m.food_items?.protein || 0), 0);
  const todayCarbs = todayMeals.reduce((sum, m) => sum + (m.food_items?.carbs || 0), 0);
  const todayFat = todayMeals.reduce((sum, m) => sum + (m.food_items?.fat || 0), 0);

  const calProgress = (todayCalories / 2500) * 100;
  const workoutProgress = (todayWorkouts.length / 1) * 100;

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <ProgressRing 
          progress={calProgress} 
          color="var(--warning)" 
          icon={Flame} 
          label="Calories" 
          value={todayCalories} 
          max="2500" 
        />
        <ProgressRing 
          progress={workoutProgress} 
          color="var(--accent-secondary)" 
          icon={Dumbbell} 
          label="Workouts Today" 
          value={todayWorkouts.length} 
          max="1" 
        />
        <ProgressRing 
          progress={40} 
          color="var(--accent-primary)" 
          icon={Droplets} 
          label="Water (L)" 
          value="1.2" 
          max="3.0" 
        />
      </div>

      <div className="macros-container glass-panel">
        <h3>Daily Macros</h3>
        <div className="macro-bars-wrapper">
          <MacroBar label="Protein" current={todayProtein} target={150} color="#3b82f6" />
          <MacroBar label="Carbs" current={todayCarbs} target={250} color="#10b981" />
          <MacroBar label="Fat" current={todayFat} target={80} color="#f59e0b" />
        </div>
      </div>

      <div className="chart-container glass-panel">
        <div className="chart-header">
          <h3>Weekly Overview</h3>
        </div>
        <div className="chart-wrapper">
          {/* Setting min-height prevents ResponsiveContainer from collapsing to 0 */}
          <div style={{ width: '100%', height: 300, minHeight: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActiveTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-color-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="calories" stroke="var(--warning)" fillOpacity={1} fill="url(#colorCalories)" name="Calories" />
                <Area yAxisId="right" type="monotone" dataKey="activeTime" stroke="var(--accent-secondary)" fillOpacity={1} fill="url(#colorActiveTime)" name="Active Min" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
