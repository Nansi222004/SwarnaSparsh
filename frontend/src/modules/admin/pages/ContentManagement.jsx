import React, { useState } from "react";
import {
  Save,
  Info,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  Check,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";

const ContentManagement = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Initial Mock Content - About Us
  const [aboutContent, setAboutContent] = useState({
    heroTitle: "About Us",
    heroSubtitle:
      "Welcome to Swarna Sparsh, where elegance meets timeless tradition. We are more than just a jewellery brand; we are curators of silver artistry designed to adorn your soul.",
    mainStory:
      "Our journey began with a passion for bringing high-quality, handcrafted 925 Sterling Silver pieces to the modern woman. Every necklace, ring, and bracelet in our collection tells a story of skilled craftsmanship and attention to detail.",
    missionStatement:
      "At Swarna Sparsh, we are committed to sustainability and ethical sourcing, ensuring that beauty does not come at a cost to our planet.",
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?auto=format&fit=crop&q=80&w=600",
        label: "Landscape",
      },
      {
        id: 2,
        url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=600",
        label: "Bracelet",
      },
      {
        id: 3,
        url: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=600",
        label: "Necklace Wear",
      },
    ],
    features: [
      {
        id: 1,
        title: "Free Shipping",
        description:
          "Enjoy free and fast delivery on all orders above ₹2000. We ensure your precious pieces reach you safely and on time, anywhere in the country.",
      },
      {
        id: 2,
        title: "Premium Quality",
        description:
          "Our jewellery is crafted with 100% authentic 925 Sterling Silver. Each piece undergoes varying quality checks to ensure lasting shine and durability.",
      },
      {
        id: 3,
        title: "100% Secure Checkout",
        description:
          "Shop with confidence using our encrypted payment gateways. Your privacy and security are our top priority for a seamless shopping experience.",
      },
    ],
    instagramImages: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: 2,
        url: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: 3,
        url: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&q=80&w=400",
      },
      {
        id: 4,
        url: "https://images.unsplash.com/photo-1615655114865-4cc1bda5901e?auto=format&fit=crop&q=80&w=400",
      },
    ],
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      // In a real app, send to API
    }, 1500);
  };

  // About Us Handlers
  const handleFeatureChange = (id, field, value) => {
    const updatedFeatures = aboutContent.features.map((feature) =>
      feature.id === id ? { ...feature, [field]: value } : feature,
    );
    setAboutContent({ ...aboutContent, features: updatedFeatures });
  };

  const handleImageChange = (section, id, newUrl) => {
    const updatedImages = aboutContent[section].map((img) =>
      img.id === id ? { ...img, url: newUrl } : img,
    );
    setAboutContent({ ...aboutContent, [section]: updatedImages });
  };

  const addInstagramImage = () => {
    const newId = aboutContent.instagramImages.length + 1;
    setAboutContent({
      ...aboutContent,
      instagramImages: [
        ...aboutContent.instagramImages,
        { id: newId, url: "https://placehold.co/400" },
      ],
    });
  };

  const removeInstagramImage = (id) => {
    setAboutContent({
      ...aboutContent,
      instagramImages: aboutContent.instagramImages.filter(
        (img) => img.id !== id,
      ),
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
      <PageHeader
        title="About Us Management"
        subtitle="Manage core company information and story"
      />

      <div className="bg-white rounded-xl md:rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] md:min-h-[600px]">
        <div className="p-4 md:p-12 space-y-8 md:space-y-12 animate-in slide-in-from-left-4 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#3E2723]">
                About Us Configuration
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                Manage core company information
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-[#3E2723] text-white hover:bg-[#5D4037] transition-all shadow-sm active:scale-95"
                  >
                    {isSaving ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? "Saved" : "Save Changes"}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Section</span>
                </button>
              )}
            </div>
          </div>
          {/* Text Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-xs md:text-sm font-bold text-[#3E2723] uppercase tracking-widest border-l-4 border-[#3E2723] pl-3 md:pl-4">
                Header Content
              </h3>
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Hero Title
                  </label>
                  <input
                    className="w-full p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl text-base md:text-lg font-serif font-bold text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#3E2723]/10 disabled:bg-gray-100 disabled:text-gray-500"
                    value={aboutContent.heroTitle}
                    onChange={(e) =>
                      setAboutContent({
                        ...aboutContent,
                        heroTitle: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Hero Subtitle
                  </label>
                  <textarea
                    className="w-full p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-gray-600 h-24 md:h-32 resize-none leading-relaxed disabled:bg-gray-100 disabled:text-gray-400"
                    value={aboutContent.heroSubtitle}
                    onChange={(e) =>
                      setAboutContent({
                        ...aboutContent,
                        heroSubtitle: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-xs md:text-sm font-bold text-[#3E2723] uppercase tracking-widest border-l-4 border-[#3E2723] pl-3 md:pl-4">
                Mission & Story
              </h3>
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Main Story
                  </label>
                  <textarea
                    className="w-full p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-gray-600 h-24 md:h-32 resize-none leading-relaxed disabled:bg-gray-100 disabled:text-gray-400"
                    value={aboutContent.mainStory}
                    onChange={(e) =>
                      setAboutContent({
                        ...aboutContent,
                        mainStory: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Final Statement
                  </label>
                  <input
                    className="w-full p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-[#3E2723] disabled:bg-gray-100 disabled:text-gray-500"
                    value={aboutContent.missionStatement}
                    onChange={(e) =>
                      setAboutContent({
                        ...aboutContent,
                        missionStatement: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Core Features (Premium Quality, Free Shipping, etc.) */}
          <div className="space-y-4 md:space-y-6 pt-4 md:pt-6 border-t border-gray-100">
            <h3 className="text-xs md:text-sm font-bold text-[#3E2723] uppercase tracking-widest border-l-4 border-[#3E2723] pl-3 md:pl-4">
              Core Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aboutContent.features.map((feature) => (
                <div
                  key={feature.id}
                  className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3"
                >
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      Heading
                    </label>
                    <input
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-[#3E2723] disabled:bg-gray-100"
                      value={feature.title}
                      onChange={(e) =>
                        handleFeatureChange(feature.id, "title", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      Description
                    </label>
                    <textarea
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 h-20 resize-none disabled:bg-gray-100"
                      value={feature.description}
                      onChange={(e) =>
                        handleFeatureChange(
                          feature.id,
                          "description",
                          e.target.value,
                        )
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image Grid Manager - Strictly 3 Images */}
          <div className="space-y-4 md:space-y-6 pt-4 md:pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-[#3E2723] uppercase tracking-widest border-l-4 border-[#3E2723] pl-3 md:pl-4">
                Collage Images (3 Only)
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-6">
              {aboutContent.images.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-lg md:rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-video bg-gray-100"
                >
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full h-full object-cover"
                  />
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 animate-in fade-in">
                      <button
                        onClick={() => {
                          const newUrl = prompt("Enter Image URL:", img.url);
                          if (newUrl)
                            handleImageChange("images", img.id, newUrl);
                        }}
                        className="p-2 md:p-3 bg-white rounded-full text-gray-900 shadow-xl hover:scale-110 transition-all pointer-events-auto"
                      >
                        <Edit3 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur rounded-md text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-[#3E2723]">
                    {img.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instagram Images Section */}
          <div className="space-y-4 md:space-y-6 pt-4 md:pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-[#3E2723] uppercase tracking-widest border-l-4 border-[#3E2723] pl-3 md:pl-4">
                Instagram Section
              </h3>
              {isEditing && (
                <button
                  onClick={addInstagramImage}
                  className="text-[10px] md:text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Photo
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {aboutContent.instagramImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-lg md:rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-square bg-gray-100"
                >
                  <img
                    src={img.url}
                    alt="Instagram"
                    className="w-full h-full object-cover"
                  />
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 animate-in fade-in">
                      <button
                        onClick={() => {
                          const newUrl = prompt("Enter Image URL:", img.url);
                          if (newUrl)
                            handleImageChange(
                              "instagramImages",
                              img.id,
                              newUrl,
                            );
                        }}
                        className="p-2 md:p-2 bg-white rounded-full text-gray-900 shadow-xl hover:scale-110 transition-all"
                      >
                        <Edit3 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={() => removeInstagramImage(img.id)}
                        className="p-2 md:p-2 bg-red-500 rounded-full text-white shadow-xl hover:scale-110 transition-all"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;
