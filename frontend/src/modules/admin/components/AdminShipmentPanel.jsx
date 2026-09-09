import React, { useState, useEffect } from 'react';
import {
  Truck, Package, MapPin, CheckCircle, XCircle, AlertTriangle,
  Loader2, ExternalLink, Download, RefreshCw, X, FileText, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../services/adminService';
import ShipmentTimeline from '../../shared/components/ShipmentTimeline';

const COURIERS = [
  { id: 'shiprocket', name: 'Shiprocket', desc: 'Smart Courier Selection & Automatic AWB Generation', disabled: false },
  { id: 'delhivery',  name: 'Delhivery',  desc: 'Direct Integration (Temporarily routed via Shiprocket)', disabled: true },
  { id: 'bluedart',   name: 'Blue Dart',   desc: 'Direct Integration (Temporarily routed via Shiprocket)', disabled: true },
];

const AdminShipmentPanel = ({ order, onShipmentCreated }) => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [requestingPickup, setRequestingPickup] = useState(false);
  const [generatingManifest, setGeneratingManifest] = useState(false);

  // Form state
  const [selectedCourier, setSelectedCourier] = useState('shiprocket');
  const [packageInfo, setPackageInfo] = useState({ weight: '500', length: '15', breadth: '12', height: '8' });
  const [paymentMode, setPaymentMode] = useState(order?.paymentMethod === 'cod' ? 'cod' : 'prepaid');
  const [codAmount, setCodAmount] = useState(order?.totalAmount || order?.total || 0);

  // Pickup location state
  const [pickupLocations, setPickupLocations] = useState([]);
  const [selectedPickupLocationId, setSelectedPickupLocationId] = useState('');
  const [loadingPickupLocations, setLoadingPickupLocations] = useState(false);

  // Serviceability
  const [serviceability, setServiceability] = useState(null);
  const [checkingService, setCheckingService] = useState(false);

  const orderId = order?._id || order?.id;

  useEffect(() => {
    if (orderId) {
      fetchShipments();
      loadPickupLocations();
    }
  }, [orderId]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const data = await adminService.getOrderShipments(orderId);
      setShipments(data);
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPickupLocations = async () => {
    setLoadingPickupLocations(true);
    try {
      const locs = await adminService.getPickupLocations();
      setPickupLocations(locs);
      const def = locs.find((l) => l.isDefault || l.isStoreDefault);
      if (def) setSelectedPickupLocationId(def._id);
    } catch (err) {
      console.error('Failed to load store pickup locations:', err);
    } finally {
      setLoadingPickupLocations(false);
    }
  };

  const handleCourierSelect = (courierId) => {
    const courier = COURIERS.find((c) => c.id === courierId);
    if (courier?.disabled) return;
    setSelectedCourier(courierId);
    setServiceability(null);
  };

  const checkServiceability = async () => {
    if (!selectedCourier) return;
    setCheckingService(true);
    setServiceability(null);
    try {
      const customerPincode = order?.shippingAddress?.pincode || order?.address?.zip || '';
      if (!customerPincode) {
        setServiceability({ serviceable: false, message: 'Customer delivery pincode is missing on this order' });
        return;
      }
      const result = await adminService.checkShippingServiceability({
        courier: selectedCourier,
        deliveryPincode: customerPincode,
        paymentMode,
        weight: Number(packageInfo.weight) || 500,
        pickupLocationId: selectedPickupLocationId || undefined,
      });
      setServiceability(result);
      if (result.serviceable) {
        toast.success(`Route serviceable via ${result.availableCouriers?.length || 1} partner carriers`);
      } else {
        toast.error(result.message || 'Pincode not serviceable');
      }
    } catch (err) {
      setServiceability({ serviceable: false, message: err.response?.data?.message || 'Check failed' });
      toast.error(err.response?.data?.message || 'Serviceability check failed');
    } finally {
      setCheckingService(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedCourier) {
      toast.error('Please select a courier');
      return;
    }
    if (!packageInfo.weight || !packageInfo.length || !packageInfo.breadth || !packageInfo.height) {
      toast.error('Please fill package weight and all dimensions');
      return;
    }

    setCreating(true);
    try {
      const result = await adminService.createOrderShipment(orderId, {
        courier: selectedCourier,
        packageInfo: {
          weight: Number(packageInfo.weight),
          length: Number(packageInfo.length),
          breadth: Number(packageInfo.breadth),
          height: Number(packageInfo.height),
        },
        paymentMode,
        codAmount: paymentMode === 'cod' ? Number(codAmount) : 0,
        pickupLocationId: selectedPickupLocationId || undefined,
      });

      toast.success(`Shipment created! AWB: ${result.shipment?.awbNumber}`);
      setShowCreateForm(false);
      fetchShipments();
      if (onShipmentCreated) onShipmentCreated(result.shipment);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Shipment booking failed');
    } finally {
      setCreating(false);
    }
  };

  const handleTrack = async (shipmentId) => {
    setTracking(true);
    try {
      await adminService.trackShipment(shipmentId);
      fetchShipments();
      toast.success('Shipment tracking refreshed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tracking sync failed');
    } finally {
      setTracking(false);
    }
  };

  const handleRequestPickup = async (shipmentId) => {
    setRequestingPickup(true);
    try {
      await adminService.requestShipmentPickup(shipmentId);
      fetchShipments();
      toast.success('Courier pickup requested successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Pickup request failed');
    } finally {
      setRequestingPickup(false);
    }
  };

  const handleGenerateManifest = async (shipmentId) => {
    setGeneratingManifest(true);
    try {
      const res = await adminService.generateShipmentManifest(shipmentId);
      fetchShipments();
      toast.success('Manifest generated');
      if (res.manifestUrl) {
        window.open(res.manifestUrl, '_blank');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Manifest generation failed');
    } finally {
      setGeneratingManifest(false);
    }
  };

  const handleCancel = async (shipmentId) => {
    if (!window.confirm('Are you sure you want to cancel this courier booking?')) return;
    setCancelling(true);
    try {
      await adminService.cancelShipment(shipmentId);
      fetchShipments();
      toast.success('Shipment cancelled');
      if (onShipmentCreated) onShipmentCreated(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const activeShipment = shipments.find((s) => s.status !== 'CANCELLED');
  const hasActiveShipment = !!activeShipment;

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#8D6E63] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Shipment Display */}
      {hasActiveShipment ? (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#EFEBE9] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-[#FDFBF7]">
              <div>
                <h3 className="text-sm font-black text-[#3E2723] uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#8D6E63]" /> Active Shipment (Swarna Sparsh Fulfillment)
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Handled via {activeShipment.courier?.toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTrack(activeShipment._id)}
                  disabled={tracking}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors disabled:opacity-50"
                  title="Sync Tracking"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${tracking ? 'animate-spin' : ''}`} /> Sync Status
                </button>
                {['CREATED'].includes(activeShipment.status) && (
                  <button
                    onClick={() => handleRequestPickup(activeShipment._id)}
                    disabled={requestingPickup}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    <Truck className="w-3.5 h-3.5" /> Request Pickup
                  </button>
                )}
                {['CREATED', 'PICKUP_SCHEDULED'].includes(activeShipment.status) && (
                  <button
                    onClick={() => handleCancel(activeShipment._id)}
                    disabled={cancelling}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">AWB Number</p>
                  <p className="text-sm font-black text-gray-900 font-mono">{activeShipment.awbNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Courier Partner</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{activeShipment.courier}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Payment Mode</p>
                  <p className="text-sm font-bold text-gray-900 uppercase">{activeShipment.paymentMode}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Gross Weight</p>
                  <p className="text-sm font-bold text-gray-900">{activeShipment.package?.weight || 0}g</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {activeShipment.trackingUrl && (
                  <a
                    href={activeShipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Live Courier Tracking
                  </a>
                )}
                {activeShipment.labelUrl && (
                  <a
                    href={activeShipment.labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    <Download className="w-3.5 h-3.5" /> Print Shipping Label
                  </a>
                )}
                {activeShipment.manifestUrl ? (
                  <a
                    href={activeShipment.manifestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors border border-purple-200"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Manifest
                  </a>
                ) : (
                  <button
                    onClick={() => handleGenerateManifest(activeShipment._id)}
                    disabled={generatingManifest}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors border border-purple-200"
                  >
                    <FileText className="w-3.5 h-3.5" /> Generate Manifest
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <ShipmentTimeline timeline={activeShipment.timeline} currentStatus={activeShipment.status} />
        </div>
      ) : (
        /* No Active Shipment – Show Booking Options */
        <div className="bg-white rounded-3xl border border-[#EFEBE9] shadow-sm p-6">
          {!showCreateForm ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-[#8D6E63]/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#8D6E63]">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No Active Courier Shipment</h3>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                Book express courier pickup for this order directly via Shiprocket with automatic AWB allocation and labels.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#3E2723] text-white text-xs font-bold hover:bg-[#2e1d1a] transition-all shadow-md"
              >
                <Truck className="w-4 h-4" /> Book Courier Shipment
              </button>
            </div>
          ) : (
            /* Booking Form */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-black text-[#3E2723] uppercase tracking-wider">
                    Book Store Courier Shipment
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">Select courier partner, warehouse origin, and dimensions</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Courier Selection */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">
                  Select Courier Network
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {COURIERS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={c.disabled}
                      onClick={() => handleCourierSelect(c.id)}
                      className={`p-3.5 rounded-2xl text-left border transition-all ${
                        selectedCourier === c.id
                          ? 'border-[#8D6E63] bg-[#FDFBF7] ring-1 ring-[#8D6E63]'
                          : c.disabled
                          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{c.name}</span>
                        {selectedCourier === c.id && <CheckCircle className="w-4 h-4 text-[#8D6E63]" />}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-snug">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Warehouse Selection */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                  Dispatch Origin Warehouse
                </label>
                {loadingPickupLocations ? (
                  <div className="text-xs text-gray-400">Loading store warehouses...</div>
                ) : pickupLocations.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-700 border border-amber-200 flex items-center justify-between">
                    <span>No store warehouse configured yet. Default store address will be used.</span>
                    <a href="/admin/shipping/locations" className="font-bold underline ml-2">Add Warehouse</a>
                  </div>
                ) : (
                  <select
                    value={selectedPickupLocationId}
                    onChange={(e) => {
                      setSelectedPickupLocationId(e.target.value);
                      setServiceability(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                  >
                    {pickupLocations.map((loc) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.warehouseName} — {loc.city}, {loc.state} ({loc.pincode})
                        {(loc.isDefault || loc.isStoreDefault) ? ' [Primary Store Vault]' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Package Details */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">
                  Package Dimensions & Dead Weight
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block mb-1">Weight (grams)</span>
                    <input
                      type="number"
                      value={packageInfo.weight}
                      onChange={(e) => setPackageInfo({ ...packageInfo, weight: e.target.value })}
                      placeholder="500"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block mb-1">Length (cm)</span>
                    <input
                      type="number"
                      value={packageInfo.length}
                      onChange={(e) => setPackageInfo({ ...packageInfo, length: e.target.value })}
                      placeholder="15"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block mb-1">Breadth (cm)</span>
                    <input
                      type="number"
                      value={packageInfo.breadth}
                      onChange={(e) => setPackageInfo({ ...packageInfo, breadth: e.target.value })}
                      placeholder="12"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block mb-1">Height (cm)</span>
                    <input
                      type="number"
                      value={packageInfo.height}
                      onChange={(e) => setPackageInfo({ ...packageInfo, height: e.target.value })}
                      placeholder="8"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Serviceability Check Button & Output */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-800">Destination: </span>
                    <span className="text-xs font-semibold text-gray-600">
                      {order?.shippingAddress?.city || order?.address?.city || ''} (
                      {order?.shippingAddress?.pincode || order?.address?.zip || 'No pincode'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={checkServiceability}
                    disabled={checkingService}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {checkingService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Check Serviceability
                  </button>
                </div>

                {serviceability && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium ${
                      serviceability.serviceable
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {serviceability.serviceable ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>{serviceability.message || (serviceability.serviceable ? 'Route is Serviceable' : 'Not Serviceable')}</span>
                    </div>
                    {serviceability.estimatedDelivery && (
                      <p className="mt-1 text-[11px] text-emerald-700 ml-6">
                        Estimated Delivery: <strong>{serviceability.estimatedDelivery}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3E2723] hover:bg-[#2e1d1a] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm & Generate AWB
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminShipmentPanel;
