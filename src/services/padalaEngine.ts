import {
  PadalaVehicleType,
  PadalaVehicleConfig,
  PadalaDeliveryType,
  PadalaInsuranceTier,
  PadalaFareBreakdown,
  PadalaParcelDimensions,
} from '../types/padalaEngine';

export const VEHICLE_CONFIGS: PadalaVehicleConfig[] = [
  {
    id: 'motorcycle',
    label: 'Motorcycle',
    category: '2-Wheels',
    maxWeightKg: 20,
    maxDimensionsCm: {
      length: 45,
      width: 40,
      height: 40,
    },
    baseFare: 60,
    perKmRate: 12,
    minFare: 60,
    description: 'Best for documents, food, small parcels, and urgent medicine.',
    recommendedFor: ['Documents', 'Food & Groceries', 'Small Parcels', 'Medicines'],
  },
  {
    id: 'sedan',
    label: 'Sedan (4-Wheels)',
    category: '4-Wheels',
    maxWeightKg: 150,
    maxDimensionsCm: {
      length: 100,
      width: 80,
      height: 70,
    },
    baseFare: 160,
    perKmRate: 20,
    minFare: 160,
    description: 'Ideal for fragile cakes, flower arrangements, multi-bag groceries, and boxed electronics.',
    recommendedFor: ['Fragile Cakes', 'Flower Bouquets', 'Multiple Grocery Bags', 'Laptops & Gadgets'],
  },
  {
    id: 'mpv',
    label: 'MPV / SUV (300kg)',
    category: '4-Wheels Large',
    maxWeightKg: 300,
    maxDimensionsCm: {
      length: 140,
      width: 100,
      height: 90,
    },
    baseFare: 250,
    perKmRate: 26,
    minFare: 250,
    description: 'Perfect for small furniture, catering platters, retail boxes, and bulky pet supplies.',
    recommendedFor: ['Small Furniture', 'Catering Trays', 'Bulk Retail Cartons', 'Large Pet Food Sacks'],
  },
  {
    id: 'van',
    label: 'Delivery Van (800kg)',
    category: 'Light Commercial',
    maxWeightKg: 800,
    maxDimensionsCm: {
      length: 210,
      width: 125,
      height: 120,
    },
    baseFare: 450,
    perKmRate: 35,
    minFare: 450,
    description: 'For commercial cargo, wholesale stock transfers, appliances, and office equipment.',
    recommendedFor: ['Appliances', 'Wholesale Stocks', 'Office Equipment', 'Pallet Boxes'],
  },
  {
    id: 'truck',
    label: 'Small Truck (1.5 Ton)',
    category: 'Heavy Commercial',
    maxWeightKg: 1500,
    maxDimensionsCm: {
      length: 300,
      width: 170,
      height: 170,
    },
    baseFare: 850,
    perKmRate: 50,
    minFare: 850,
    description: 'For warehouse logistics, large machinery, construction materials, and event staging.',
    recommendedFor: ['Warehouse Pallets', 'Industrial Materials', 'Stage & Event Gear', 'Home Relocation'],
  },
];

export const INSURANCE_TIERS: PadalaInsuranceTier[] = [
  {
    id: 'standard',
    label: 'Standard Cargo Protection',
    maxCoveragePhp: 2000,
    feePhp: 0,
    description: 'Complimentary standard coverage included for loss or damage up to ₱2,000.',
  },
  {
    id: 'plus',
    label: 'Plus Cargo Protection (₱10k)',
    maxCoveragePhp: 10000,
    feePhp: 25,
    description: 'Enhanced coverage covering declared valuables up to ₱10,000.',
  },
  {
    id: 'premium',
    label: 'High-Value Security Shield (₱50k)',
    maxCoveragePhp: 50000,
    feePhp: 80,
    description: 'Priority escort protection with strict e-POD verification up to ₱50,000.',
  },
];

/**
 * Calculates volumetric weight using standard courier metric: (L x W x H in cm) / 3500.
 */
export function calculateVolumetricWeight(
  lengthCm: number,
  widthCm: number,
  heightCm: number
): number {
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0;
  const volumetric = (lengthCm * widthCm * heightCm) / 3500;
  return Math.round(volumetric * 10) / 10;
}

