import React, { useState } from 'react';
import { Product, OrderItem } from '../../types';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';

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

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<{ [optionName: string]: string | string[] }>({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Calculate total price based on base price and extra options
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

  const unitPrice = product.price + extraCost;
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
    const item: OrderItem = {
      id: 'item_' + Date.now(),
      productId: product.id,
      name: product.name,
      price: unitPrice,
      quantity,
      image: product.image,
      selectedOptions,
      specialInstructions: specialInstructions.trim() || undefined,
      totalPrice,
    };
    onAddToCart(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header Image */}
        <div className="relative h-48 w-full bg-slate-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-md">
            ₱{product.price}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">{product.name}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Options */}
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

          {/* Special Instructions */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800">
              Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra calamansi & chili, separate sauce, less sweet..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 transition"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-bold text-xs text-slate-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleConfirm}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-between transition"
          >
            <span>Add to Cart</span>
            <span>₱{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
