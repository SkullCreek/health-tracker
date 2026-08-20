import { useState, useEffect } from 'react';
import { Plus, Apple, X, Trash2 } from 'lucide-react';
import { getFoodItems, getMealLogs, createFoodItem, logMeal, deleteMealLog } from '../lib/api';
import type { FoodItem, MealLog } from '../lib/api';
import './Nutrition.css';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const Nutrition = () => {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<string>('Snacks');
  
  // Custom Food Form
  const [newFood, setNewFood] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });

  const fetchNutritionData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [fetchedMeals, fetchedFoods] = await Promise.all([
        getMealLogs(today),
        getFoodItems()
      ]);
      setMeals(fetchedMeals);
      setFoodItems(fetchedFoods);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFoodItem(newFood);
      setShowAddFoodModal(false);
      setNewFood({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
      fetchNutritionData();
    } catch (error) {
      console.error('Error creating food:', error);
    }
  };

  const handleLogMeal = async (foodId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await logMeal(foodId, today, activeMealType);
      setShowLogModal(false);
      fetchNutritionData();
    } catch (error) {
      console.error('Error logging meal:', error);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await deleteMealLog(id);
      fetchNutritionData();
    } catch (error) {
      console.error('Error deleting meal log:', error);
    }
  };

  const openLogModal = (mealType: string) => {
    setActiveMealType(mealType);
    setShowLogModal(true);
  }

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.food_items?.calories || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.food_items?.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.food_items?.carbs || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.food_items?.fat || 0), 0);

  if (loading) return <div>Loading nutrition data...</div>;

  return (
    <div className="nutrition-page">
      <div className="nutrition-header">
        <div className="nutrition-summary glass-panel">
          <div className="summary-item">
            <span className="label">Calories Eaten</span>
            <span className="value text-gradient">{totalCalories}</span>
          </div>
          <div className="summary-macros">
            <div className="macro"><span>P:</span> {totalProtein}g</div>
            <div className="macro"><span>C:</span> {totalCarbs}g</div>
            <div className="macro"><span>F:</span> {totalFat}g</div>
          </div>
        </div>
      </div>

      <div className="actions-bar">
        <button className="btn btn-secondary w-100" onClick={() => setShowAddFoodModal(true)}>
          <Plus size={20} />
          <span>Create Custom Food</span>
        </button>
      </div>

      <div className="meals-list">
        {MEAL_TYPES.map(mealType => {
          const typeMeals = meals.filter(m => (m.meal_type || 'Snacks') === mealType);
          const typeCals = typeMeals.reduce((sum, m) => sum + (m.food_items?.calories || 0), 0);

          return (
            <div key={mealType} className="meal-category glass-panel">
              <div className="meal-category-header">
                <div>
                  <h3>{mealType}</h3>
                  <span className="text-muted">{typeCals} kcal</span>
                </div>
                <button className="icon-btn" onClick={() => openLogModal(mealType)}>
                  <Plus size={24} color="var(--accent-primary)" />
                </button>
              </div>

              {typeMeals.length > 0 && (
                <div className="meals-grid mt-3">
                  {typeMeals.map(meal => (
                    <div key={meal.id} className="meal-card">
                      <div className="meal-icon">
                        <Apple size={20} color="var(--success)" />
                      </div>
                      <div className="meal-info">
                        <h4>{meal.food_items?.name}</h4>
                        <div className="meal-macros">
                          <span>P: {meal.food_items?.protein}g</span> • 
                          <span>C: {meal.food_items?.carbs}g</span> • 
                          <span>F: {meal.food_items?.fat}g</span>
                        </div>
                      </div>
                      <div className="meal-calories">
                        <span className="cal-value">{meal.food_items?.calories}</span>
                        <span className="cal-label">kcal</span>
                      </div>
                      <button className="delete-btn" onClick={() => handleDeleteMeal(meal.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showAddFoodModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>Create Custom Food</h3>
              <button className="close-btn" onClick={() => setShowAddFoodModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateFood} className="modal-form">
              <input className="input-field" placeholder="Food Name" required value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} />
              <div className="macros-inputs">
                <input type="number" className="input-field" placeholder="Calories" required value={newFood.calories || ''} onChange={e => setNewFood({...newFood, calories: +e.target.value})} />
                <input type="number" className="input-field" placeholder="Protein (g)" required value={newFood.protein || ''} onChange={e => setNewFood({...newFood, protein: +e.target.value})} />
                <input type="number" className="input-field" placeholder="Carbs (g)" required value={newFood.carbs || ''} onChange={e => setNewFood({...newFood, carbs: +e.target.value})} />
                <input type="number" className="input-field" placeholder="Fat (g)" required value={newFood.fat || ''} onChange={e => setNewFood({...newFood, fat: +e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary w-100">Save Food</button>
            </form>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>Add to {activeMealType}</h3>
              <button className="close-btn" onClick={() => setShowLogModal(false)}><X size={20}/></button>
            </div>
            <div className="food-selector-list">
              {foodItems.map(food => (
                <div key={food.id} className="food-selector-item" onClick={() => handleLogMeal(food.id)}>
                  <div>
                    <h4>{food.name}</h4>
                    <span className="text-muted">{food.calories} kcal (P: {food.protein}g, C: {food.carbs}g, F: {food.fat}g)</span>
                  </div>
                  <Plus size={20} className="text-primary" />
                </div>
              ))}
              {foodItems.length === 0 && <p>No custom foods found. Create one first!</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nutrition;
