import React, { useState } from 'react';
import { PhilippineAddress } from '../../types';
import { SAVED_ADDRESSES } from '../../data/mockData';
import { X, MapPin, Plus, Check, Home, Building2, Navigation } from 'lucide-react';

interface AddressSelectorModalProps {
  isOpen: boolean;
  currentAddress: PhilippineAddress;
  onSelectAddress: (addr: PhilippineAddress) => void;
  onClose: () => void;
}

export const AddressSelectorModal: React.FC<AddressSelectorModalProps> = ({
  isOpen,
  currentAddress,
  onSelectAddress,
  onClose,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'select' | 'new'>('select');
  const [newAddr, setNewAddr] = useState<PhilippineAddress>({
    region: 'National Capital Region (NCR)',
    province: 'Metro Manila',
    city: 'Taguig City',
    barangay: 'Fort Bonifacio (BGC)',
    street: '',
    village: '',
    building: '',
    unitNumber: '',
    postalCode: '1634',
    landmark: '',
    instructions: '',
    coordinates: { lat: 14.5503, lng: 121.0504 },
  });

  const handleSaveNew = () => {
    if (!newAddr.street || !newAddr.barangay || !newAddr.city) {
      alert('Please fill out Street, Barangay, and City.');
      return;
    }
    onSelectAddress(newAddr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Delivery Address</h3>
              <p className="text-[11px] text-slate-400">Philippine Barangay & Village System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {mode === 'select' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Saved Addresses</span>
                <button
                  onClick={() => setMode('new')}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              <div className="space-y-2">
                {SAVED_ADDRESSES.map((addr, idx) => {
                  const isSelected =
                    currentAddress.barangay === addr.barangay &&
                    currentAddress.unitNumber === addr.unitNumber;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        onSelectAddress(addr);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            {addr.building ? <Building2 className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {addr.building ? addr.building : addr.village || addr.street}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {addr.unitNumber ? `${addr.unitNumber}, ` : ''}{addr.street}, Brgy. {addr.barangay}, {addr.city}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      {addr.instructions && (
                        <div className="mt-2 text-[11px] bg-white border border-slate-200/80 rounded-lg p-2 text-slate-600">
                          <strong className="text-slate-800">Rider Note: </strong>
                          "{addr.instructions}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">New Philippine Address</span>
                <button
                  onClick={() => setMode('select')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Back to saved
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Region</label>
                  <input
                    type="text"
                    value={newAddr.region}
                    onChange={(e) => setNewAddr({ ...newAddr, region: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Province / Metro</label>
                  <input
                    type="text"
                    value={newAddr.province}
                    onChange={(e) => setNewAddr({ ...newAddr, province: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">City / Municipality *</label>
                  <input
                    type="text"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    placeholder="e.g. Taguig City, Makati"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Barangay *</label>
                  <input
                    type="text"
                    value={newAddr.barangay}
                    onChange={(e) => setNewAddr({ ...newAddr, barangay: e.target.value })}
                    placeholder="e.g. Fort Bonifacio, San Lorenzo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Street & Subdivision / Village *</label>
                <input
                  type="text"
                  value={newAddr.street}
                  onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                  placeholder="e.g. 5th Ave corner 26th St, Bel-Air Village"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Building / Condo</label>
                  <input
                    type="text"
                    value={newAddr.building}
                    onChange={(e) => setNewAddr({ ...newAddr, building: e.target.value })}
                    placeholder="e.g. Serendra Tower 2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">House / Unit #</label>
                  <input
                    type="text"
                    value={newAddr.unitNumber}
                    onChange={(e) => setNewAddr({ ...newAddr, unitNumber: e.target.value })}
                    placeholder="e.g. Unit 12-F, House #45"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Landmark</label>
                <input
                  type="text"
                  value={newAddr.landmark}
                  onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                  placeholder="e.g. Across Market! Market!, beside 7-Eleven"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Delivery Instructions for Rider</label>
                <textarea
                  value={newAddr.instructions}
                  onChange={(e) => setNewAddr({ ...newAddr, instructions: e.target.value })}
                  placeholder="e.g. 'Blue gate beside barangay hall', 'Call upon reaching subdivision guardhouse'..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs resize-none"
                />
              </div>

              <button
                onClick={handleSaveNew}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition"
              >
                Save & Use This Address
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
