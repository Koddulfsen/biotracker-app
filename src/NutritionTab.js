import React, { useState, useRef, useEffect } from 'react';
import './NutritionTab.css';
import BarcodeScanner from './components/BarcodeScanner';
import { fetchProductByBarcode, parseProductData } from './services/foodAPI';
import { useAuth } from './contexts/SupabaseAuthContext';
import { mealService, scanService, userService } from './services/dataService';

// --- Data from original app ---
const FOODS = ['🥬 Spinach', '🍊 Orange', '🥛 Milk', '🥩 Beef', '🐟 Salmon', '🥜 Almonds', '🥦 Broccoli', '🍠 Sweet Potato', '🫘 Black Beans', '🍞 Bread'];
const FOOD_DATABASE = FOODS;
const SERVING_UNITS = ['cup', 'g', 'ml', 'oz', 'tbsp', 'tsp', 'pc', 'slice'];
const CONV = { cup: 0.3, g: 0.01, oz: 0.284, tbsp: 0.075, tsp: 0.025, ml: 0.01, default: 0.3 };


const defaultMeals = [
  { key: 'breakfast', name: 'Breakfast' },
  { key: 'lunch', name: 'Lunch' },
  { key: 'dinner', name: 'Dinner' },
  { key: 'snack-1', name: 'Snack 1' },
  { key: 'snack-2', name: 'Snack 2' },
];

