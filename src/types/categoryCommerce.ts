// Domain specifications for Multi-Category Commerce (8 Commercial Verticals)

export type CommercialVertical =
  | 'Restaurants'
  | 'Groceries'
  | 'Convenience'
  | 'Pharmacy'
  | 'TOGO Padala'
  | 'Retail'
  | 'Flowers'
  | 'Pet Care';

// ==========================================
// 1. RESTAURANTS DOMAIN
// ==========================================
export type DiningMode = 'delivery' | 'takeout' | 'dine_in';
export type SpiceLevel = 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';
export type AllergenTag =
  | 'Peanuts'
  | 'Tree Nuts'
  | 'Shellfish'
  | 'Fish'
  | 'Dairy'
  | 'Eggs'
  | 'Gluten'
  | 'Soy'
  | 'Sesame'
  | 'Pork';

export interface RestaurantAttributes {
  diningModes: DiningMode[];
  preparationTimeMinutes: {
    min: number;
    max: number;
  };
  allergenWarnings: AllergenTag[];
  spiceLevel: SpiceLevel;
  kitchenNotesAllowed: boolean;
  servingSize?: string; // e.g. "Good for 2-3 persons"
}

// ==========================================
// 2. GROCERIES DOMAIN
// ==========================================
export type UnitOfMeasure = 'kg' | 'g' | 'pack' | 'piece' | 'bundle' | 'box';
export type StorageCondition = 'ambient' | 'chilled' | 'frozen';
export type GrocerySubstitutionPolicy =
  | 'call_customer'
  | 'best_alternative'
  | 'refund_immediately';

export interface GroceryAttributes {
  pricingType: 'unit' | 'weight_based';
  unitOfMeasure: UnitOfMeasure;
  estimatedWeightKg?: number;
  pricePerUnit: number; // e.g. ₱180 per kg
  perishable: boolean;
  storageCondition: StorageCondition;
  shelfLifeDays?: number;
  substitutionPolicy: GrocerySubstitutionPolicy;
  outOfStockAction: 'hide' | 'show_sold_out' | 'allow_substitution';
  originCountry?: string; // e.g. "Benguet, Philippines"
}

// ==========================================
// 3. CONVENIENCE DOMAIN
// ==========================================
export interface ConvenienceAttributes {
  is24_7Available: boolean;
  requiresAgeVerification: boolean; // e.g. 18+ for alcohol, tobacco
  ageVerificationNotice?: string;
  isInstantReorder: boolean;
  deliverySlaMinutes: number; // e.g. 15-20 min rapid SLA
  temperatureHandling?: 'cold' | 'hot' | 'room_temp';
}

// ==========================================
// 4. PHARMACY DOMAIN
// ==========================================
export type PharmacistReviewStatus =
  | 'not_required'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export interface PharmacyAttributes {
  requiresPrescription: boolean; // Rx vs OTC distinction
  pharmacistReviewStatus: PharmacistReviewStatus;
  fdaRegistrationNumber: string; // e.g. "FDA-DR-XY89234"
  dosageGuideline: string; // e.g. "Take 1 tablet every 4 to 6 hours after meals"
  activeIngredients: string[]; // e.g. ["Paracetamol 500mg"]
  prescriptionUploadUrl?: string;
  isControlledSubstance: boolean;
  packagingType: 'blister_pack' | 'bottle' | 'box' | 'tube';
}

// ==========================================
// 5. RETAIL DOMAIN
// ==========================================
export type RetailReturnPolicy =
  | '7_day_return'
  | '30_day_exchange'
  | 'final_sale'
  | 'hygienic_no_return';

export interface ProductVariant {
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  stock: number;
  price: number;
}

export interface RetailAttributes {
  sizes?: string[]; // ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  colors?: { name: string; hex: string }[];
  variants?: ProductVariant[];
  returnPolicy: RetailReturnPolicy;
  material?: string;
  warrantyPeriod?: string; // e.g. "6 Months Manufacturer Warranty"
  barcode?: string;
}

// ==========================================
// 6. FLOWERS DOMAIN
// ==========================================
export type FlowerArrangementType =
  | 'hand_tied_bouquet'
  | 'vase_arrangement'
  | 'boxed_blooms'
  | 'basket'
  | 'sympathy_wreath';

export interface FlowerAttributes {
  arrangementType: FlowerArrangementType;
  allowCardMessage: boolean;
  cardMessageMaxLength: number;
  hydrationMethod: 'water_vial' | 'foam_base' | 'stem_wrap';
  guaranteedTimeSlots: string[]; // ['Morning (9AM - 12PM)', 'Afternoon (1PM - 5PM)', 'Evening (6PM - 9PM)']
  delicateHandling: boolean;
  freshnessGuaranteeDays: number;
}

// ==========================================
// 7. PET CARE DOMAIN
// ==========================================
export type TargetPetType = 'dog' | 'cat' | 'bird' | 'small_animal' | 'aquatic';
export type PetLifeStage = 'puppy_kitten' | 'adult' | 'senior' | 'all_stages';
export type PetDietaryTag =
  | 'grain_free'
  | 'hypoallergenic'
  | 'weight_management'
  | 'kidney_care'
  | 'high_protein'
  | 'organic';

export interface PetCareAttributes {
  targetPet: TargetPetType[];
  lifeStage: PetLifeStage;
  dietaryTags: PetDietaryTag[];
  vetPrescriptionRequired: boolean;
  weightRestrictions?: string; // e.g. "For dogs 10-25 kg"
}

// ==========================================
// UNIFIED VERTICAL ATTRIBUTES WRAPPER
// ==========================================
export interface MultiCategoryAttributes {
  vertical: CommercialVertical;
  restaurant?: RestaurantAttributes;
  grocery?: GroceryAttributes;
  convenience?: ConvenienceAttributes;
  pharmacy?: PharmacyAttributes;
  retail?: RetailAttributes;
  flowers?: FlowerAttributes;
  petCare?: PetCareAttributes;
}
