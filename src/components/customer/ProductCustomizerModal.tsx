import React, { useState } from 'react';
import { Product, OrderItem } from '../../types';
import {
  X,
  Plus,
  Minus,
  Check,
  Clock,
  AlertTriangle,
  Upload,
  Calendar,
  Sparkles,
  ShieldCheck,
  Heart,
  FileText,
  BadgeAlert,
} from 'lucide-react';

interface ProductCustomizerModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: OrderItem) => void;
}

export const ProductCustomizerModal: React.FC<ProductCustomizerModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const catAttrs = product.categoryAttributes;
  const restaurantAttrs = catAttrs?.restaurant;
  const groceryAttrs = catAttrs?.grocery;
  const pharmacyAttrs = catAttrs?.pharmacy;
  const convenienceAttrs = catAttrs?.convenience;
  const retailAttrs = catAttrs?.retail;
  const flowerAttrs = catAttrs?.flowers;
  const petCareAttrs = catAttrs?.petCare;

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<{ [optionName: string]: string | string[] }>({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Vertical-specific states
  const [diningMode, setDiningMode] = useState<'delivery' | 'takeout' | 'dine_in'>(
    restaurantAttrs?.diningModes?.[0] || 'delivery'
  );
  const [substitutionPolicy, setSubstitutionPolicy] = useState<string>(
    groceryAttrs?.substitutionPolicy || 'best_alternative'
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    retailAttrs?.sizes?.[0] || ''
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    retailAttrs?.colors?.[0]?.name || ''
  );
  const [cardMessage, setCardMessage] = useState<string>('');
  const [selectedDeliverySlot, setSelectedDeliverySlot] = useState<string>(
    flowerAttrs?.guaranteedTimeSlots?.[0] || ''
  );
  const [isPrescriptionUploaded, setIsPrescriptionUploaded] = useState<boolean>(false);
  const [prescriptionFileName, setPrescriptionFileName] = useState<string>('');
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(false);

  // Calculate total price based on base price, variants and extra options
  let extraCost = 0;
  if (product.options) {
    product.options.forEach((opt) => {
      const selected = selectedOptions[opt.name];
      if (typeof selected === 'string') {
        const choice = opt.choices.find((c) => c.label === selected);
        if (choice) extraCost += choice.extraPrice;
      } else if (Array.isArray(selected)) {
        selected.forEach((selItem) => {
          const choice = opt.choices.find((c) => c.label === selItem);
          if (choice) extraCost += choice.extraPrice;
        });
      }
    });
  }

  // Variant matching for retail
  let variantPrice = product.price;
  if (retailAttrs?.variants && (selectedSize || selectedColor)) {
    const matched = retailAttrs.variants.find(
      (v) =>
        (!selectedSize || v.size === selectedSize) &&
        (!selectedColor || v.color === selectedColor)
    );
    if (matched) {
      variantPrice = matched.price;
    }
  }

  const unitPrice = variantPrice + extraCost;
  const totalPrice = unitPrice * quantity;

  const handleRadioSelect = (optionName: string, choiceLabel: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: choiceLabel,
    }));
  };

  const handleCheckboxToggle = (optionName: string, choiceLabel: string) => {
    setSelectedOptions((prev) => {
      const current = (prev[optionName] as string[]) || [];
      if (current.includes(choiceLabel)) {
        return { ...prev, [optionName]: current.filter((c) => c !== choiceLabel) };
      } else {
        return { ...prev, [optionName]: [...current, choiceLabel] };
      }
    });
  };

  const handleConfirm = () => {
    // Collect vertical summary into options
    const enrichedOptions: { [optionName: string]: string | string[] } = {
      ...selectedOptions,
    };

    if (restaurantAttrs) {
      enrichedOptions['Dining Mode'] = diningMode === 'delivery' ? 'Delivery' : diningMode === 'takeout' ? 'Takeout / Pick-up' : 'Dine-In';
    }
    if (groceryAttrs) {
      enrichedOptions['Substitution Preference'] =
        substitutionPolicy === 'best_alternative'
          ? 'Replace with Best Alternative'
          : substitutionPolicy === 'call_customer'
          ? 'Call Me Before Substituting'
          : 'Refund Immediately';
    }
    if (retailAttrs) {
      if (selectedSize) enrichedOptions['Size'] = selectedSize;
      if (selectedColor) enrichedOptions['Color'] = selectedColor;
    }
    if (flowerAttrs) {
      if (cardMessage.trim()) enrichedOptions['Greeting Card'] = cardMessage.trim();
      if (selectedDeliverySlot) enrichedOptions['Guaranteed Slot'] = selectedDeliverySlot;
    }
    if (pharmacyAttrs?.requiresPrescription) {
      enrichedOptions['Rx Verification'] = isPrescriptionUploaded
        ? `Uploaded (${prescriptionFileName || 'prescription.pdf'}) - Pharmacist Verification Pending`
        : 'Uploaded at checkout';
    }

    const item: OrderItem = {
      id: 'item_' + Date.now(),
      productId: product.id,
      name: product.name,
      price: unitPrice,
      quantity,
      image: product.image,
      selectedOptions: enrichedOptions,
      specialInstructions: specialInstructions.trim() || undefined,
      totalPrice,
    };
    onAddToCart(item);
    onClose();
  };

  const isAddToCartDisabled =
    (pharmacyAttrs?.requiresPrescription && !isPrescriptionUploaded) ||
    (convenienceAttrs?.requiresAgeVerification && !ageConfirmed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header Image */}
        <div className="relative h-44 sm:h-52 w-full bg-slate-100 shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Price badge */}
          <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span>₱{unitPrice}</span>
            {groceryAttrs?.pricingType === 'weight_based' && (
              <span className="text-slate-300 font-normal">/ {groceryAttrs.unitOfMeasure}</span>
            )}
          </div>

          {/* Category vertical indicator */}
          {catAttrs?.vertical && (
            <div className="absolute top-3 left-3 bg-white/90 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              {catAttrs.vertical}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-snug">{product.name}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {product.description}
            </p>

            {/* SKU and stock info */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
              <span>SKU: {product.sku}</span>
              <span>·</span>
              <span className={product.stock > 5 ? 'text-emerald-600' : 'text-amber-600'}>
                {product.stock > 0 ? `${product.stock} units available` : 'Sold out'}
              </span>
            </div>
          </div>

          {/* ==================================================== */}
          {/* 1. RESTAURANTS SPECIFICS */}
          {/* ==================================================== */}
          {restaurantAttrs && (
            <div className="bg-orange-50/60 border border-orange-200/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-orange-900">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  <span>Prep Time: {restaurantAttrs.preparationTimeMinutes.min}-{restaurantAttrs.preparationTimeMinutes.max} mins</span>
                </div>
                {restaurantAttrs.servingSize && (
                  <span className="text-[11px] text-orange-700">{restaurantAttrs.servingSize}</span>
                )}
              </div>

              {/* Allergen Warning Banner */}
              {restaurantAttrs.allergenWarnings.length > 0 && (
                <div className="flex items-start gap-1.5 text-xs text-amber-800 bg-white/80 p-2 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Allergen Notice: </span>
                    <span>Contains {restaurantAttrs.allergenWarnings.join(', ')}</span>
                  </div>
                </div>
              )}

              {/* Dining Mode Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Dining Mode:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {restaurantAttrs.diningModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDiningMode(mode)}
                      className={`py-1.5 px-2 rounded-lg border font-semibold capitalize transition cursor-pointer ${
                        diningMode === mode
                          ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {mode === 'dine_in' ? 'Dine-In' : mode === 'takeout' ? 'Takeout' : 'Delivery'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. GROCERIES SPECIFICS */}
          {/* ==================================================== */}
          {groceryAttrs && (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">
                  {groceryAttrs.pricingType === 'weight_based' ? '⚖️ Weight-Based Pricing' : '📦 Pack Pricing'}
                </span>
                <span className="text-[11px] text-emerald-700">
                  Storage: <strong className="capitalize">{groceryAttrs.storageCondition}</strong>
                </span>
              </div>

              {/* Out-of-Stock Substitution Preference */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  If item is out of stock at store:
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    { id: 'best_alternative', label: 'Replace with best alternative fresh item' },
                    { id: 'call_customer', label: 'Call me before picking a substitution' },
                    { id: 'refund_immediately', label: 'Do not substitute; refund item' },
                  ].map((sub) => (
                    <label
                      key={sub.id}
                      onClick={() => setSubstitutionPolicy(sub.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                        substitutionPolicy === sub.id
                          ? 'border-emerald-600 bg-white text-emerald-950 font-medium'
                          : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="grocery_substitution"
                        checked={substitutionPolicy === sub.id}
                        onChange={() => setSubstitutionPolicy(sub.id)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{sub.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 3. PHARMACY SPECIFICS */}
          {/* ==================================================== */}
          {pharmacyAttrs && (
            <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-bold text-rose-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  <span>FDA Reg: {pharmacyAttrs.fdaRegistrationNumber}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  pharmacyAttrs.requiresPrescription ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {pharmacyAttrs.requiresPrescription ? 'Rx - Prescription Required' : 'OTC - Over The Counter'}
                </span>
              </div>

              {/* Dosage Guideline */}
              <div className="text-xs bg-white/90 p-2.5 rounded-lg border border-rose-200 space-y-1">
                <span className="font-bold text-slate-700 block">Dosage Guideline:</span>
                <p className="text-slate-600 leading-relaxed">{pharmacyAttrs.dosageGuideline}</p>
                <div className="pt-1 text-[11px] text-slate-500">
                  Active Ingredients: {pharmacyAttrs.activeIngredients.join(', ')}
                </div>
              </div>

              {/* Prescription Upload Required if Rx */}
              {pharmacyAttrs.requiresPrescription && (
                <div className="border border-dashed border-rose-300 bg-white p-3 rounded-xl text-center space-y-2">
                  <BadgeAlert className="w-5 h-5 text-rose-600 mx-auto" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Physician Prescription Required</span>
                    <span className="text-slate-500 text-[11px]">
                      Philippine FDA regulations require a licensed pharmacist to review your Rx before dispensing.
                    </span>
                  </div>

                  {isPrescriptionUploaded ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-2">
                      <Check className="w-3.5 h-3.5" />
                      <span>Rx Attached: {prescriptionFileName || 'prescription_upload.pdf'}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPrescriptionUploaded(true);
                        setPrescriptionFileName('Doc_Santos_Rx_Amoxicillin.pdf');
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Prescription Photo/PDF</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* 4. RETAIL SPECIFICS */}
          {/* ==================================================== */}
          {retailAttrs && (
            <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3.5 space-y-3">
              {/* Size Selector */}
              {retailAttrs.sizes && retailAttrs.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800">Select Size:</span>
                    <span className="text-[11px] text-purple-700">Size: {selectedSize}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {retailAttrs.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          selectedSize === size
                            ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Swatches */}
              {retailAttrs.colors && retailAttrs.colors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800">Select Color:</span>
                    <span className="text-[11px] text-purple-700">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {retailAttrs.colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          selectedColor === color.name
                            ? 'border-purple-600 bg-white text-purple-950 ring-2 ring-purple-600/30 font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Return Policy Notice */}
              <div className="text-[11px] text-slate-500 pt-1 border-t border-purple-100 flex items-center justify-between">
                <span>Return Policy: <strong>{retailAttrs.returnPolicy.replace(/_/g, ' ')}</strong></span>
                {retailAttrs.material && <span>{retailAttrs.material}</span>}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 5. FLOWERS SPECIFICS */}
          {/* ==================================================== */}
          {flowerAttrs && (
            <div className="bg-pink-50/60 border border-pink-200/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-pink-900 capitalize">
                  Arrangement: {flowerAttrs.arrangementType.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-pink-700">
                  {flowerAttrs.freshnessGuaranteeDays}-Day Freshness Guarantee
                </span>
              </div>

              {/* Free Card Message Input */}
              {flowerAttrs.allowCardMessage && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-pink-600" />
                      Free Gift Card Message:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {cardMessage.length}/{flowerAttrs.cardMessageMaxLength}
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={flowerAttrs.cardMessageMaxLength}
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    placeholder="Write a sweet note to the recipient (printed on embossed card)..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  />
                </div>
              )}

              {/* Delivery Time Slot Guarantee */}
              {flowerAttrs.guaranteedTimeSlots.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-pink-600" />
                    Delivery Time Slot Guarantee:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                    {flowerAttrs.guaranteedTimeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedDeliverySlot(slot)}
                        className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer text-[11px] ${
                          selectedDeliverySlot === slot
                            ? 'border-pink-600 bg-pink-600 text-white font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* 6. PET CARE SPECIFICS */}
          {/* ==================================================== */}
          {petCareAttrs && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">
                  Target Pet: {petCareAttrs.targetPet.map((p) => p.toUpperCase()).join(', ')}
                </span>
                <span className="text-[11px] text-amber-700 capitalize">
                  Life Stage: {petCareAttrs.lifeStage.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {petCareAttrs.dietaryTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-white border border-amber-300 text-amber-800 px-2 py-0.5 rounded-md capitalize"
                  >
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
              {petCareAttrs.vetPrescriptionRequired && (
                <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                  ⚠️ Veterinary Diet: Formulated under veterinarian supervision.
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* 7. CONVENIENCE SPECIFICS */}
          {/* ==================================================== */}
          {convenienceAttrs?.requiresAgeVerification && (
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <BadgeAlert className="w-4 h-4 text-amber-600" />
                <span>Age-Restricted Item (18+)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Philippine law prohibits the sale of alcohol, tobacco, or vaporized nicotine products to minors. Courier will inspect a valid government ID upon delivery.
              </p>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>I confirm I am 18 years of age or older.</span>
              </label>
            </div>
          )}

          {/* Standard Modifiers & Options */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {product.options.map((opt) => (
                <div key={opt.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{opt.name}</span>
                    {opt.required ? (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                        Required
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Optional</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {opt.choices.map((choice) => {
                      const isSelected =
                        opt.type === 'radio'
                          ? selectedOptions[opt.name] === choice.label
                          : ((selectedOptions[opt.name] as string[]) || []).includes(choice.label);

                      return (
                        <div
                          key={choice.id}
                          onClick={() =>
                            opt.type === 'radio'
                              ? handleRadioSelect(opt.name, choice.label)
                              : handleCheckboxToggle(opt.name, choice.label)
                          }
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-medium'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-${opt.type === 'radio' ? 'full' : 'md'} border flex items-center justify-center ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>{choice.label}</span>
                          </div>
                          {choice.extraPrice > 0 && (
                            <span className="font-semibold text-emerald-700">
                              +₱{choice.extraPrice}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Instructions / Kitchen Notes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800">
              Special Instructions / Notes
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra calamansi, separate sauce, less ice, leave at lobby..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-bold text-xs text-slate-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            disabled={isAddToCartDisabled}
            onClick={handleConfirm}
            className={`flex-1 font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-between transition cursor-pointer ${
              isAddToCartDisabled
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            <span>
              {pharmacyAttrs?.requiresPrescription && !isPrescriptionUploaded
                ? 'Upload Rx to Add'
                : convenienceAttrs?.requiresAgeVerification && !ageConfirmed
                ? 'Verify 18+ Age to Add'
                : 'Add to Cart'}
            </span>
            <span>₱{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
