// Test script to verify extractJsonStringField works correctly
// Run this in browser console or Node.js to test the extraction logic

// Simulated extractJsonStringField function (copy from recipeDetailsService.js)
const extractJsonStringField = (text, fieldName) => {
  try {
    const key = `"${fieldName}"`;
    const keyIdx = text.indexOf(key);
    if (keyIdx === -1) return { complete: false };

    let colonIdx = text.indexOf(':', keyIdx + key.length);
    if (colonIdx === -1) return { complete: false };

    while (colonIdx + 1 < text.length && /\s/.test(text[colonIdx + 1])) colonIdx++;

    const openQuoteIdx = text.indexOf('"', colonIdx + 1);
    if (openQuoteIdx === -1) return { complete: false };

    let i = openQuoteIdx + 1;
    while (i < text.length) {
      if (text[i] === '"') {
        let bs = 0, j = i - 1;
        while (j >= 0 && text[j] === '\\') { bs++; j--; }
        if ((bs % 2) === 0) {
          const raw = text.slice(openQuoteIdx + 1, i);
          let decoded = raw;
          try { decoded = JSON.parse(`"${raw}"`); } catch {}
          return { complete: true, value: decoded };
        }
      }
      i++;
    }

    return { complete: false };
  } catch {
    return { complete: false };
  }
};

// Test cases
console.log('=== Testing extractJsonStringField ===\n');

// Test 1: Complete field
const test1 = `{
  "visual_description": "A white ceramic plate with grilled chicken, roasted vegetables, and herbs",
  "full_description": "Healthy grilled chicken"`;
const result1 = extractJsonStringField(test1, 'visual_description');
console.log('Test 1 (Complete):', result1);
console.log('Expected: complete=true, has value');
console.log('Status:', result1.complete ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 2: Incomplete field (no closing quote)
const test2 = `{
  "visual_description": "A white ceramic plate with grilled chicken`;
const result2 = extractJsonStringField(test2, 'visual_description');
console.log('Test 2 (Incomplete):', result2);
console.log('Expected: complete=false');
console.log('Status:', !result2.complete ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 3: Field not started yet
const test3 = `{
  "title": "Grilled Chicken Dinner"`;
const result3 = extractJsonStringField(test3, 'visual_description');
console.log('Test 3 (Not found):', result3);
console.log('Expected: complete=false');
console.log('Status:', !result3.complete ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 4: Field with escaped quotes
const test4 = `{
  "visual_description": "A plate with \\"golden brown\\" chicken pieces",
  "full_description": "Test"`;
const result4 = extractJsonStringField(test4, 'visual_description');
console.log('Test 4 (Escaped quotes):', result4);
console.log('Expected: complete=true, includes escaped quotes');
console.log('Status:', result4.complete ? '✅ PASS' : '❌ FAIL');
console.log('Value:', result4.value);
console.log('');

// Test 5: Realistic streaming scenario (partial JSON)
const test5 = `{
  "visual_description": "A rustic wooden board displaying perfectly grilled salmon fillet with crispy golden-brown skin on top, positioned center-left. To the right, a serving of fluffy white rice garnished with fresh parsley. Behind the salmon, roasted asparagus spears arranged diagonally. Small lemon wedges scattered artfully. Natural lighting, overhead shot."`;
const result5 = extractJsonStringField(test5, 'visual_description');
console.log('Test 5 (Realistic streaming - incomplete JSON):', result5);
console.log('Expected: complete=true even though JSON is incomplete');
console.log('Status:', result5.complete ? '✅ PASS' : '❌ FAIL');
console.log('Value length:', result5.value?.length, 'chars');
console.log('Preview:', result5.value?.substring(0, 100) + '...');
console.log('');

console.log('=== All tests complete ===');
