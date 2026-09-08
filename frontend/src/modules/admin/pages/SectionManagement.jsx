import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Edit2, Image as ImageIcon, LayoutTemplate, RefreshCw } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { adminService } from '../services/adminService';
import { getPageConfig, getSectionDefaultsForPage, PAGE_SECTIONS } from '../utils/sectionDefaults';
import toast from 'react-hot-toast';

const SectionManagement = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const activePageKey = searchParams.get('pageKey') || 'home';
    const activePage = useMemo(() => getPageConfig(activePageKey), [activePageKey]);
    const requestSeqRef = useRef(0);
    const seedingRef = useRef({});

    const fetchSections = async (isManual = false) => {
        const seq = ++requestSeqRef.current;
        setLoading(true);
        setLoadError('');

        if (isManual) {
            const defaultsForPage = getSectionDefaultsForPage(activePageKey);
            defaultsForPage.forEach(section => {
                const id = section.sectionId || section.sectionKey;
                localStorage.removeItem(`${id}_draftItems`);
                localStorage.removeItem(`${id}_draftSection`);
                localStorage.removeItem(`${id}_draftImages`);
                localStorage.removeItem(`${id}_draftVideo`);
            });
        }

        try {
            const defaultsForPage = getSectionDefaultsForPage(activePageKey);
            const allowedSectionKeys = new Set(defaultsForPage.map(section => section.sectionKey || section.sectionId));
            const data = await adminService.getSections(activePageKey);
            if (seq !== requestSeqRef.current) return;
            const filteredSections = (data || [])
                .filter(section => allowedSectionKeys.has(section.sectionKey || section.sectionId))
                .map(section => {
                    const defaultSection = defaultsForPage.find(def => 
                        def.sectionKey === (section.sectionId || section.sectionKey)
                    );
                    return {
                        ...section,
                        sortOrder: section.sortOrder || defaultSection?.sortOrder || 99
                    };
                })
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            setSections(filteredSections);
            const existingIds = new Set(filteredSections.map(section => section.sectionId));
            const missingDefaults = defaultsForPage.filter(def => !existingIds.has(def.sectionId) && !existingIds.has(def.sectionKey));
            // Auto-seed missing defaults once per pageKey to keep production CMS stable,
            // but guard against repeated bulk calls on fast navigation/re-renders.
            const shouldSeed = (!data || data.length === 0 || missingDefaults.length > 0);
            if (shouldSeed && !seedingRef.current[activePageKey]) {
                seedingRef.current[activePageKey] = true;
                const seedPayload = missingDefaults.length > 0 ? missingDefaults : defaultsForPage;
                const seedRes = await adminService.bulkUpsertSections(seedPayload, activePageKey);
                if (seedRes.success !== false) {
                    const seeded = await adminService.getSections(activePageKey);
                    if (seq !== requestSeqRef.current) return;
                    const filteredSeeded = (seeded || [])
                        .filter(section => allowedSectionKeys.has(section.sectionKey || section.sectionId))
                        .map(section => {
                            const defaultSection = defaultsForPage.find(def =>
                                def.sectionKey === (section.sectionId || section.sectionKey)
                            );
                            return {
                                ...section,
                                sortOrder: section.sortOrder || defaultSection?.sortOrder || 99
                            };
                        })
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                    setSections(filteredSeeded);
                } else {
                    seedingRef.current[activePageKey] = false;
                }
            }
        } catch (err) {
            setLoadError(err?.response?.data?.message || err?.message || 'Failed to load sections');
            toast.error("Failed to load sections");
        } finally {
            if (seq === requestSeqRef.current) {
                setLoading(false);
                if (isManual && !loadError) {
                    toast.success("Sections refreshed and drafts cleared");
                }
            }
        }
    };

    React.useEffect(() => {
        fetchSections(false);
    }, [activePageKey]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 p-6 md:p-8">
                <PageHeader
                    title={activePage?.label || 'Sections'}
                    subtitle={activePage?.description || 'Manage page sections and banners with consistent content blocks.'}
                    backPath="/admin"
                    action={{
                        label: loading ? 'Refreshing...' : 'Refresh',
                        icon: <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />,
                        onClick: () => fetchSections(true)
                    }}
                />

                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 shadow-sm">
                    <p className="font-bold mb-1 uppercase tracking-wider text-xs">⚠️ Important: Image Upload Sizes</p>
                    <p>To prevent images from being cropped on the user website, please ensure you upload images in the <strong>exact sizes</strong> recommended for each section. Always follow the specific dimension guidelines (e.g., 1920x800px for desktop banners, 800x1000px for mobile banners, 1200x1500px for portrait banners) provided in each editor.</p>
                </div>

                {loadError && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
                        {loadError}
                        <button
                            type="button"
                            onClick={fetchSections}
                            className="ml-3 text-xs font-bold uppercase tracking-widest text-red-700 hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    {PAGE_SECTIONS.map((page) => {
                        const isActivePage = page.pageKey === activePageKey;
                        return (
                            <button
                                key={page.pageKey}
                                type="button"
                                onClick={() => setSearchParams({ pageKey: page.pageKey })}
                                className={`text-left rounded-2xl border p-5 transition-all ${isActivePage
                                    ? 'border-[#3E2723] bg-[#3E2723] text-white shadow-lg'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-[#3E2723]/30 hover:shadow-sm'
                                    }`}
                            >
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-4 ${isActivePage ? 'bg-white/15 text-white' : 'bg-[#3E2723]/5 text-[#3E2723]'}`}>
                                    <LayoutTemplate size={18} />
                                </div>
                                <h3 className="font-display text-lg font-bold mb-2">{page.label}</h3>
                                <p className={`text-sm leading-relaxed ${isActivePage ? 'text-white/80' : 'text-gray-500'}`}>
                                    {page.description}
                                </p>
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full bg-white border border-gray-100 rounded-xl p-10 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                            Loading sections...
                        </div>
                    ) : sections.map(section => (
                        <div key={section.sectionId || section._id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <ImageIcon size={20} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${section.isActive === false ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {section.isActive === false ? 'Inactive' : 'Active'}
                                </span>
                            </div>
                            <h3 className="font-display text-lg font-bold text-gray-800 mb-2">{section.label}</h3>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                                Manage the items, images, and links displayed in this section.
                            </p>

                            <button
                                onClick={() => navigate(`/admin/sections/${section.sectionKey || section.sectionId}?pageKey=${activePageKey}`)}
                                className="w-full py-2.5 rounded-lg bg-gray-50 text-gray-700 font-bold text-xs hover:bg-[#3E2723] hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Edit2 size={14} /> Edit Content
                            </button>
                        </div>
                    ))}

                    {/* Placeholder for future sections */}
                    {[].map((name, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-6 opacity-60">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-10 w-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center">
                                    <ImageIcon size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-gray-200 text-gray-500">
                                    Coming Soon
                                </span>
                            </div>
                            <h3 className="font-display text-lg font-bold text-gray-400 mb-2">{name}</h3>
                            <p className="text-gray-400 text-sm mb-6">This section is not yet manageable.</p>
                            <button disabled className="w-full py-2.5 rounded-lg bg-gray-200 text-gray-400 font-bold text-xs cursor-not-allowed">
                                Manage
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SectionManagement;