// Nutrient group structure (simplified for now)
const nutrientGroups = [
  { name: 'Fats', nutrients: [
    { name: 'Total Fat' },
    { name: 'Saturated Fat', children: ['Lauric acid (12:0) (MCT)', 'Myristic acid (14:0)', 'Palmitic acid (16:0)', 'Stearic acid (18:0)'] },
    { name: 'Monounsaturated Fat', children: ['Oleic acid (18:1)'] },
    { name: 'Polyunsaturated Fat', children: ['Linoleic acid (LA, 18:2)', 'α-Linolenic acid (ALA, 18:3)'] },
    { name: 'Trans Fatty Acids' },
    { name: 'Cholesterol' },
  ]},
  { name: 'Carbohydrates', nutrients: [
    { name: 'Total Carbohydrates' },
    { name: 'Sugars', children: ['Glucose', 'Fructose', 'Galactose', 'Sucrose', 'Lactose', 'Maltose'] },
    { name: 'Starch' },
  ]},
  { name: 'Proteins', nutrients: [
    { name: 'Total Protein' },
    { name: 'Essential Amino Acids (EAAs)', children: ['Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine + Cysteine', 'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine'] },
    { name: 'Non-Essential Amino Acids', children: ['Arginine', 'Cysteine', 'Glutamine', 'Glycine', 'Proline', 'Tyrosine', 'Alanine', 'Asparagine', 'Aspartic acid', 'Glutamic acid', 'Serine'] },
  ]},
  { name: 'Fiber', nutrients: ['Fiber'] },
  { name: 'Vitamins', nutrients: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K'] },
  { name: 'B-Vitamins', nutrients: ['Thiamin (B1)', 'Riboflavin (B2)', 'Niacin (B3)', 'Pantothenic Acid (B5)', 'Vitamin B6', 'Biotin (B7)', 'Folate (B9)', 'Cobalamin (B12)', 'Choline'] },
  { name: 'Minerals', nutrients: ['Sodium', 'Potassium', 'Chloride', 'Calcium', 'Phosphorus', 'Magnesium', 'Sulfur'] },
  { name: 'Trace Elements', nutrients: ['Iron', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Iodine', 'Chromium', 'Molybdenum', 'Fluoride', 'Boron', 'Cobalt', 'Nickel', 'Silicon', 'Vanadium', 'Tin', 'Lithium'] },
  { name: 'Heavy Metals', nutrients: ['Lead', 'Mercury', 'Cadmium', 'Arsenic', 'Aluminum'] },
];

// Nutrient keys for lookup
const NUTRIENT_KEYS = {
  'Total Fat': 'totalFat',
  'Saturated Fat': 'saturatedFat',
  'Monounsaturated Fat': 'monounsaturatedFat',
  'Polyunsaturated Fat': 'polyunsaturatedFat',
  'Trans Fatty Acids': 'transFattyAcids',
  'Cholesterol': 'cholesterol',
  'Total Carbohydrates': 'totalCarbohydrates',
  'Sugars': 'sugars',
  'Starch': 'starch',
  'Total Protein': 'totalProtein',
  'Essential Amino Acids (EAAs)': 'eaa',
  'Non-Essential Amino Acids': 'neaa',
  'Fiber': 'fiberTotal',
  'Vitamin A': 'vitaminA',
  'Vitamin C': 'vitaminC',
  'Vitamin D': 'vitaminD',
  'Vitamin E': 'vitaminE',
  'Vitamin K': 'vitaminK',
  'Thiamin (B1)': 'thiamin',
  'Riboflavin (B2)': 'riboflavin',
  'Niacin (B3)': 'niacin',
  'Pantothenic Acid (B5)': 'pantothenicAcid',
  'Vitamin B6': 'vitaminB6',
  'Biotin (B7)': 'biotin',
  'Folate (B9)': 'folate',
  'Cobalamin (B12)': 'vitaminB12',
  'Choline': 'choline',
  'Sodium': 'sodium',
  'Potassium': 'potassium',
  'Chloride': 'chloride',
  'Calcium': 'calcium',
  'Phosphorus': 'phosphorus',
  'Magnesium': 'magnesium',
  'Sulfur': 'sulfur',
  'Iron': 'iron',
  'Zinc': 'zinc',
  'Copper': 'copper',
  'Manganese': 'manganese',
  'Selenium': 'selenium',
  'Iodine': 'iodine',
  'Chromium': 'chromium',
  'Molybdenum': 'molybdenum',
  'Fluoride': 'fluoride',
  'Boron': 'boron',
  'Cobalt': 'cobalt',
  'Nickel': 'nickel',
  'Silicon': 'silicon',
  'Vanadium': 'vanadium',
  'Tin': 'tin',
  'Lithium': 'lithium',
  'Lead': 'lead',
  'Mercury': 'mercury',
  'Cadmium': 'cadmium',
  'Arsenic': 'arsenic',
  'Aluminum': 'aluminum',
};


function NutritionTab() {
  // --- Auth State ---
  const { user: currentUser } = useAuth();
  
  // --- State ---
  const [meals, setMeals] = useState(defaultMeals);
  const [currentMealKey, setCurrentMealKey] = useState(meals[0].key);
  const [mealContents, setMealContents] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    'snack-1': [],
    'snack-2': [],
  });
  const [selectedFood, setSelectedFood] = useState(null);
  const [servingAmount, setServingAmount] = useState(1);
  const [servingUnit, setServingUnit] = useState('cup');
  const [editingFoodIndex, setEditingFoodIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [selectedMeals, setSelectedMeals] = useState(meals.map(m => m.key));
  const [bioavailabilityEnabled, setBioavailabilityEnabled] = useState(true);
  const [userAge, setUserAge] = useState('19-30');
  const [userSex, setUserSex] = useState('male');
  const [filters, setFilters] = useState({ cook: 'boiled', process: 'frozen', quality: 'organic' });
  const searchInputRef = useRef();
  const [expandedGroups, setExpandedGroups] = useState(
    nutrientGroups.reduce((acc, group) => ({ ...acc, [group.name]: true }), {})
  );
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const [expandedSub, setExpandedSub] = useState({});
  const [editingMealKey, setEditingMealKey] = useState(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [savingMeal, setSavingMeal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [firestoreMealIds, setFirestoreMealIds] = useState({});

  // --- Effects ---
  // Load user profile and meals on mount
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    } else {
      setLoadingMeals(false);
    }
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingMeals(true);
      
      // Load user profile
      const profile = await userService.getProfile(currentUser.id);
      setUserProfile(profile);
      
      // Load today's meals
      const today = new Date();
      const userMeals = await mealService.getMeals(currentUser.id, today);
      
      // Convert meals to mealContents format
      const loadedMealContents = {
        breakfast: [],
        lunch: [],
        dinner: [],
        'snack-1': [],
        'snack-2': [],
      };
      const mealIds = {};
      
      userMeals.forEach(meal => {
        if (meal.mealType && meal.foods) {
          loadedMealContents[meal.mealType] = meal.foods.map(food => 
            `${food.name}: ${food.amount} ${food.unit}`
          );
          mealIds[meal.mealType] = meal.id;
        }
      });
      
      setMealContents(loadedMealContents);
      setFirestoreMealIds(mealIds);
    } catch (error) {
      console.error('Error loading user data:', error);
      setScanError('Failed to load your data. Please refresh.');
    } finally {
      setLoadingMeals(false);
    }
  };

  // --- Handlers ---
  // Meal management
  const addMeal = () => {
    const newKey = `custom-meal-${Date.now()}`;
    const customMeals = meals.filter(m => m.key.startsWith('custom-meal-'));
    const newName = `New meal ${customMeals.length + 1}`;
    setMeals([...meals, { key: newKey, name: newName }]);
    setMealContents({ ...mealContents, [newKey]: [] });
    setCurrentMealKey(newKey);
    setSelectedMeals(prevSelected => [...prevSelected, newKey]);
  };
  const removeMeal = (key) => {
    if (meals.length <= 1) return;
    const newMeals = meals.filter(m => m.key !== key);
    
    // Renumber remaining custom meals
    const updatedMeals = newMeals.map(meal => {
      if (meal.key.startsWith('custom-meal-')) {
        const customMeals = newMeals.filter(m => m.key.startsWith('custom-meal-'));
        const index = customMeals.indexOf(meal);
        return { ...meal, name: `New meal ${index + 1}` };
      }
      return meal;
    });

    const newMealContents = { ...mealContents };
    delete newMealContents[key];
    setMeals(updatedMeals);
    setMealContents(newMealContents);
    
    if (currentMealKey === key) {
      const currentIndex = meals.findIndex(m => m.key === key);
      const newSelectedIndex = Math.max(0, currentIndex - 1);
      setCurrentMealKey(updatedMeals[newSelectedIndex].key);
    }
  };
  const renameMeal = (key, newName) => {
    setMeals(meals.map(m => m.key === key ? { ...m, name: newName } : m));
  };

  // Food search
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim().length > 0) {
      const results = FOODS.filter(f => f.toLowerCase().includes(term.toLowerCase()));
      setSearchResults(results);
      setSearchVisible(true);
      setCurrentSearchIndex(-1);
    } else {
      setSearchResults([]);
      setSearchVisible(false);
      setCurrentSearchIndex(-1);
    }
  };
  const handleSearchFocus = () => {
    if (searchResults.length > 0) setSearchVisible(true);
  };
  const handleSearchBlur = () => {
    setTimeout(() => setSearchVisible(false), 100);
  };
  const handleSearchKeyDown = (e) => {
    if (!searchVisible) return;
    if (e.key === 'ArrowDown') {
      setCurrentSearchIndex(i => (i + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      setCurrentSearchIndex(i => (i <= 0 ? searchResults.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (currentSearchIndex >= 0) {
        selectFoodFromSearch(searchResults[currentSearchIndex]);
      } else if (searchResults.length === 1) {
        selectFoodFromSearch(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setSearchVisible(false);
    }
  };
  const selectFoodFromSearch = (food) => {
    setSelectedFood(food);
    setSearchTerm('');
    setSearchResults([]);
    setSearchVisible(false);
    setEditingFoodIndex(null);
    setServingAmount(1);
    setServingUnit('cup');
  };

  // Quick foods
  const handleQuickFoodClick = (food) => {
    setSelectedFood(food);
    setEditingFoodIndex(null);
    setSearchTerm('');
    setSearchResults([]);
    setSearchVisible(false);
    setServingAmount(1);
    setServingUnit('cup');
  };

  // Add/update food
  const handleAddFood = async () => {
    if (!selectedFood) return;
    const filterInfo = `${filters.cook}, ${filters.process}, ${filters.quality}`;
    const foodWithServing = `${selectedFood} (${servingAmount} ${servingUnit}, ${filterInfo})`;
    const items = mealContents[currentMealKey] || [];
    let newItems;
    if (editingFoodIndex !== null) {
      newItems = [...items];
      newItems[editingFoodIndex] = foodWithServing;
    } else {
      newItems = [...items, foodWithServing];
    }
    setMealContents({ ...mealContents, [currentMealKey]: newItems });
    
    // Save meal to Firestore
    if (currentUser) {
      await saveMealToFirestore(currentMealKey, newItems);
    }
    
    setSelectedFood(null);
    setEditingFoodIndex(null);
    setServingAmount(1);
    setServingUnit('cup');
  };

  // Add keydown event listener for the whole app
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle Enter if we have a selected food and we're not in a text input
      if (e.key === 'Enter' && selectedFood && e.target.tagName !== 'INPUT') {
        handleAddFood();
      }
      // Handle Escape to clear selected food when not in search
      if (e.key === 'Escape' && !searchVisible && selectedFood) {
        setSelectedFood(null);
        setEditingFoodIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFood, currentMealKey, editingFoodIndex, servingAmount, servingUnit, mealContents]);

  // Edit food
  const handleEditFood = (idx) => {
    if (editingFoodIndex === idx) {
      setSelectedFood(null);
      setEditingFoodIndex(null);
      return;
    }
    const item = mealContents[currentMealKey][idx];
    const match = item.match(/^(.*?) \((\d+(?:\.\d+)?) ([a-zA-Z]+), (.*?), (.*?), (.*?)\)$/);
    if (match) {
      setSelectedFood(match[1]);
      setServingAmount(Number(match[2]));
      setServingUnit(match[3]);
      setFilters({
        cook: match[4],
        process: match[5],
        quality: match[6]
      });
      setEditingFoodIndex(idx);
    }
  };
  // Remove food
  const handleRemoveFood = async (idx) => {
    const items = mealContents[currentMealKey] || [];
    const newItems = items.filter((_, i) => i !== idx);
    setMealContents({ ...mealContents, [currentMealKey]: newItems });
    
    // Save updated meal to Firestore
    if (currentUser) {
      await saveMealToFirestore(currentMealKey, newItems);
    }
    
    setSelectedFood(null);
    setEditingFoodIndex(null);
    setServingAmount(1);
    setServingUnit('cup');
  };

  // Handle barcode scan
  const handleBarcodeScan = async (barcode) => {
    // Check scan limit for free users
    if (currentUser && userProfile && userProfile.subscription.plan === 'freemium') {
      if (userProfile.subscription.scansToday >= 5) {
        setScanError('Daily scan limit reached. Upgrade to Pro for unlimited scans!');
        setShowBarcodeScanner(false);
        return;
      }
    }
    
    setShowBarcodeScanner(false);
    setScanLoading(true);
    setScanError(null);

    try {
      // Fetch product data from Open Food Facts
      const productData = await fetchProductByBarcode(barcode);
      const parsedFood = parseProductData(productData);

      // Create a food name with brand
      const foodName = parsedFood.brand 
        ? `${parsedFood.name} (${parsedFood.brand})`
        : parsedFood.name;

      // Add to selected food
      setSelectedFood(foodName);
      setEditingFoodIndex(null);
      setSearchTerm('');
      setSearchResults([]);
      setSearchVisible(false);
      
      // Set default serving size from product or use 100g
      const servingMatch = parsedFood.servingSize.match(/(\d+)\s*(\w+)/);
      if (servingMatch) {
        setServingAmount(Number(servingMatch[1]));
        setServingUnit(servingMatch[2].toLowerCase());
      } else {
        setServingAmount(100);
        setServingUnit('g');
      }

      // Store nutrition data for later use (you may want to expand this)
      // For now, we'll just add the food name to the database if not exists
      if (!FOOD_DATABASE.includes(foodName)) {
        FOOD_DATABASE.push(foodName);
      }

      // Show success message (you can add a toast notification here)
      console.log('Product scanned successfully:', parsedFood);
      
      // Save scan to history
      if (currentUser) {
        await scanService.saveScan(currentUser.id, {
          barcode,
          productName: parsedFood.name,
          brand: parsedFood.brand || '',
          addedToMeal: currentMealKey
        });
      }

    } catch (error) {
      console.error('Error scanning product:', error);
      setScanError(error.message || 'Failed to scan product. Please try again.');
      
      // Show error for 5 seconds
      setTimeout(() => setScanError(null), 5000);
    } finally {
      setScanLoading(false);
    }
  };

  // Save meal to Firestore
  const saveMealToFirestore = async (mealType, foods) => {
    if (!currentUser || savingMeal) return;
    
    try {
      setSavingMeal(true);
      
      // Parse foods from string format
      const parsedFoods = foods.map(item => {
        const match = item.match(/^(.*?) \((\d+(?:\.\d+)?) ([a-zA-Z]+), (.*?)\)$/);
        if (match) {
          return {
            name: match[1],
            amount: parseFloat(match[2]),
            unit: match[3],
            filters: match[4]
          };
        }
        // Fallback for simpler format
        const simpleMatch = item.match(/^(.*?): (\d+(?:\.\d+)?) ([a-zA-Z]+)$/);
        if (simpleMatch) {
          return {
            name: simpleMatch[1],
            amount: parseFloat(simpleMatch[2]),
            unit: simpleMatch[3]
          };
        }
        return { name: item, amount: 1, unit: 'serving' };
      });
      
      // Check if we have an existing meal ID for this meal type
      if (firestoreMealIds[mealType]) {
        // Update existing meal
        await mealService.updateMeal(currentUser.id, firestoreMealIds[mealType], {
          foods: parsedFoods,
          filters
        });
      } else {
        // Create new meal
        const meal = await mealService.createMeal(currentUser.id, {
          mealType,
          foods: parsedFoods,
          date: new Date(),
          filters
        });
        // Store the meal ID for future updates
        setFirestoreMealIds(prev => ({ ...prev, [mealType]: meal.id }));
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      setScanError('Failed to save meal. Please try again.');
    } finally {
      setSavingMeal(false);
    }
  };

  // Meal tab rename logic
  const handleMealNameChange = (key, e) => {
    renameMeal(key, e.target.value);
  };
  const handleMealNameBlur = (key, e) => {
    if (!e.target.value.trim()) renameMeal(key, 'New meal');
    setEditingMealKey(null);
  };

  const handleMealNameKeyDown = (key, e) => {
    if (e.key === 'Enter') {
      if (!e.target.value.trim()) renameMeal(key, 'New meal');
      setEditingMealKey(null);
    }
  };

  const handleMealDoubleClick = (key, e) => {
    e.stopPropagation();
    setEditingMealKey(key);
  };

  // Calculate total nutrients for selected meals
  function calculateTotals() {
    const totals = {};
    selectedMeals.forEach(mealKey => {
      (mealContents[mealKey] || []).forEach(item => {
        const match = item.match(/^(.*?) \((\d+(?:\.\d+)?) ([a-zA-Z]+)\)$/);
        if (!match) return;
        const food = match[1];
        const amount = parseFloat(match[2]);
        const unit = match[3];
        let nutrients = null;
        if (!nutrients) return;
        const multiplier = amount * (CONV[unit] || CONV.default);
        Object.entries(nutrients).forEach(([key, value]) => {
          totals[key] = (totals[key] || 0) + value * multiplier;
        });
      });
    });
    return totals;
  }

  const totals = calculateTotals();

  // Group toggle logic
  function handleGroupToggle(groupName) {
    setExpandedGroups(expanded => ({ ...expanded, [groupName]: !expanded[groupName] }));
  }
  function showTooltip(text, e, dv, value, percent) {
    let tooltipText = text;
    if (dv && value !== undefined) {
      tooltipText += `\nDV: ${dv} | Value: ${value.toFixed(2)} (${percent.toFixed(1)}%)`;
    }
    setTooltip({ visible: true, text: tooltipText, x: e.clientX, y: e.clientY });
  }
  function hideTooltip() {
    setTooltip({ ...tooltip, visible: false });
  }

  function handleSubToggle(nutrientName) {
    setExpandedSub(expanded => ({ ...expanded, [nutrientName]: !expanded[nutrientName] }));
  }

  function getDV(key) {
    // TODO: This will be replaced with database lookup based on userAge and userSex
    return 100; // Placeholder value
  }

  // Helper for progress bar gradient
  function getProgressGradient(nutrient) {
    const heavyMetals = ['Lead', 'Mercury', 'Cadmium', 'Arsenic', 'Aluminum'];
    if (heavyMetals.includes(nutrient)) {
      return 'linear-gradient(to right, #df00a3 0%, #df00a3 100%)';
    }
    return 'linear-gradient(to right, #df00a3 0%, #4a4a4a 40%, #5bb8b1 100%)';
  }

  function renderNutrientRow(nutrient, level = 0, index = 0) {
    const key = NUTRIENT_KEYS[nutrient.name || nutrient];
    const value = totals[key] || 0;
    const dv = getDV(key);
    const percent = Math.min((value / dv) * 100, 100);
    const hasChildren = nutrient.children && nutrient.children.length > 0;
    const nutrientName = nutrient.name || nutrient;
    return (
      <React.Fragment key={nutrientName}>
        <div
          className={
            `${level > 0 ? 'nutrient-nested' : 'nutrient-standalone'}${level > 0 && index === 0 ? ' nested-top' : ''}${!hasChildren && (!nutrient.children || nutrient.children.length === 0) ? ' nested-bottom' : ''}${hasChildren ? ' collapsible' : ''}${(hasChildren && !expandedSub[nutrientName]) ? ' collapsed' : ''}`
          }
          style={{ marginLeft: level > 0 ? 0 : level * 18 }}
          onClick={hasChildren ? () => handleSubToggle(nutrientName) : undefined}
        >
          <div
            onMouseEnter={e => showTooltip(`${nutrientName}`, e, dv, value, percent)}
            onMouseLeave={hideTooltip}
          >{hasChildren ? <span style={{ display: 'inline-block', width: '1.2em' }}>{expandedSub[nutrientName] ? '▼' : <span style={{ fontSize: '0.8em' }}>▶</span>}</span> : <span style={{ display: 'inline-block', width: '1.2em' }}></span>}{nutrientName}</div>
          <div
            onMouseEnter={e => showTooltip(`${nutrientName}: ${value ? value.toFixed(2) : '--'}`, e, dv, value, percent)}
            onMouseLeave={hideTooltip}
          >{value ? value.toFixed(1) : '--'}</div>
          <div
            className="dv-meter"
            onMouseEnter={e => showTooltip(`${percent.toFixed(1)}% of DV\n${value ? value.toFixed(2) : '--'} / ${dv}`, e, dv, value, percent)}
            onMouseLeave={hideTooltip}
          >
            <div className="dv-fill" style={{ width: `${percent}%`, background: getProgressGradient(nutrient) }}></div>
          </div>
          <div
            className="bioavailability-badge bio-none"
            onMouseEnter={e => showTooltip('Bioavailability info coming soon', e)}
            onMouseLeave={hideTooltip}
          >--</div>
        </div>
        {hasChildren && expandedSub[nutrientName] && (
          <div className="nutrient-children">
            {nutrient.children.map((child, idx) => renderNutrientRow(child, level + 1, idx))}
          </div>
        )}
      </React.Fragment>
    );
  }

  // --- Render ---
  return (
    <div>
      {/* Loading meals indicator */}
      {loadingMeals && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--color-text-secondary)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-accent-primary)',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading your meals...</p>
        </div>
      )}
      
      {!loadingMeals && (
      <>
      <div className="meal-builder-section">
        <h4 className="builder-title">
          Meal Builder
          {savingMeal && (
            <span style={{
              fontSize: '14px',
              color: 'var(--color-accent-primary)',
              marginLeft: '12px',
              fontWeight: 'normal'
            }}>
              Saving...
            </span>
          )}
        </h4>
        <div className="builder-content">
          <div className="meal-selector-tabs">
            {meals.map(meal => (
              <button
                className={`meal-select-btn${currentMealKey === meal.key ? ' active' : ''}`}
                data-meal={meal.key}
                key={meal.key}
                onClick={() => setCurrentMealKey(meal.key)}
              >
                {editingMealKey === meal.key ? (
                  <input
                    type="text"
                    className="meal-name-input"
                    value={meal.name}
                    onChange={e => handleMealNameChange(meal.key, e)}
                    onBlur={e => handleMealNameBlur(meal.key, e)}
                    onKeyDown={e => handleMealNameKeyDown(meal.key, e)}
                    autoFocus
                    onFocus={e => e.target.select()}
                  />
                ) : (
                  <span 
                    className="meal-name-display" 
                    onDoubleClick={e => handleMealDoubleClick(meal.key, e)}
                  >
                    {meal.name}
                  </span>
                )}
                <span className="close-meal-btn" onClick={e => { e.stopPropagation(); removeMeal(meal.key); }}>×</span>
              </button>
            ))}
            <button className="add-meal-tab-btn" id="addMealBtn" onClick={addMeal} disabled={!currentUser}>+</button>
          </div>

          <div className="builder-main">
            <div className="food-selection-area">
              <div className="food-search">
                <div className="search-label">Search</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search foods (e.g., spinach, chicken, almonds)"
                    id="foodSearchInput"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    onKeyDown={handleSearchKeyDown}
                    ref={searchInputRef}
                    style={{ flex: 1 }}
                  />
                  <button 
                    className="barcode-scan-btn"
                    onClick={() => setShowBarcodeScanner(true)}
                    title="Scan barcode"
                    style={{
                      background: 'var(--color-accent-primary)',
                      color: 'var(--color-bg-primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 150ms ease',
                      height: '40px',
                      width: '40px'
                    }}
                    onMouseEnter={e => e.target.style.background = 'var(--color-accent-secondary)'}
                    onMouseLeave={e => e.target.style.background = 'var(--color-accent-primary)'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 7V5C3 3.9 3.9 3 5 3H7V5H5V7H3M7 21H5C3.9 21 3 20.1 3 19V17H5V19H7V21M17 3H19C20.1 3 21 3.9 21 5V7H19V5H17V3M21 17V19C21 20.1 20.1 21 19 21H17V19H19V17H21M8 5H16V7H8V5M8 17H16V19H8V17M8 9H16V11H8V9M8 13H16V15H8V13Z"/>
                    </svg>
                  </button>
                </div>
                {searchVisible && searchResults.length > 0 && (
                  <div className="search-results" id="searchResults" style={{ display: 'block' }}>
                    {searchResults.map((food, idx) => (
                      <div
                        className={`search-result-item${currentSearchIndex === idx ? ' highlighted' : ''}`}
                        key={food}
                        data-food={food}
                        onClick={() => selectFoodFromSearch(food)}
                      >
                        {food}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="quick-foods" id="nutritionQuickFoods">
                {FOODS.map(food => (
                  <div
                    className="quick-food-btn"
                    key={food}
                    onClick={() => handleQuickFoodClick(food)}
                  >
                    {food}
                  </div>
                ))}
              </div>
              <div className={`selected-food-display${selectedFood ? '' : ' empty'}`}> {/* Selected food UI */}
                {selectedFood ? (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 80, gap: 8 }}>
                    <div><strong>{selectedFood}</strong></div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 14, color: '#ffffff' }}>Serving size:</span>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <input
                          type="number"
                          id="servingAmount"
                          value={servingAmount}
                          min="0.1"
                          step="0.1"
                          onChange={e => setServingAmount(Number(e.target.value))}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && selectedFood) {
                              e.preventDefault();
                              handleAddFood();
                            }
                          }}
                          style={{ width: 160, padding: '6px 82px 6px 10px', border: '1px solid #666666', borderRadius: 6, fontSize: '0.85em', background: '#2d2d2d', color: '#ffffff' }}
                        />
                        <select
                          id="servingUnit"
                          value={servingUnit}
                          onChange={e => setServingUnit(e.target.value)}
                          style={{ position: 'absolute', right: 2, top: 2, bottom: 2, width: 72, padding: '4px 22px 4px 8px', border: 'none', borderLeft: '1px solid #666666', borderRadius: '0 4px 4px 0', fontSize: '0.85em', background: '#2d2d2d', color: '#ffffff', appearance: 'none', cursor: 'pointer', lineHeight: '1.2' }}
                        >
                          {SERVING_UNITS.map(unit => (
                            <option value={unit} key={unit}>{unit}</option>
                          ))}
                        </select>
                        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: '#666' }}>▼</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 80, gap: 8 }}>
                    <div>No food selected</div>
                    <div>Search or click a food above to select it</div>
                  </div>
                )}
              </div>
              {/* Filters */}
              <div className="bioavailability-filters">
                <div className="filter-group">
                  <label>Cook Style</label>
                  <select className="filter-select" value={filters.cook} onChange={e => setFilters(f => ({ ...f, cook: e.target.value }))}>
                    <option value="boiled">Boiled</option>
                    <option value="raw">Raw</option>
                    <option value="steamed">Steamed</option>
                    <option value="grilled">Grilled</option>
                    <option value="fried">Fried</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Processing Style</label>
                  <select className="filter-select" value={filters.process} onChange={e => setFilters(f => ({ ...f, process: e.target.value }))}>
                    <option value="frozen">Frozen</option>
                    <option value="fresh">Fresh</option>
                    <option value="canned">Canned</option>
                    <option value="dried">Dried</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Quality</label>
                  <select className="filter-select" value={filters.quality} onChange={e => setFilters(f => ({ ...f, quality: e.target.value }))}>
                    <option value="organic">Organic</option>
                    <option value="conventional">Conventional</option>
                    <option value="wild-caught">Wild Caught</option>
                    <option value="grass-fed">Grass Fed</option>
                  </select>
                </div>
              </div>
              <button 
              className="add-food-final" 
              onClick={handleAddFood} 
              disabled={!selectedFood || savingMeal}
            >
              {savingMeal ? 'Saving...' : (editingFoodIndex !== null ? 'Update Food' : 'Add Food')}
            </button>
            </div>
            <div className="current-meal-display">
              <h5>{meals.find(m => m.key === currentMealKey)?.name || ''}</h5>
              <div className="meal-contents">
                {(mealContents[currentMealKey] && mealContents[currentMealKey].length > 0) ? (
                  mealContents[currentMealKey].map((item, idx) => (
                    <div className={`food-item${editingFoodIndex === idx ? ' editing' : ''}`} key={idx} onClick={() => handleEditFood(idx)}>
                      <span>{item}</span>
                      <button className="remove-food" onClick={e => { e.stopPropagation(); handleRemoveFood(idx); }}>×</button>
                    </div>
                  ))
                ) : (
                  <div className="food-item">No items added</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Nutrient Analysis Section */}
      <div className="nutrient-analysis-section">
        <h4 className="analysis-title">Nutrient Analysis</h4>
        <div className="analysis-subtitle">(double click to select individual items)</div>
        <div className="meal-controls">
          <button 
            className="select-all-btn" 
            onClick={() => setSelectedMeals(meals.map(m => m.key))}
          >
            Select All
          </button>
          <button 
            className="reset-btn" 
            onClick={() => setSelectedMeals([])}
          >
            Reset
          </button>
        </div>
        <div className="meal-selection-grid">
          {meals.map(meal => (
            <div
              className={`meal-card${selectedMeals.includes(meal.key) ? ' selected' : ''}`}
              data-meal={meal.key}
              key={meal.key}
              onClick={() => {
                setSelectedMeals(selectedMeals =>
                  selectedMeals.includes(meal.key)
                    ? selectedMeals.filter(k => k !== meal.key)
                    : [...selectedMeals, meal.key]
                );
              }}
            >
              <div className="meal-card-header">{meal.name}</div>
              <div className={`meal-card-foods${(mealContents[meal.key] && mealContents[meal.key].length === 0) ? ' empty' : ''}`}>
                {(mealContents[meal.key] && mealContents[meal.key].length > 0) ? (
                  mealContents[meal.key].map((item, idx) => (
                    <div className="meal-food-item" key={idx}>{item}</div>
                  ))
                ) : (
                  'No items'
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="analysis-controls">
            <div className="controls-row">
              <div className="bioavailability-toggle">
                <span>Bioavailability</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={bioavailabilityEnabled} onChange={e => setBioavailabilityEnabled(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-status">{bioavailabilityEnabled ? 'ON' : 'OFF'}</span>
              </div>
            </div>
            <div className="personal-profile">
              <span className="profile-label">Personal Profile:</span>
              <select className="profile-select" id="ageSelect" value={userAge} onChange={e => setUserAge(e.target.value)}>
                <option value="1-3">Age: 1-3y</option>
                <option value="4-8">Age: 4-8y</option>
                <option value="9-13">Age: 9-13y</option>
                <option value="14-18">Age: 14-18y</option>
                <option value="19-30">Age: 19-30y</option>
                <option value="31-50">Age: 31-50y</option>
                <option value="51-70">Age: 51-70y</option>
                <option value=">70">Age: >70y</option>
              </select>
              <select className="profile-select" id="sexSelect" value={userSex} onChange={e => setUserSex(e.target.value)}>
                <option value="female">Sex: Female</option>
                <option value="male">Sex: Male</option>
              </select>
            </div>
          </div>
        <div className="nutrient-groups" id="nutritionNutrientGroups">
          <div className="nutrient-column">
            {nutrientGroups.slice(0, Math.ceil(nutrientGroups.length / 2)).map(group => (
              <div className="nutrient-group" key={group.name}>
                <h4 style={{ cursor: 'pointer' }} onClick={() => handleGroupToggle(group.name)}>
                  <span style={{ display: 'inline-block', width: '1.2em' }}>{expandedGroups[group.name] ? '▼' : <span style={{ fontSize: '0.8em' }}>▶</span>}</span>{group.name}
                </h4>
                <div style={{ display: expandedGroups[group.name] ? 'block' : 'none' }}>
                  {group.nutrients.map(nutrient => renderNutrientRow(nutrient))}
                </div>
              </div>
            ))}
          </div>
          <div className="nutrient-column">
            {nutrientGroups.slice(Math.ceil(nutrientGroups.length / 2)).map(group => (
              <div className="nutrient-group" key={group.name}>
                <h4 style={{ cursor: 'pointer' }} onClick={() => handleGroupToggle(group.name)}>
                  <span style={{ display: 'inline-block', width: '1.2em' }}>{expandedGroups[group.name] ? '▼' : <span style={{ fontSize: '0.8em' }}>▶</span>}</span>{group.name}
                </h4>
                <div style={{ display: expandedGroups[group.name] ? 'block' : 'none' }}>
                  {group.nutrients.map(nutrient => renderNutrientRow(nutrient))}
                </div>
              </div>
            ))}
          </div>
          {tooltip.visible && (
            <div
              className="tooltip"
              style={{ position: 'fixed', left: tooltip.x + 10, top: tooltip.y + 10, zIndex: 10000, display: 'block', whiteSpace: 'pre-line' }}
            >
              {tooltip.text}
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScanSuccess={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* Loading Indicator */}
      {scanLoading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--color-bg-elevated)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1001,
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-accent-primary)',
            borderRadius: '50%',
            margin: '0 auto var(--spacing-md)',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--color-text-primary)', margin: 0 }}>Loading product information...</p>
        </div>
      )}

      </>
      )}
      
      {/* Error Toast */}
      {scanError && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--spacing-lg)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 68, 68, 0.9)',
          color: 'white',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1002,
          maxWidth: '400px',
          textAlign: 'center',
          animation: 'slideUp 300ms ease'
        }}>
          {scanError}
        </div>
      )}
    </div>
  );
}

export default NutritionTab; 