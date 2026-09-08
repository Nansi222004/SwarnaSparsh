import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

// Production-safe fallback editor:
// If a new/legacy sectionType is introduced without a dedicated editor UI,
// admins can still edit `settings` and `items` as JSON and save reliably.
const GenericJsonSectionEditor = ({ sectionData, onSave }) => {
  const initialSettings = useMemo(
    () => JSON.stringify(sectionData?.settings || {}, null, 2),
    [sectionData?.settings]
  );
  const initialItems = useMemo(
    () => JSON.stringify(sectionData?.items || [], null, 2),
    [sectionData?.items]
  );

  const [settingsJson, setSettingsJson] = useState(initialSettings);
  const [itemsJson, setItemsJson] = useState(initialItems);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettingsJson(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    setItemsJson(initialItems);
  }, [initialItems]);

  const formatJson = (value, setter, label) => {
    try {
      const parsed = JSON.parse(value || '');
      setter(JSON.stringify(parsed, null, 2));
    } catch (err) {
      toast.error(`${label} JSON is invalid`);
    }
  };

  const handleSave = async () => {
    let parsedSettings = {};
    let parsedItems = [];

    try {
      parsedSettings = settingsJson?.trim() ? JSON.parse(settingsJson) : {};
      if (parsedSettings === null || Array.isArray(parsedSettings) || typeof parsedSettings !== 'object') {
        toast.error('Settings must be a JSON object');
        return;
      }
    } catch (err) {
      toast.error('Settings JSON is invalid');
      return;
    }

    try {
      parsedItems = itemsJson?.trim() ? JSON.parse(itemsJson) : [];
      if (!Array.isArray(parsedItems)) {
        toast.error('Items must be a JSON array');
        return;
      }
    } catch (err) {
      toast.error('Items JSON is invalid');
      return;
    }

    setSaving(true);
    try {
      const res = await onSave({ settings: parsedSettings, items: parsedItems });
      if (res?.success === false) return;
    } finally {
      setSaving(false);
    }
  };

  const sectionKey = sectionData?.sectionKey || sectionData?.id || 'unknown';
  const sectionType = sectionData?.sectionType || 'unknown';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Generic Editor Fallback
          </div>
          <div className="text-sm font-extrabold text-gray-800 mt-1">
            {sectionData?.label || 'Untitled Section'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Section Key: <span className="font-mono">{sectionKey}</span> | Type:{' '}
            <span className="font-mono">{sectionType}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-[#3E2723] text-white text-xs font-bold uppercase tracking-widest hover:opacity-95 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Section'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Settings (JSON)</h3>
            <button
              type="button"
              onClick={() => formatJson(settingsJson, setSettingsJson, 'Settings')}
              className="text-[11px] font-bold text-[#3E2723] hover:underline"
            >
              Format
            </button>
          </div>
          <textarea
            value={settingsJson}
            onChange={(e) => setSettingsJson(e.target.value)}
            rows={18}
            className="w-full font-mono text-[12px] bg-gray-50 border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#3E2723]/30"
          />
          <p className="text-[11px] text-gray-400 mt-2">
            Use this for section-level configuration (titles, subtitles, toggles, etc.).
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Items (JSON Array)
            </h3>
            <button
              type="button"
              onClick={() => formatJson(itemsJson, setItemsJson, 'Items')}
              className="text-[11px] font-bold text-[#3E2723] hover:underline"
            >
              Format
            </button>
          </div>
          <textarea
            value={itemsJson}
            onChange={(e) => setItemsJson(e.target.value)}
            rows={18}
            className="w-full font-mono text-[12px] bg-gray-50 border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#3E2723]/30"
          />
          <p className="text-[11px] text-gray-400 mt-2">
            Items must be an array. Each element is a card/item object for this section.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-[12px]">
        This is a fallback editor used when a dedicated UI editor has not been built for this section yet.
        It prevents "Editor not implemented" dead-ends in production.
      </div>
    </div>
  );
};

export default GenericJsonSectionEditor;
