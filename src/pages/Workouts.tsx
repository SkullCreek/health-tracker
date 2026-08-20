import { useState, useEffect } from 'react';
import { Plus, Play, Dumbbell, X, Check, History, Clock, Trash2 } from 'lucide-react';
import { getWorkoutLogs, getExercises, createExercise, startWorkoutLog, addWorkoutSet, getWorkoutSplits, createWorkoutSplit, getExerciseHistory, deleteWorkoutLog, deleteWorkoutSet, deleteWorkoutSplit } from '../lib/api';
import type { WorkoutLog, Exercise, WorkoutSplit, WorkoutSet } from '../lib/api';
import './Workouts.css';

const Workouts = () => {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showAddSplitModal, setShowAddSplitModal] = useState(false);
  const [showActiveWorkoutModal, setShowActiveWorkoutModal] = useState(false);

  // Forms
  const [newExercise, setNewExercise] = useState({ name: '', is_weighted: true });
  const [newSplitName, setNewSplitName] = useState('');

  // Active Workout State
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [currentSet, setCurrentSet] = useState(1);
  const [reps, setReps] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  
  // Immersive features
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);
  const [restTimer, setRestTimer] = useState<number>(0);
  const [activeWorkoutSets, setActiveWorkoutSets] = useState<WorkoutSet[]>([]);

  const fetchData = async () => {
    try {
      const [fetchedLogs, fetchedExercises, fetchedSplits] = await Promise.all([
        getWorkoutLogs(),
        getExercises(),
        getWorkoutSplits()
      ]);
      setLogs(fetchedLogs);
      setExercises(fetchedExercises);
      setSplits(fetchedSplits);
    } catch (error) {
      console.error('Error fetching workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timer Countdown
  useEffect(() => {
    let interval: any = null;
    if (restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => prev - 1);
      }, 1000);
    } else if (restTimer === 0 && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const fetchHistory = async (exerciseId: string) => {
    try {
      const history = await getExerciseHistory(exerciseId);
      setExerciseHistory(history);
    } catch (error) {
      console.error("Failed to fetch history");
    }
  }

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExercise(newExercise.name, newExercise.is_weighted);
      setShowAddExerciseModal(false);
      setNewExercise({ name: '', is_weighted: true });
      fetchData();
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
  };

  const handleCreateSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorkoutSplit(newSplitName);
      setShowAddSplitModal(false);
      setNewSplitName('');
      fetchData();
    } catch (error) {
      console.error('Error creating split:', error);
    }
  };

  const handleStartWorkout = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const log = await startWorkoutLog(today);
      setActiveLogId(log.id);
      setActiveWorkoutSets([]);
      setShowActiveWorkoutModal(true);
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  const handleLogSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLogId || !selectedExercise) return;
    
    try {
      const exercise = exercises.find(ex => ex.id === selectedExercise);
      const weightVal = exercise?.is_weighted ? Number(weight) : null;
      
      const newSet = await addWorkoutSet(activeLogId, selectedExercise, currentSet, Number(reps), weightVal);
      setActiveWorkoutSets(prev => [...prev, newSet]);
      setCurrentSet(prev => prev + 1);
      setRestTimer(60); // Start 60s rest timer automatically
      fetchHistory(selectedExercise); // Refresh history
    } catch (error) {
      console.error('Error logging set:', error);
    }
  };

  const handleDeleteActiveSet = async (setId: string) => {
    if (!window.confirm("Are you sure you want to delete this set?")) return;
    try {
      await deleteWorkoutSet(setId);
      setActiveWorkoutSets(prev => prev.filter(s => s.id !== setId));
      // Re-adjust set numbers locally just in UI for simplicity
      setCurrentSet(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm("Are you sure you want to delete this workout session?")) return;
    try {
      await deleteWorkoutLog(logId);
      fetchData();
    } catch (error) {
      console.error('Error deleting workout log:', error);
    }
  }

  const handleDeleteRoutine = async (e: React.MouseEvent, splitId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this routine?")) return;
    try {
      await deleteWorkoutSplit(splitId);
      fetchData();
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  }

  const finishWorkout = () => {
    setShowActiveWorkoutModal(false);
    setActiveLogId(null);
    setCurrentSet(1);
    setSelectedExercise('');
    setReps('');
    setWeight('');
    setRestTimer(0);
    setActiveWorkoutSets([]);
    fetchData();
  };

  if (loading) return <div>Loading workouts...</div>;

  return (
    <div className="workouts-page">
      <div className="workouts-header">
        <button className="btn btn-primary start-workout-btn" onClick={handleStartWorkout}>
          <Play size={20} fill="currentColor" />
          <span>Start Empty Workout</span>
        </button>
        <button className="btn btn-secondary add-workout-btn" onClick={() => setShowAddExerciseModal(true)}>
          <Plus size={20} />
          <span>Custom Exercise</span>
        </button>
      </div>

      <div className="routines-section">
        <div className="section-header">
          <h3>My Routines</h3>
          <button className="btn btn-text text-primary" onClick={() => setShowAddSplitModal(true)}>
            <Plus size={16}/> New Routine
          </button>
        </div>
        <div className="routines-grid">
          {splits.map(split => (
            <div key={split.id} className="routine-card glass-panel" onClick={handleStartWorkout} style={{ position: 'relative' }}>
              <button 
                className="delete-btn" 
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.25rem' }} 
                onClick={(e) => handleDeleteRoutine(e, split.id)}
              >
                <Trash2 size={14}/>
              </button>
              <h4>{split.name}</h4>
              <p className="text-muted text-sm mt-1">Tap to start</p>
            </div>
          ))}
          {splits.length === 0 && (
            <p className="empty-state">No routines created yet.</p>
          )}
        </div>
      </div>

      <div className="recent-workouts">
        <h3>Recent Workouts</h3>
        {logs.length === 0 ? (
          <p className="empty-state">No workouts logged yet.</p>
        ) : (
          <div className="workouts-list">
            {logs.map(log => (
              <div key={log.id} className="workout-card glass-panel">
                <div className="workout-card-header">
                  <div className="workout-title-group">
                    <div className="workout-icon">
                      <Dumbbell size={20} color="var(--accent-secondary)" />
                    </div>
                    <div>
                      <h4>Workout Session</h4>
                      <span className="workout-date">{log.date}</span>
                    </div>
                  </div>
                  <button className="delete-btn" onClick={() => handleDeleteLog(log.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {log.workout_sets && log.workout_sets.length > 0 && (
                  <div className="workout-details">
                    <table className="sets-table">
                      <thead>
                        <tr>
                          <th>Exercise</th>
                          <th>Set</th>
                          <th>Weight</th>
                          <th>Reps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {log.workout_sets.map(set => (
                          <tr key={set.id}>
                            <td>{set.exercises?.name}</td>
                            <td>{set.set_number}</td>
                            <td>{set.weight !== null ? `${set.weight} kg` : '-'}</td>
                            <td>{set.reps}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Split Modal */}
      {showAddSplitModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>Create Routine</h3>
              <button className="close-btn" onClick={() => setShowAddSplitModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateSplit} className="modal-form">
              <input 
                className="input-field" 
                placeholder="Routine Name (e.g. Push Day)" 
                required 
                value={newSplitName} 
                onChange={e => setNewSplitName(e.target.value)} 
              />
              <button type="submit" className="btn btn-primary w-100 mt-3">Save Routine</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>Create Custom Exercise</h3>
              <button className="close-btn" onClick={() => setShowAddExerciseModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateExercise} className="modal-form">
              <input 
                className="input-field" 
                placeholder="Exercise Name (e.g. Bench Press)" 
                required 
                value={newExercise.name} 
                onChange={e => setNewExercise({...newExercise, name: e.target.value})} 
              />
              <label className="checkbox-label mt-3">
                <input 
                  type="checkbox" 
                  checked={newExercise.is_weighted} 
                  onChange={e => setNewExercise({...newExercise, is_weighted: e.target.checked})} 
                />
                Is this a weighted exercise? (Uncheck for bodyweight)
              </label>
              <button type="submit" className="btn btn-primary w-100 mt-3">Save Exercise</button>
            </form>
          </div>
        </div>
      )}

      {/* Active Workout Logger Modal - Full Screen */}
      {showActiveWorkoutModal && (
        <div className="modal-overlay full-screen">
          <div className="modal-content full-screen-content glass-panel">
            <div className="modal-header">
              <div className="timer-badge">
                <Clock size={16} />
                <span>{restTimer > 0 ? `Rest: ${restTimer}s` : 'Active'}</span>
              </div>
              <button className="btn btn-success finish-btn" onClick={finishWorkout}>
                <Check size={16}/> Finish Workout
              </button>
            </div>
            
            <div className="active-workout-form">
              <label className="input-label">Select Exercise</label>
              <select 
                className="input-field mb-4" 
                value={selectedExercise} 
                onChange={(e) => {
                  setSelectedExercise(e.target.value);
                  setCurrentSet(1); 
                  fetchHistory(e.target.value);
                }}
                required
              >
                <option value="" disabled>Select an exercise...</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>

              {selectedExercise && (
                <div className="exercise-workspace">
                  
                  {activeWorkoutSets.length > 0 && (
                    <div className="active-sets">
                      <h4 className="flex-align">Logged So Far</h4>
                      <table className="sets-table mt-1">
                        <tbody>
                          {activeWorkoutSets.filter(s => s.exercise_id === selectedExercise).map(set => (
                            <tr key={set.id}>
                              <td>Set {set.set_number}</td>
                              <td>{set.weight !== null ? `${set.weight} kg` : '-'}</td>
                              <td>{set.reps} reps</td>
                              <td style={{textAlign: 'right'}}>
                                <button className="delete-btn" onClick={() => handleDeleteActiveSet(set.id)}><Trash2 size={14}/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <form onSubmit={handleLogSet} className="set-logger">
                    <h4>Log Set {currentSet}</h4>
                    <div className="macros-inputs">
                      {exercises.find(e => e.id === selectedExercise)?.is_weighted && (
                        <input 
                          type="number" 
                          className="input-field" 
                          placeholder="Weight (kg/lbs)" 
                          required 
                          value={weight} 
                          onChange={e => setWeight(+e.target.value)} 
                        />
                      )}
                      <input 
                        type="number" 
                        className="input-field" 
                        placeholder="Reps" 
                        required 
                        value={reps} 
                        onChange={e => setReps(+e.target.value)} 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 mt-3">Log Set</button>
                  </form>

                  <div className="history-panel">
                    <h4 className="flex-align"><History size={16}/> Past Performance</h4>
                    {exerciseHistory.length > 0 ? (
                      <ul className="history-list">
                        {exerciseHistory.map(h => (
                          <li key={h.id}>
                            <span className="text-muted">{h.workout_logs?.date}:</span> 
                            {h.weight !== null ? ` ${h.weight}kg × ` : ' '}{h.reps} reps (Set {h.set_number})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted text-sm mt-1">No previous history.</p>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;
