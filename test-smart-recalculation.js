// Simple test script to verify smart recalculation logic
const { smartRecalculateGroceryList, logSmartRecalculationDecision } = require('./src/utils/smartRecalculation');

// Mock data for testing
const mockRemovedRecipe = {
  title: "Test Recipe",
  ingredients: [
    { product: "test ingredient 1", qty: "2 cups" },
    { product: "test ingredient 2", qty: "1 lb" }
  ]
};

const mockRemainingRecipes = [
  {
    title: "Remaining Recipe 1",
    ingredients: [
      { product: "shared ingredient", qty: "1 cup" }
    ]
  }
];

// Mock product list with mixed AI and database products
const mockProductList = [
  {
    category: "Test Category",
    items: [
      { name: "test ingredient 1", source: "ai", price: "$2.50", quantity: "1 package" },
      { name: "shared ingredient", source: "database", price: "$1.50", quantity: "2 packages" },
      { name: "unrelated ingredient", source: "database", price: "$3.00", quantity: "1 package" }
    ]
  }
];

const mockContext = {
  country: "USA",
  numberOfPeople: 4,
  budget: { min: 50, max: 100 }
};

// Test the smart recalculation logic
async function testSmartRecalculation() {
  console.log("🧪 Testing Smart Recalculation Logic");
  console.log("=====================================\n");

  try {
    // Test 1: Recipe with AI products should trigger full recalculation
    console.log("Test 1: Recipe with AI products");
    logSmartRecalculationDecision(mockRemovedRecipe, mockRemainingRecipes, mockProductList);
    
    // Test 2: Recipe with only database products should trigger quick recalculation
    const databaseOnlyRecipe = {
      title: "Database Only Recipe",
      ingredients: [
        { product: "shared ingredient", qty: "1 cup" }
      ]
    };
    
    const databaseOnlyProductList = [
      {
        category: "Test Category",
        items: [
          { name: "shared ingredient", source: "database", price: "$1.50", quantity: "2 packages" },
          { name: "unrelated ingredient", source: "database", price: "$3.00", quantity: "1 package" }
        ]
      }
    ];
    
    console.log("\nTest 2: Recipe with only database products");
    logSmartRecalculationDecision(databaseOnlyRecipe, mockRemainingRecipes, databaseOnlyProductList);

    console.log("\n✅ Smart recalculation logic test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testSmartRecalculation();
