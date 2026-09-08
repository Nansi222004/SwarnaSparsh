import React from 'react';
import { User, Check, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileDetailsTab = ({ 
    user, 
    isEditing, 
    formData, 
    setFormData, 
    handleSave,
    isSaving
}) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="md:bg-white p-4 sm:p-6 md:p-8 md:rounded-2xl md:shadow-sm relative border border-stone-200">
                <div className="flex justify-center md:justify-between items-center mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-serif font-bold text-[#141211] text-center md:text-left tracking-wide">Personal Information</h2>
                    <button
                        onClick={() => isEditing ? handleSave() : navigate('/profile/profile/edit')}
                        disabled={isSaving}
                        className={`hidden md:flex p-2 rounded-full transition-all duration-300 ${isEditing ? 'bg-[#141211] text-[#E8D198] border border-[#C59B27]/40' : 'bg-[#FAF8F5] text-[#C59B27] border border-[#C59B27]/30'} ml-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-[#E8D198] border-t-transparent rounded-full animate-spin"></div>
                        ) : isEditing ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <Edit2 className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {isEditing ? (
                    <div className="space-y-6">
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 md:mb-2 text-left">First Name</label>
                                <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} disabled={isSaving} className="w-full bg-white border border-stone-200 rounded-xl md:rounded-lg px-4 py-3 md:py-2.5 text-sm focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27] transition-all outline-none disabled:opacity-60 disabled:bg-stone-50 disabled:cursor-not-allowed" placeholder="First Name" />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 md:mb-2 text-left">Last Name</label>
                                <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} disabled={isSaving} className="w-full bg-white border border-stone-200 rounded-xl md:rounded-lg px-4 py-3 md:py-2.5 text-sm focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27] transition-all outline-none disabled:opacity-60 disabled:bg-stone-50 disabled:cursor-not-allowed" placeholder="Last Name" />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 md:mb-2 text-left">Email</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={isSaving} className="w-full bg-white border border-stone-200 rounded-xl md:rounded-lg px-4 py-3 md:py-2.5 text-sm focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27] transition-all outline-none disabled:opacity-60 disabled:bg-stone-50 disabled:cursor-not-allowed" placeholder="Email Address" />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 md:mb-2 text-left">Phone Number</label>
                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={isSaving} className="w-full bg-white border border-stone-200 rounded-xl md:rounded-lg px-4 py-3 md:py-2.5 text-sm focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27] transition-all outline-none disabled:opacity-60 disabled:bg-stone-50 disabled:cursor-not-allowed" placeholder="Phone Number" />
                            </div>
                        </form>

                        {/* Mobile Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="md:hidden w-full bg-[#141211] text-[#E8D198] border border-[#C59B27]/40 py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-[#E8D198] border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 md:space-y-6">
                        {/* Mobile Profile Header */}
                        <div className="md:hidden flex flex-col items-center pt-2">
                            <div className="bg-[#FAF8F5] p-5 rounded-full shadow-sm border border-[#C59B27]/30 mb-3">
                                <User className="w-12 h-12 text-[#C59B27]" />
                            </div>
                            <h3 className="text-xl font-bold text-[#141211] font-serif">{user.name}</h3>
                        </div>

                        {/* Mobile Clean List Style */}
                        <div className="md:hidden space-y-4 px-2">
                            <div className="border-b border-stone-100 pb-3">
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">First Name</p>
                                <p className="text-base font-medium text-[#141211]">{user.name ? user.name.split(' ')[0] : ''}</p>
                            </div>
                            <div className="border-b border-stone-100 pb-3">
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">Last Name</p>
                                <p className="text-base font-medium text-[#141211]">{user.name ? user.name.split(' ').slice(1).join(' ') : ''}</p>
                            </div>
                            <div className="border-b border-stone-100 pb-3">
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">Email Address</p>
                                <p className="text-base font-medium text-[#141211]">{user.email || 'Not provided'}</p>
                            </div>
                            <div className="border-b border-stone-100 pb-3">
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">Phone Number</p>
                                <p className="text-base font-medium text-[#141211]">+91 {user.phone}</p>
                            </div>
                        </div>

                        {/* Desktop Grid View */}
                        <div className="hidden md:grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">First Name</label>
                                <div className="w-full bg-white border border-gray-100 rounded-lg px-4 py-2.5 text-sm font-medium text-black">{user.name ? user.name.split(' ')[0] : ''}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
                                <div className="w-full bg-white border border-gray-100 rounded-lg px-4 py-2.5 text-sm font-medium text-black">{user.name ? user.name.split(' ').slice(1).join(' ') : ''}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                                <div className="w-full bg-white border border-gray-100 rounded-lg px-4 py-2.5 text-sm font-medium text-black">{user.email || 'Not provided'}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone</label>
                                <div className="w-full bg-white border border-gray-100 rounded-lg px-4 py-2.5 text-sm font-medium text-black">+91 {user.phone}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileDetailsTab;
