// Test script to verify fetch error fixes
import { fetchProductByBarcode, searchProducts } from './foodAPI.js';

console.log('Testing fetch error fixes...\n');

// Test 1: Invalid barcode (undefined)
console.log('Test 1: Undefined barcode');
try {
  await fetchProductByBarcode(undefined);
  console.log('❌ Should have thrown an error');
} catch (error) {
  console.log('✅ Correctly caught error:', error.message);
}

// Test 2: Invalid barcode (empty string)
console.log('\nTest 2: Empty string barcode');
try {
  await fetchProductByBarcode('');
  console.log('❌ Should have thrown an error');
} catch (error) {
  console.log('✅ Correctly caught error:', error.message);
}

// Test 3: Invalid barcode (whitespace only)
console.log('\nTest 3: Whitespace only barcode');
try {
  await fetchProductByBarcode('   ');
  console.log('❌ Should have thrown an error');
} catch (error) {
  console.log('✅ Correctly caught error:', error.message);
}

// Test 4: Valid barcode
console.log('\nTest 4: Valid barcode (Coca-Cola)');
try {
  const result = await fetchProductByBarcode('5449000000996');
  console.log('✅ Successfully fetched product:', result.product?.product_name || 'Unknown');
} catch (error) {
  console.log('❌ Error fetching valid product:', error.message);
}

// Test 5: Invalid search query
console.log('\nTest 5: Invalid search query');
try {
  await searchProducts('');
  console.log('❌ Should have thrown an error');
} catch (error) {
  console.log('✅ Correctly caught error:', error.message);
}

// Test 6: Valid search query
console.log('\nTest 6: Valid search query');
try {
  const results = await searchProducts('apple');
  console.log('✅ Found', results.products.length, 'products');
} catch (error) {
  console.log('❌ Error searching products:', error.message);
}

console.log('\n✅ All tests completed!');