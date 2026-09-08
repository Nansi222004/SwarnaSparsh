import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Plus, Edit3, Trash2, Star, RefreshCw, CheckCircle,
  XCircle, AlertTriangle, X, Loader2, Building2, Phone, User, Mail
} from 'lucide-react';
import { pickupLocationService } from '../services/pickupLocationService';

// ── Sync Status Badge ─────────────────────────────────────────────────────────
const SyncBadge = ({ shiprocket }) => {
  if (shiprocket?.synced) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" />
        SR Synced
      </span>
    );
  }
  if (shiprocket?.syncError) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"
        title={shiprocket.syncError}>
        <XCircle className="w-3 h-3" />
        Sync Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <AlertTriangle className="w-3 h-3" />
      Not Synced
    </span>
  );
};

// ── Location Form Modal ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  warehouseName: '', contactPerson: '', phone: '', email: '',
  addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India',
  isDefault: false,
};

const LocationFormModal = ({ location, onClose, onSaved }) => {
  const isEdit = !!location;
  const [form, setForm] = useState(isEdit ? {
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
    isDefault: location.isDefault || false,
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
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
    const hasDigits = /\d/.test(trimmedAddress);
    const hasAddressKeywords = /(road|plot|house|flat|building|bldg|no|floor|block|ward|street|st|lane|society|apartments|apt)/i.test(trimmedAddress);
    if (!hasDigits && !hasAddressKeywords) {
      setFormError('Address Line 1 must contain a house number, flat number, road name, or plot number (e.g. Flat 101 or Road No. 5).');
      return;
    }

    setSaving(true);
    try {
      let saved;
      if (isEdit) {
        saved = await pickupLocationService.update(location._id, form);
      } else {
        saved = await pickupLocationService.create(form);
      }
      onSaved(saved);
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E2723]/20 focus:border-[#3E2723] transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#3E2723] rounded-xl flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? 'Edit Pickup Location' : 'Add Pickup Location'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" /> {formError}
            </div>
          )}

          {/* Warehouse Name */}
          <div>
            <label className={labelCls}>Warehouse Name <span className="text-red-500">*</span></label>
            <input name="warehouseName" value={form.warehouseName} onChange={handleChange}
              placeholder="e.g. Mumbai Warehouse" className={inputCls}
              disabled={isEdit} // Name is immutable after creation (used as Shiprocket pickup_location)
            />
            {isEdit && <p className="text-[10px] text-gray-400 mt-1">Name cannot be changed after creation (used as Shiprocket identifier)</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Contact Person <span className="text-red-500">*</span></label>
              <input name="contactPerson" value={form.contactPerson} onChange={handleChange}
                placeholder="Full name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
              <input name="phone" type="tel" inputMode="numeric" pattern="[0-9]*" value={form.phone} onChange={handleChange}
                placeholder="10-digit mobile" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="pickup@example.com" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Address Line 1 <span className="text-red-500">*</span></label>
            <input name="addressLine1" value={form.addressLine1} onChange={handleChange}
              placeholder="Shop/Building No., Street" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Address Line 2</label>
            <input name="addressLine2" value={form.addressLine2} onChange={handleChange}
              placeholder="Area, Landmark (optional)" className={inputCls} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>City <span className="text-red-500">*</span></label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="City" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State <span className="text-red-500">*</span></label>
              <input name="state" value={form.state} onChange={handleChange} placeholder="State" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pincode <span className="text-red-500">*</span></label>
              <input name="pincode" type="text" inputMode="numeric" pattern="[0-9]*" value={form.pincode} onChange={handleChange} placeholder="6 digits" className={inputCls} />
            </div>
          </div>

          {/* Default toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange}
              className="w-4 h-4 accent-[#3E2723]" />
            <div>
              <span className="text-sm font-semibold text-gray-800">Set as default pickup location</span>
              <p className="text-xs text-gray-500">Used automatically for Shiprocket shipments</p>
            </div>
          </label>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#3E2723] text-white text-sm font-semibold hover:bg-[#2D1B18] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Update Location' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SellerPickupLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pickupLocationService.list();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load pickup locations:', err);
      showToast('Failed to load pickup locations', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const handleSaved = (saved) => {
    setShowForm(false);
    setEditingLocation(null);
    showToast(saved ? 'Pickup location saved! Shiprocket sync in progress.' : 'Saved.');
    fetchLocations();
  };

  const handleSetDefault = async (loc) => {
    setActionLoading(`default_${loc._id}`);
    try {
      await pickupLocationService.setDefault(loc._id);
      showToast(`"${loc.warehouseName}" set as default pickup location`);
      fetchLocations();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to set default', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async (loc) => {
    setActionLoading(`sync_${loc._id}`);
    try {
      await pickupLocationService.syncWithShiprocket(loc._id);
      showToast(`"${loc.warehouseName}" synced with Shiprocket`);
      fetchLocations();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Shiprocket sync failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (loc) => {
    if (!window.confirm(`Delete "${loc.warehouseName}"? This cannot be undone.`)) return;
    setActionLoading(`delete_${loc._id}`);
    try {
      await pickupLocationService.delete(loc._id);
      showToast(`"${loc.warehouseName}" deleted`);
      fetchLocations();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] p-4 md:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3E2723] rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            Pickup Locations
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your warehouse/pickup addresses. Synced with Shiprocket automatically.</p>
        </div>
        <button
          onClick={() => { setEditingLocation(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3E2723] text-white text-sm font-bold hover:bg-[#2D1B18] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Shiprocket Integration</p>
          <p className="text-xs text-blue-600 mt-0.5">
            When you add a pickup location, it is automatically synced with Shiprocket. 
            The <strong>default</strong> location is used when creating Shiprocket shipments. 
            Delhivery & Blue Dart continue using your shop address from your profile.
          </p>
        </div>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#3E2723]" />
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-700 font-bold text-lg">No pickup locations yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Add your warehouse addresses to create Shiprocket shipments</p>
          <button
            onClick={() => { setEditingLocation(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3E2723] text-white rounded-xl text-sm font-bold hover:bg-[#2D1B18] transition-all"
          >
            <Plus className="w-4 h-4" /> Add First Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div key={loc._id}
              className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md relative ${
                loc.isDefault ? 'border-[#3E2723]/40 ring-2 ring-[#3E2723]/10' : 'border-gray-100'
              }`}
            >
              {/* Default badge */}
              {loc.isDefault && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3E2723] text-white">
                    <Star className="w-3 h-3" fill="currentColor" /> Default
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className="w-4 h-4 text-[#3E2723]" />
                  <h3 className="text-sm font-black text-gray-900">{loc.warehouseName}</h3>
                </div>
                <SyncBadge shiprocket={loc.shiprocket} />
              </div>

              {/* Details */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {loc.contactPerson}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {loc.phone}
                </div>
                {loc.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {loc.email}
                  </div>
                )}
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>
                    {[loc.addressLine1, loc.addressLine2, loc.city, loc.state, loc.pincode]
                      .filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                {!loc.isDefault && (
                  <button
                    onClick={() => handleSetDefault(loc)}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all disabled:opacity-50"
                  >
                    {actionLoading === `default_${loc._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleSync(loc)}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all disabled:opacity-50"
                >
                  {actionLoading === `sync_${loc._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Sync SR
                </button>
                <button
                  onClick={() => { setEditingLocation(loc); setShowForm(true); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                {!loc.isDefault && (
                  <button
                    onClick={() => handleDelete(loc)}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    {actionLoading === `delete_${loc._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <LocationFormModal
          location={editingLocation}
          onClose={() => { setShowForm(false); setEditingLocation(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default SellerPickupLocations;
