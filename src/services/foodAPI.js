// Food API Service for Open Food Facts
const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2';

// Cache for API responses to avoid repeated requests
const apiCache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      apiCache.delete(key);
    }
  }
}, CACHE_DURATION);

/**
 * Fetch product information by barcode from Open Food Facts
 * @param {string} barcode - The product barcode
 * @returns {Promise<Object>} Product information
 */
export const fetchProductByBarcode = async (barcode) => {
  // Validate barcode parameter
  if (!barcode || typeof barcode !== 'string' || barcode.trim() === '') {
    throw new Error('Invalid barcode: barcode must be a non-empty string');
  }
  
  // Sanitize barcode
  const sanitizedBarcode = barcode.trim();
  
  // Check cache first
  if (apiCache.has(sanitizedBarcode)) {
    const cached = apiCache.get(sanitizedBarcode);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const url = `${OPEN_FOOD_FACTS_API}/product/${encodeURIComponent(sanitizedBarcode)}`;
    console.log('Fetching product from:', url);
    
    // Validate URL before fetching
    try {
      new URL(url);
    } catch (urlError) {
      console.error('Invalid URL constructed:', url);
      throw new Error('Invalid barcode format');
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 0) {
      throw new Error('Product not found');
    }

    // Cache the response
    apiCache.set(sanitizedBarcode, {
      data: data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

/**
 * Parse Open Food Facts product data into our app's format
 * @param {Object} productData - Raw product data from API
 * @returns {Object} Parsed nutrition information
 */
export const parseProductData = (productData) => {
  const product = productData.product;
  
  if (!product) {
    throw new Error('Invalid product data');
  }

  // Extract basic product info
  const foodInfo = {
    name: product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands || '',
    barcode: product.code || '',
    imageUrl: product.image_url || product.image_front_url || '',
    servingSize: product.serving_size || '100g',
    
    // Nutrition data per 100g (or per serving if available)
    nutrition: {}
  };

  // Get nutriments data
  const nutriments = product.nutriments || {};
  const per100g = true; // Always use per 100g for consistency

  // Map Open Food Facts nutrients to our app's format
  // Macros
  foodInfo.nutrition.calories = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0;
  foodInfo.nutrition.totalFat = nutriments['fat_100g'] || nutriments['fat'] || 0;
  foodInfo.nutrition.saturatedFat = nutriments['saturated-fat_100g'] || nutriments['saturated-fat'] || 0;
  foodInfo.nutrition.transFat = nutriments['trans-fat_100g'] || nutriments['trans-fat'] || 0;
  foodInfo.nutrition.monounsaturatedFat = nutriments['monounsaturated-fat_100g'] || nutriments['monounsaturated-fat'] || 0;
  foodInfo.nutrition.polyunsaturatedFat = nutriments['polyunsaturated-fat_100g'] || nutriments['polyunsaturated-fat'] || 0;
  foodInfo.nutrition.cholesterol = nutriments['cholesterol_100g'] || nutriments['cholesterol'] || 0;
  
  foodInfo.nutrition.totalCarbohydrates = nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || 0;
  foodInfo.nutrition.sugars = nutriments['sugars_100g'] || nutriments['sugars'] || 0;
  foodInfo.nutrition.fiber = nutriments['fiber_100g'] || nutriments['fiber'] || 0;
  
  foodInfo.nutrition.totalProtein = nutriments['proteins_100g'] || nutriments['proteins'] || 0;
  
  // Minerals
  foodInfo.nutrition.sodium = nutriments['sodium_100g'] || nutriments['sodium'] || 0;
  foodInfo.nutrition.potassium = nutriments['potassium_100g'] || nutriments['potassium'] || 0;
  foodInfo.nutrition.calcium = nutriments['calcium_100g'] || nutriments['calcium'] || 0;
  foodInfo.nutrition.iron = nutriments['iron_100g'] || nutriments['iron'] || 0;
  foodInfo.nutrition.magnesium = nutriments['magnesium_100g'] || nutriments['magnesium'] || 0;
  foodInfo.nutrition.phosphorus = nutriments['phosphorus_100g'] || nutriments['phosphorus'] || 0;
  foodInfo.nutrition.zinc = nutriments['zinc_100g'] || nutriments['zinc'] || 0;
  
  // Vitamins
  foodInfo.nutrition.vitaminA = nutriments['vitamin-a_100g'] || nutriments['vitamin-a'] || 0;
  foodInfo.nutrition.vitaminC = nutriments['vitamin-c_100g'] || nutriments['vitamin-c'] || 0;
  foodInfo.nutrition.vitaminD = nutriments['vitamin-d_100g'] || nutriments['vitamin-d'] || 0;
  foodInfo.nutrition.vitaminE = nutriments['vitamin-e_100g'] || nutriments['vitamin-e'] || 0;
  foodInfo.nutrition.vitaminK = nutriments['vitamin-k_100g'] || nutriments['vitamin-k'] || 0;
  
  // B Vitamins
  foodInfo.nutrition.thiamin = nutriments['vitamin-b1_100g'] || nutriments['vitamin-b1'] || 0;
  foodInfo.nutrition.riboflavin = nutriments['vitamin-b2_100g'] || nutriments['vitamin-b2'] || 0;
  foodInfo.nutrition.niacin = nutriments['vitamin-b3_100g'] || nutriments['vitamin-b3'] || nutriments['vitamin-pp_100g'] || 0;
  foodInfo.nutrition.vitaminB6 = nutriments['vitamin-b6_100g'] || nutriments['vitamin-b6'] || 0;
  foodInfo.nutrition.folate = nutriments['vitamin-b9_100g'] || nutriments['vitamin-b9'] || 0;
  foodInfo.nutrition.vitaminB12 = nutriments['vitamin-b12_100g'] || nutriments['vitamin-b12'] || 0;
  
  // Additional info
  foodInfo.ingredients = product.ingredients_text || '';
  foodInfo.allergens = product.allergens || '';
  foodInfo.categories = product.categories || '';
  
  // Nutrition score
  foodInfo.nutritionScore = product.nutriscore_grade || null;
  foodInfo.novaGroup = product.nova_group || null;
  
  return foodInfo;
};

/**
 * Search for products by name/query
 * @param {string} query - Search query
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Object>} Search results
 */
export const searchProducts = async (query, page = 1) => {
  // Validate query parameter
  if (!query || typeof query !== 'string' || query.trim() === '') {
    throw new Error('Invalid search query: query must be a non-empty string');
  }
  
  try {
    const sanitizedQuery = query.trim();
    const url = `${OPEN_FOOD_FACTS_API}/search?search_terms=${encodeURIComponent(sanitizedQuery)}&page=${page}&page_size=20&sort_by=popularity`;
    console.log('Searching products with URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      products: data.products || [],
      count: data.count || 0,
      page: data.page || 1,
      pageSize: data.page_size || 20
    };
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

/**
 * Convert Open Food Facts nutrient units to our app's standard units
 * @param {number} value - The nutrient value
 * @param {string} unit - The original unit
 * @returns {Object} Converted value and unit
 */
export const convertNutrientUnits = (value, unit) => {
  // Open Food Facts typically uses:
  // - g for macros
  // - mg for minerals/vitamins
  // - µg for some vitamins
  
  const conversions = {
    'µg': { factor: 0.001, targetUnit: 'mg' },
    'ug': { factor: 0.001, targetUnit: 'mg' },
    'mcg': { factor: 0.001, targetUnit: 'mg' },
    'IU': { factor: 1, targetUnit: 'IU' }, // Keep as is
  };
  
  if (conversions[unit]) {
    return {
      value: value * conversions[unit].factor,
      unit: conversions[unit].targetUnit
    };
  }
  
  return { value, unit };
};

/**
 * Test function to verify API connectivity
 * @returns {Promise<boolean>} True if API is reachable
 */
export const testAPIConnection = async () => {
  try {
    // Test with a known product (Coca-Cola)
    const testBarcode = '5449000000996';
    const result = await fetchProductByBarcode(testBarcode);
    return result.status === 1;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

// Export utility functions
export const foodAPI = {
  fetchProductByBarcode,
  parseProductData,
  searchProducts,
  convertNutrientUnits,
  testAPIConnection
};

export default foodAPI;