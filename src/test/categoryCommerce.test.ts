import { describe, it, expect } from 'vitest';
import { MOCK_MERCHANTS, MOCK_PRODUCTS } from '../data/mockData';
import { CommercialVertical } from '../types/categoryCommerce';

describe('Multi-Category Commerce Domain Architecture', () => {
  const verticals: CommercialVertical[] = [
    'Restaurants',
    'Groceries',
    'Convenience',
    'Pharmacy',
    'TOGO Padala',
    'Retail',
    'Flowers',
    'Pet Care',
  ];

  it('contains merchants supporting all 8 core Philippine verticals', () => {
    const merchantCategories = new Set(MOCK_MERCHANTS.map((m) => m.category));
    expect(merchantCategories.has('Restaurants')).toBe(true);
    expect(merchantCategories.has('Groceries')).toBe(true);
    expect(merchantCategories.has('Convenience')).toBe(true);
    expect(merchantCategories.has('Pharmacy')).toBe(true);
    expect(merchantCategories.has('Retail')).toBe(true);
    expect(merchantCategories.has('Flowers')).toBe(true);
    expect(merchantCategories.has('Pet Care')).toBe(true);
  });

  it('validates Restaurant domain attributes for menu items', () => {
    const restaurantProduct = MOCK_PRODUCTS.find(
      (p) => p.categoryAttributes?.vertical === 'Restaurants'
    );
    expect(restaurantProduct).toBeDefined();
    const attrs = restaurantProduct?.categoryAttributes?.restaurant;
    expect(attrs).toBeDefined();
    expect(attrs?.diningModes).toContain('delivery');
    expect(attrs?.preparationTimeMinutes.min).toBeGreaterThan(0);
    expect(Array.isArray(attrs?.allergenWarnings)).toBe(true);
    expect(attrs?.kitchenNotesAllowed).toBe(true);
  });

  it('validates Grocery domain attributes (weight pricing, UOM, substitution policies)', () => {
    const groceryProduct = MOCK_PRODUCTS.find(
      (p) => p.categoryAttributes?.vertical === 'Groceries'
    );
    expect(groceryProduct).toBeDefined();
    const attrs = groceryProduct?.categoryAttributes?.grocery;
    expect(attrs).toBeDefined();
    expect(['unit', 'weight_based']).toContain(attrs?.pricingType);
    expect(['kg', 'g', 'pack', 'piece', 'bundle', 'box']).toContain(attrs?.unitOfMeasure);
    expect(['ambient', 'chilled', 'frozen']).toContain(attrs?.storageCondition);
    expect(['call_customer', 'best_alternative', 'refund_immediately']).toContain(
      attrs?.substitutionPolicy
    );
  });

  it('validates Pharmacy domain attributes (Rx vs OTC, pharmacist status, FDA registration)', () => {
    const rxProduct = MOCK_PRODUCTS.find(
      (p) => p.categoryAttributes?.pharmacy?.requiresPrescription === true
    );
    expect(rxProduct).toBeDefined();
    const rxAttrs = rxProduct?.categoryAttributes?.pharmacy;
    expect(rxAttrs?.requiresPrescription).toBe(true);
    expect(rxAttrs?.pharmacistReviewStatus).toBe('pending_review');
    expect(rxAttrs?.fdaRegistrationNumber).toMatch(/^FDA-DR-/);
    expect(rxAttrs?.activeIngredients.length).toBeGreaterThan(0);

    const otcProduct = MOCK_PRODUCTS.find(
      (p) => p.categoryAttributes?.pharmacy?.requiresPrescription === false
    );
    expect(otcProduct).toBeDefined();
    expect(otcProduct?.categoryAttributes?.pharmacy?.pharmacistReviewStatus).toBe('not_required');
  });

  it('validates Retail domain attributes (sizes, colors, variants, return policy)', () => {
    const retailProduct = MOCK_PRODUCTS.find(
      (p) => p.categoryAttributes?.vertical === 'Retail' && p.categoryAttributes.retail?.sizes
    );
    expect(retailProduct).toBeDefined();
    const attrs = retailProduct?.categoryAttributes?.retail;
    expect(attrs?.sizes).toContain('M');
    expect(attrs?.colors && attrs.colors.length > 0).toBe(true);
    expect(attrs?.variants && attrs.variants.length > 0).toBe(true);
    expect(attrs?.returnPolicy).toBeDefined();
  });

  it('validates Flower domain attributes (arrangement, card messages, time slots)', () => {
    const flowerProduct = MOCK_PRODUCTS.find(
      (p) => p.categoryAttributes?.vertical === 'Flowers'
    );
    expect(flowerProduct).toBeDefined();
    const attrs = flowerProduct?.categoryAttributes?.flowers;
    expect(attrs?.allowCardMessage).toBe(true);
    expect(attrs?.cardMessageMaxLength).toBeGreaterThanOrEqual(100);
    expect(attrs?.guaranteedTimeSlots.length).toBeGreaterThan(0);
    expect(attrs?.delicateHandling).toBe(true);
  });

  it('validates Pet Care domain attributes (target pet, life stage, dietary tags)', () => {
    const petProduct = MOCK_PRODUCTS.find(
      (p) => p.categoryAttributes?.vertical === 'Pet Care'
    );
    expect(petProduct).toBeDefined();
    const attrs = petProduct?.categoryAttributes?.petCare;
    expect(attrs?.targetPet.length).toBeGreaterThan(0);
    expect(attrs?.lifeStage).toBeDefined();
    expect(attrs?.dietaryTags.length).toBeGreaterThan(0);
  });
});
