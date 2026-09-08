import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Save, ArrowLeft, Layout, Type, Image as ImageIcon } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';
import { PAGE_CONFIG } from './PageManagement';

const DynamicPageEditor = ({ pageId: propPageId }) => {
    const { pageId: paramPageId } = useParams();
    const pageId = propPageId || paramPageId;
    const navigate = useNavigate();
    const config = PAGE_CONFIG[pageId];

    // Redirect if pageId is invalid
    useEffect(() => {
        if (!config) {
            navigate('/admin/pages');
        }
    }, [pageId, navigate, config]);

    const [content, setContent] = useState('');
    const [title, setTitle] = useState(config?.title || '');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch data from backend
    useEffect(() => {
        const fetchPageContent = async () => {
            if (!config) return;
            setLoading(true);
            try {
                const res = await adminService.getPageBySlug(pageId);
                if (res.success && res.data.page) {
                    setTitle(res.data.page.title);
                    setContent(res.data.page.content);
                } else {
                    // If not found, use defaults from config
                    setTitle(config.title);
                    setContent('');
                }
            } catch (err) {
                console.error("Fetch page content failed:", err);
                toast.error("Failed to load page content");
            } finally {
                setLoading(false);
            }
        };

        fetchPageContent();
    }, [pageId, config]);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Page title is required");
            return;
        }
        if (!content || !content.replace(/<[^>]+>/g, '').trim()) {
            toast.error("Page content is required");
            return;
        }

        setSaving(true);
        try {
            const res = await adminService.savePage({
                slug: pageId,
                title: title.trim(),
                content
            });

            if (res.success) {
                toast.success('Page content saved successfully!');
            } else {
                toast.error(res.message || "Failed to save page");
            }
        } catch (err) {
            console.error("Save page failed:", err);
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'indent',
        'link'
    ];

    if (!config) return null;

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <PageHeader
                        title={config.title}
                        subtitle={config.subtitle}
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#3E2723] text-white rounded-xl text-sm font-bold hover:bg-[#5D4037] transition-all shadow-lg shadow-[#3E2723]/20 active:scale-95 disabled:opacity-60"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E2723]"></div>
                    <p className="text-gray-500 font-medium">Loading page content...</p>
                </div>
            ) : (
                <>
                    {/* Editor Container */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="max-w-3xl space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                <Type className="w-3 h-3" /> Page Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-4 bg-white border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:border-[#3E2723] focus:ring-0 outline-none transition-all"
                                placeholder="Enter page title"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                            <Layout className="w-3 h-3" /> Page Content
                        </label>
                        <div className="prose-admin">
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                modules={modules}
                                formats={formats}
                                className="h-[500px] mb-12 bg-white rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>
            </>
            )}

            {/* Helper Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900">Pro Tip</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        Use the toolbar to format headers, lists, and links.
                        Changes will be reflected on the live website immediately after saving.
                    </p>
                </div>
            </div>

            {/* Custom Styles for Quill */}
            <style>{`
                .ql-toolbar.ql-snow {
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                    border-color: #e5e7eb;
                    background-color: #f9fafb;
                    padding: 12px;
                }
                .ql-container.ql-snow {
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                    border-color: #e5e7eb;
                    font-family: inherit;
                    font-size: 1rem;
                }
                .ql-editor {
                    min-height: 300px;
                    padding: 1.5rem;
                }
            `}</style>
        </div>
    );
};

export default DynamicPageEditor;