/**
 * Recommends the optimal vehicle based on actual weight, volumetric weight, and dimensions.
 */
export function recommendVehicle(
  actualWeightKg: number,
  lengthCm: number,
  widthCm: number,
  heightCm: number
): { vehicle: PadalaVehicleConfig; reason: string } {
  const volumetricWeight = calculateVolumetricWeight(lengthCm, widthCm, heightCm);
  const effectiveWeight = Math.max(actualWeightKg, volumetricWeight);

  for (const config of VEHICLE_CONFIGS) {
    const fitsWeight = effectiveWeight <= config.maxWeightKg;
    const fitsDimensions =
      lengthCm <= config.maxDimensionsCm.length &&
      widthCm <= config.maxDimensionsCm.width &&
      heightCm <= config.maxDimensionsCm.height;

    if (fitsWeight && fitsDimensions) {
      return {
        vehicle: config,
        reason: `Fits weight (${effectiveWeight}kg chargeable) and dimensions within ${config.label} limits.`,
      };
    }
  }

  // Fallback to largest
  const largest = VEHICLE_CONFIGS[VEHICLE_CONFIGS.length - 1];
  return {
    vehicle: largest,
    reason: `Heavy or oversized cargo requires ${largest.label}.`,
  };
}

/**
 * Deterministic Padala fare calculation engine.
 */
export function calculatePadalaFare(params: {
  vehicleType: PadalaVehicleType;
  deliveryType: PadalaDeliveryType;
  distanceKm: number;
  dimensions: PadalaParcelDimensions;
  insuranceTierId?: string;
  numberOfStops: number; // default 1
  requiresCod: boolean;
  codAmount?: number;
}): PadalaFareBreakdown {
  const vehicleConfig =
    VEHICLE_CONFIGS.find((v) => v.id === params.vehicleType) || VEHICLE_CONFIGS[0];

  const baseFare = vehicleConfig.baseFare;
  const distanceFare = Math.round(params.distanceKm * vehicleConfig.perKmRate);

  // Chargeable weight is the higher of actual vs volumetric
  const chargeableWeight = Math.max(
    params.dimensions.weightKg,
    params.dimensions.volumetricWeightKg
  );

  // Weight surcharge if exceeding half of vehicle max capacity
  const weightThreshold = vehicleConfig.maxWeightKg * 0.5;
  const weightSurcharge =
    chargeableWeight > weightThreshold
      ? Math.round((chargeableWeight - weightThreshold) * 5)
      : 0;

  // Insurance tier fee
  const insuranceTier = INSURANCE_TIERS.find((t) => t.id === params.insuranceTierId);
  const insuranceFee = insuranceTier ? insuranceTier.feePhp : 0;

  // Multi-stop surcharge (₱40 per additional waypoint)
  const additionalStops = Math.max(0, params.numberOfStops - 1);
  const multiStopSurcharge = additionalStops * 40;

  // COD handling fee (2% of COD collection or min ₱20)
  const codFee = params.requiresCod
    ? Math.max(20, Math.round((params.codAmount || 0) * 0.02))
    : 0;

  // Delivery type adjustments
  let rushSurcharge = 0;
  if (params.deliveryType === 'express') {
    rushSurcharge = 30; // Priority dispatch
  } else if (params.deliveryType === 'scheduled') {
    rushSurcharge = 15; // Reserved slot handling
  }

  const subtotal =
    baseFare +
    distanceFare +
    weightSurcharge +
    insuranceFee +
    multiStopSurcharge +
    codFee +
    rushSurcharge;

  const totalFare = Math.max(vehicleConfig.minFare, subtotal);

  return {
    baseFare,
    distanceFare,
    weightSurcharge,
    insuranceFee,
    multiStopSurcharge,
    codFee,
    rushSurcharge,
    subtotal,
    totalFare,
  };
}

/**
 * Generate a 4-digit PIN for recipient delivery verification
 */
export function generateDeliveryPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a pickup verification code (e.g. PU-732)
 */
export function generatePickupCode(): string {
  const code = Math.floor(100 + Math.random() * 900).toString();
  return `PU-${code}`;
}
