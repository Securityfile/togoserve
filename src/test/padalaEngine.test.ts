import { describe, it, expect } from 'vitest';
import {
  calculateVolumetricWeight,
  recommendVehicle,
  calculatePadalaFare,
  VEHICLE_CONFIGS,
  INSURANCE_TIERS,
  generateDeliveryPin,
  generatePickupCode,
} from '../services/padalaEngine';

describe('TOGO Padala Logistics Engine', () => {
  it('correctly calculates volumetric weight with standard metric (L*W*H)/3500', () => {
    // 35cm x 25cm x 10cm = 8750 / 3500 = 2.5 kg
    const volWeight = calculateVolumetricWeight(35, 25, 10);
    expect(volWeight).toBe(2.5);

    // Oversized box: 100cm x 80cm x 70cm = 560000 / 3500 = 160 kg
    const largeVol = calculateVolumetricWeight(100, 80, 70);
    expect(largeVol).toBe(160);

    // Zero dimensions return 0
    expect(calculateVolumetricWeight(0, 50, 50)).toBe(0);
  });

  it('recommends motorcycle for compact light parcels and larger vehicles for bulky cargo', () => {
    // 2 kg parcel fitting motorcycle dimensions
    const rec1 = recommendVehicle(2, 30, 20, 15);
    expect(rec1.vehicle.id).toBe('motorcycle');

    // 45 kg bulky luggage requiring sedan or MPV
    const rec2 = recommendVehicle(45, 90, 60, 50);
    expect(['sedan', 'mpv']).toContain(rec2.vehicle.id);

    // 500 kg commercial pallet requiring van
    const rec3 = recommendVehicle(500, 180, 100, 100);
    expect(rec3.vehicle.id).toBe('van');

    // 1200 kg heavy load requiring truck
    const rec4 = recommendVehicle(1200, 250, 150, 140);
    expect(rec4.vehicle.id).toBe('truck');
  });

  it('calculates deterministic fare including distance, weight surcharge, multi-stops, and insurance', () => {
    // Standard 5km motorcycle trip, express, standard insurance
    const fare = calculatePadalaFare({
      vehicleType: 'motorcycle',
      deliveryType: 'express',
      distanceKm: 5,
      dimensions: {
        weightKg: 2,
        lengthCm: 30,
        widthCm: 20,
        heightCm: 10,
        volumetricWeightKg: 1.7,
      },
      insuranceTierId: 'standard',
      numberOfStops: 1,
      requiresCod: false,
    });

    // base 60 + distance (5 * 12 = 60) + rush (30) = 150
    expect(fare.baseFare).toBe(60);
    expect(fare.distanceFare).toBe(60);
    expect(fare.rushSurcharge).toBe(30);
    expect(fare.insuranceFee).toBe(0);
    expect(fare.totalFare).toBe(150);

    // Multi-stop with COD and Plus insurance
    const multiStopFare = calculatePadalaFare({
      vehicleType: 'motorcycle',
      deliveryType: 'same_day',
      distanceKm: 10,
      dimensions: {
        weightKg: 3,
        lengthCm: 30,
        widthCm: 20,
        heightCm: 10,
        volumetricWeightKg: 1.7,
      },
      insuranceTierId: 'plus', // +25
      numberOfStops: 2, // +40 multi-stop
      requiresCod: true,
      codAmount: 1000, // 2% of 1000 = 20
    });

    // base 60 + dist (10 * 12 = 120) + insurance (25) + multi-stop (40) + cod (20) = 265
    expect(multiStopFare.baseFare).toBe(60);
    expect(multiStopFare.distanceFare).toBe(120);
    expect(multiStopFare.insuranceFee).toBe(25);
    expect(multiStopFare.multiStopSurcharge).toBe(40);
    expect(multiStopFare.codFee).toBe(20);
    expect(multiStopFare.totalFare).toBe(265);
  });

  it('generates valid 4-digit PIN and pickup verification codes', () => {
    const pin = generateDeliveryPin();
    expect(pin).toMatch(/^\d{4}$/);

    const code = generatePickupCode();
    expect(code).toMatch(/^PU-\d{3}$/);
  });
});
