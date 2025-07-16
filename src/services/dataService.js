// Temporary mock data service until we implement Supabase version
// This prevents crashes while keeping the app functional

// Mock user service
export const userService = {
  async getProfile(userId) {
    // Return mock profile
    return {
      id: userId,
      displayName: 'Test User',
      email: 'test@example.com',
      subscription: {
        plan: 'freemium',
        scansToday: 0,
        scansLimit: 5
      }
    };
  },

  async createProfile(userId, profileData) {
    console.log('Mock: Creating profile', userId, profileData);
    return { id: userId, ...profileData };
  },

  async updateProfile(userId, updates) {
    console.log('Mock: Updating profile', userId, updates);
    return { id: userId, ...updates };
  }
};

// Mock meal service
export const mealService = {
  async getMeals(userId, date) {
    console.log('Mock: Getting meals for', userId, date);
    return [];
  },

  async createMeal(userId, mealData) {
    console.log('Mock: Creating meal', userId, mealData);
    return { id: Date.now().toString(), ...mealData };
  },

  async updateMeal(userId, mealId, updates) {
    console.log('Mock: Updating meal', userId, mealId, updates);
    return { id: mealId, ...updates };
  },

  async deleteMeal(userId, mealId) {
    console.log('Mock: Deleting meal', userId, mealId);
    return true;
  }
};

// Mock scan service
export const scanService = {
  async saveScan(userId, scanData) {
    console.log('Mock: Saving scan', userId, scanData);
    return { id: Date.now().toString(), ...scanData };
  },

  async getScans(userId, limit = 10) {
    console.log('Mock: Getting scans for', userId);
    return [];
  },

  async getTodayScans(userId) {
    console.log('Mock: Getting today scans for', userId);
    return [];
  }
};

// Mock food service
export const foodService = {
  async getFoods(searchTerm) {
    console.log('Mock: Searching foods', searchTerm);
    return [];
  },

  async createFood(foodData) {
    console.log('Mock: Creating food', foodData);
    return { id: Date.now().toString(), ...foodData };
  },

  async updateFood(foodId, updates) {
    console.log('Mock: Updating food', foodId, updates);
    return { id: foodId, ...updates };
  }
};