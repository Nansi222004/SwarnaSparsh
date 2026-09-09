import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, FileText, Globe, Clock } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';

export const PAGE_CONFIG = {
  'about-us': { title: 'About Us', subtitle: 'Company history and mission', route: '/about' },
  'privacy-policy': { title: 'Privacy Policy', subtitle: 'Manage your privacy policy content', route: '/privacy' },
  'terms-conditions': { title: 'Terms & Conditions', subtitle: 'Update terms of service', route: '/terms' },
  'return-refund-policy': { title: 'Return & Refund Policy', subtitle: 'Edit return and refund processing details', route: '/return-policy' },
  'shipping-policy': { title: 'Shipping Policy', subtitle: 'Manage shipping zones and delivery times', route: '/shipping-policy' },
  'cancellation-policy': { title: 'Cancellation Policy', subtitle: 'Update order cancellation rules', route: '/cancellation-policy' },
  'jewelry-care': { title: 'Jewelry Care Instructions', subtitle: 'Guide customers on how to care for their jewelry', route: '/care-guide' },
  'warranty-info': { title: 'Warranty Information', subtitle: 'Details about product warranty and coverage', route: '/warranty-info' },
  'our-craftsmanship': { title: 'Our Craftsmanship', subtitle: 'Share the story of your artisans', route: '/craft' },
  'customization': { title: 'Customization Services', subtitle: 'Details about custom jewelry options', route: '/customization' },
};

const PageManagement = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      try {
        const data = await adminService.getPages();
        setPages(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error('Failed to load pages');
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const pagesBySlug = useMemo(
    () => new Map((pages || []).map((page) => [page.slug, page])),
    [pages]
  );

  const configuredPages = Object.entries(PAGE_CONFIG).map(([slug, config]) => {
    const page = pagesBySlug.get(slug);
    return {
      slug,
      config,
      page,
      isConfigured: Boolean(page?.content),
      lastUpdated: page?.lastUpdated || null,
      wordCount: page?.content ? page.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length : 0,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 p-6 md:p-8">
        <PageHeader
          title="Static Pages"
          subtitle="Manage the legal, brand, and informational pages shown on the user storefront"
          backPath="/admin"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Total Pages</p>
            <p className="text-3xl font-black text-gray-900 mt-3">{configuredPages.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Configured</p>
            <p className="text-3xl font-black text-emerald-600 mt-3">{configuredPages.filter((page) => page.isConfigured).length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">User Routes</p>
            <p className="text-lg font-bold text-gray-900 mt-3">Fully Routed</p>
            <p className="text-sm text-gray-500 mt-1">Footer, header, and policy links</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full bg-white border border-gray-100 rounded-xl p-10 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
              Loading pages...
            </div>
          ) : configuredPages.map(({ slug, config, page, isConfigured, lastUpdated, wordCount }) => (
            <div key={slug} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${isConfigured ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                  {isConfigured ? 'Ready' : 'Needs Content'}
                </span>
              </div>

              <h3 className="font-display text-lg font-bold text-gray-800 mb-2">{page?.title || config.title}</h3>
              <p className="text-gray-500 text-sm mb-5 line-clamp-2">{config.subtitle}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe size={15} className="text-gray-400" />
                  <span className="font-semibold">{config.route}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={15} className="text-gray-400" />
                  <span>{lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleDateString()}` : 'Not saved yet'}</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {wordCount} words
                </p>
              </div>

              <button
                onClick={() => navigate(`/admin/pages/${slug}`)}
                className="w-full py-2.5 rounded-lg bg-gray-50 text-gray-700 font-bold text-xs hover:bg-[#3E2723] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Edit3 size={14} /> Edit Page
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageManagement;
