// Test script for barcode scanning functionality
// Run this with: node src/services/testBarcodes.js

import { fetchProductByBarcode, parseProductData } from './foodAPI.js';

// Common test barcodes from Open Food Facts
const TEST_BARCODES = [
  '3017620422003',  // Nutella
  '5449000000996',  // Coca-Cola
  '3228857000166',  // Président Camembert
  '7622210449283',  // Oreo cookies
  '5000159407236',  // Snickers bar
  '8076800195057',  // Barilla pasta
  '3033710084920',  // Nesquik cereal
  '5410188031195',  // Red Bull
];

async function testBarcode(barcode) {
  console.log(`\n🔍 Testing barcode: ${barcode}`);
  console.log('=' * 50);
  
  try {
    // Fetch product data
    const data = await fetchProductByBarcode(barcode);
    
    // Parse the data
    const parsed = parseProductData(data);
    
    // Display results
    console.log(`✅ Product found!`);
    console.log(`📦 Name: ${parsed.name}`);
    console.log(`🏷️  Brand: ${parsed.brand}`);
    console.log(`📏 Serving: ${parsed.servingSize}`);
    console.log(`🔥 Calories: ${parsed.nutrition.calories} kcal`);
    console.log(`🥩 Protein: ${parsed.nutrition.totalProtein}g`);
    console.log(`🌾 Carbs: ${parsed.nutrition.totalCarbohydrates}g`);
    console.log(`🧈 Fat: ${parsed.nutrition.totalFat}g`);
    
    if (parsed.nutritionScore) {
      console.log(`📊 Nutri-Score: ${parsed.nutritionScore.toUpperCase()}`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting barcode API tests...\n');
  
  // Test a few barcodes
  for (const barcode of TEST_BARCODES.slice(0, 3)) {
    await testBarcode(barcode);
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ Tests completed!');
}

// Run the tests
runTests().catch(console.error);

// Export for use in other files if needed
export { TEST_BARCODES, testBarcode };