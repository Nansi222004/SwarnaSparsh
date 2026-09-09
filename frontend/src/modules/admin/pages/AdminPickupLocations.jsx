import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Plus, Edit3, Trash2, Star, RefreshCw, CheckCircle,
  XCircle, AlertTriangle, X, Loader2, Building2, Phone, User, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../services/adminService';

// ── Sync Status Badge ─────────────────────────────────────────────────────────
const SyncBadge = ({ shiprocket }) => {
  if (shiprocket?.synced) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" />
        Shiprocket Synced
      </span>
    );
  }
  if (shiprocket?.syncError) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"
        title={shiprocket.syncError}
      >
        <XCircle className="w-3 h-3" />
        Sync Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <AlertTriangle className="w-3 h-3" />
      Pending Sync
    </span>
  );
};

// ── Location Form Modal ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  warehouseName: '',
  contactPerson: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false,
};

const LocationFormModal = ({ location, onClose, onSaved }) => {
  const isEdit = !!location;
  const [form, setForm] = useState(
    isEdit
      ? {
          warehouseName: location.warehouseName || '',
          contactPerson: location.contactPerson || '',
          phone: location.phone || '',
          email: location.email || '',
          addressLine1: location.addressLine1 || '',
          addressLine2: location.addressLine2 || '',
          city: location.city || '',
          state: location.state || '',
          pincode: location.pincode || '',
          country: location.country || 'India',
          isDefault: location.isDefault || location.isStoreDefault || false,
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.warehouseName || !form.contactPerson || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode) {
      setFormError('Please fill all required fields.');
      return;
    }

    const trimmedPhone = String(form.phone || '').trim();
    if (!/^\d{10}$/.test(trimmedPhone)) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }
    const trimmedCity = String(form.city || '').trim();
    if (!/^[A-Za-z\s]+$/.test(trimmedCity)) {
      setFormError('City should contain only alphabets.');
      return;
    }
    const trimmedState = String(form.state || '').trim();
    if (!/^[A-Za-z\s]+$/.test(trimmedState)) {
      setFormError('State should contain only alphabets.');
      return;
    }
    const trimmedPincode = String(form.pincode || '').trim();
    if (!/^\d{6}$/.test(trimmedPincode)) {
      setFormError('Pincode must be exactly 6 digits.');
      return;
    }

    const trimmedAddress = String(form.addressLine1 || '').trim();
    if (trimmedAddress.length < 10) {
      setFormError('Address Line 1 must be at least 10 characters long.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await adminService.updatePickupLocation(location._id, form);
        toast.success('Warehouse location updated successfully');
      } else {
        await adminService.createPickupLocation(form);
        toast.success('Warehouse location created. Syncing with Shiprocket.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EFEBE9]">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-black text-[#3E2723] uppercase tracking-tight">
              {isEdit ? 'Edit Dispatch Warehouse' : 'Add Store Warehouse'}
            </h2>
            <p className="text-xs text-gray-500 font-medium">Used for Shiprocket courier pickups and shipping labels</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Warehouse / Location Name *
            </label>
            <input
              name="warehouseName"
              value={form.warehouseName}
              onChange={handleChange}
              placeholder="e.g. Swarna Sparsh Main Vault / Wani Dispatch"
              disabled={isEdit}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63] disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Contact Person *
              </label>
              <input
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                placeholder="Manager / Dispatch Officer"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Phone (10 digits) *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength={10}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="dispatch@swarnasparsh.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Address Line 1 *
            </label>
            <input
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              placeholder="Shop / Building No., Street name"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Address Line 2 (Area / Landmark)
            </label>
            <input
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="Near Gandhi Chowk, Sarafa Lane"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">City *</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Wani"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">State *</label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="Maharashtra"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Pincode *</label>
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="445304"
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isDefault"
                checked={form.isDefault}
                onChange={handleChange}
                className="w-4 h-4 text-[#8D6E63] rounded border-gray-300 focus:ring-[#8D6E63]"
              />
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Set as Primary Store Dispatch Warehouse
              </span>
            </label>
            <p className="text-[11px] text-gray-500 ml-7 mt-0.5">
              Default origin used automatically for serviceability checks and Shiprocket shipments.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3E2723] hover:bg-[#2e1d1a] text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
const AdminPickupLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getPickupLocations();
      setLocations(data);
    } catch (err) {
      toast.error('Failed to load dispatch locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSetDefault = async (loc) => {
    try {
      await adminService.setDefaultPickupLocation(loc._id);
      toast.success(`"${loc.warehouseName}" is now the primary store warehouse`);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update default warehouse');
    }
  };

  const handleSyncShiprocket = async (loc) => {
    setSyncingId(loc._id);
    try {
      await adminService.syncShiprocketLocation(loc._id);
      toast.success(`"${loc.warehouseName}" synced with Shiprocket`);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Shiprocket sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (loc) => {
    if (!window.confirm(`Are you sure you want to delete "${loc.warehouseName}"?`)) return;
    try {
      await adminService.deletePickupLocation(loc._id);
      toast.success('Location deleted');
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete location');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8D6E63] uppercase tracking-widest mb-1">
            <Building2 className="w-4 h-4" /> Store Logistics & Logistics Hub
          </div>
          <h1 className="text-2xl font-black text-[#3E2723] uppercase tracking-tight">
            Dispatch Warehouses & Pickup Locations
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage origin warehouses for Shiprocket courier pickup, AWB generation, and manifest printing.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingLocation(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#3E2723] hover:bg-[#2e1d1a] text-white text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Store Warehouse
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#8D6E63]" />
          <span className="text-xs font-bold uppercase tracking-wider">Loading dispatch locations...</span>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFEBE9] p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#FDFBF7] border border-[#EFEBE9] text-[#8D6E63] flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No dispatch warehouses configured</h3>
            <p className="text-xs text-gray-500 mt-1">
              Add your primary store warehouse address so Shiprocket and partner couriers can pick up customer orders.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingLocation(null);
              setModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#3E2723] text-white text-xs font-bold"
          >
            Add Primary Warehouse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => {
            const isPrimary = loc.isDefault || loc.isStoreDefault;
            return (
              <div
                key={loc._id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isPrimary ? 'border-[#8D6E63] ring-1 ring-[#8D6E63]/30 bg-gradient-to-b from-[#FDFBF7] to-white' : 'border-gray-100'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-[#3E2723] uppercase tracking-tight">
                          {loc.warehouseName}
                        </h3>
                        {isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-[#8D6E63] text-white tracking-widest uppercase">
                            <Star className="w-2.5 h-2.5 fill-white" /> Primary Origin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {loc.city}, {loc.state} - {loc.pincode}
                      </p>
                    </div>
                    <SyncBadge shiprocket={loc.shiprocket} />
                  </div>

                  <div className="space-y-1.5 py-3 border-y border-gray-50 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-800">{loc.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{loc.phone}</span>
                    </div>
                    {loc.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{loc.email}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-gray-500 pt-1 leading-relaxed">
                      {loc.addressLine1}
                      {loc.addressLine2 ? `, ${loc.addressLine2}` : ''}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isPrimary && (
                      <button
                        onClick={() => handleSetDefault(loc)}
                        className="text-[11px] font-bold text-[#8D6E63] hover:underline"
                      >
                        Make Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleSyncShiprocket(loc)}
                      disabled={syncingId === loc._id}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                      title="Sync with Shiprocket"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingId === loc._id ? 'animate-spin text-[#8D6E63]' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingLocation(loc);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!isPrimary && (
                      <button
                        onClick={() => handleDelete(loc)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <LocationFormModal
          location={editingLocation}
          onClose={() => {
            setModalOpen(false);
            setEditingLocation(null);
          }}
          onSaved={fetchLocations}
        />
      )}
    </div>
  );
};

export default AdminPickupLocations;
