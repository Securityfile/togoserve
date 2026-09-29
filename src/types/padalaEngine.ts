import { PhilippineAddress } from './index';

export type PadalaVehicleType = 'motorcycle' | 'sedan' | 'mpv' | 'van' | 'truck';

export interface PadalaVehicleConfig {
  id: PadalaVehicleType;
  label: string;
  category: string;
  maxWeightKg: number;
  maxDimensionsCm: {
    length: number;
    width: number;
    height: number;
  };
  baseFare: number;
  perKmRate: number;
  minFare: number;
  description: string;
  recommendedFor: string[];
}

export type PadalaDeliveryType = 'express' | 'same_day' | 'scheduled' | 'multi_stop';

export type PadalaHandlingTag =
  | 'fragile'
  | 'keep_upright'
  | 'document'
  | 'perishable'
  | 'high_value'
  | 'cold_insulated';

export interface PadalaInsuranceTier {
  id: string;
  label: string;
  maxCoveragePhp: number;
  feePhp: number;
  description: string;
}

export interface ElectronicProofOfDelivery {
  recipientSignatureUrl?: string;
  recipientName?: string;
  recipientRelationship?: string; // e.g. "Self", "Security Guard", "Authorized Representative"
  parcelPhotoUrl?: string;
  deliveryPinVerified: boolean;
  deliveryPinEntered?: string;
  deliveredAt?: string;
  handoverNotes?: string;
}

export interface PadalaWaypoint {
  id: string;
  stopNumber: number;
  recipientName: string;
  recipientPhone: string;
  address: string;
  landmark?: string;
  instructions?: string;
  itemDescription?: string;
  codAmount?: number;
  status: 'pending' | 'arrived' | 'completed' | 'failed';
  epod?: ElectronicProofOfDelivery;
}

export interface PadalaParcelDimensions {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
}

export interface PadalaFareBreakdown {
  baseFare: number;
  distanceFare: number;
  weightSurcharge: number;
  insuranceFee: number;
  multiStopSurcharge: number;
  codFee: number;
  rushSurcharge: number;
  subtotal: number;
  totalFare: number;
}

export interface PadalaBookingRequest {
  id: string;
  senderName: string;
  senderPhone: string;
  senderAddress: PhilippineAddress;
  vehicleType: PadalaVehicleType;
  deliveryType: PadalaDeliveryType;
  scheduledPickupTime?: string;
  parcelDimensions: PadalaParcelDimensions;
  itemDescription: string;
  declaredValuePhp: number;
  insuranceTierId?: string;
  specialHandlingTags: PadalaHandlingTag[];
  waypoints: PadalaWaypoint[];
  requiresCod: boolean;
  totalCodAmount?: number;
  fareBreakdown: PadalaFareBreakdown;
  pickupPin: string;
  epodRequirement: {
    requireSignature: boolean;
    requirePhoto: boolean;
    requirePin: boolean;
  };
  createdAt: string;
}
