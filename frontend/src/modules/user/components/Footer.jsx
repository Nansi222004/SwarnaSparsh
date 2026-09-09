import React, { useState, useEffect } from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Truck,
  Mail,
  Phone,
  MapPin,
  Heart,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import defaultLogo from "@assets/logo.webp";
import { useSettings } from "../../../context/SettingsContext";
import {
  normalizeExternalLink,
  normalizeFooterLink,
} from "../utils/navigation";
import api from "../../../services/api";

const Footer = () => {
  const location = useLocation();
  const isOrderSuccess = location.pathname === "/order-success";
  const { settings: globalSettings } = useSettings();

  const [settings, setSettings] = useState({
    storeName: "Swarna Sparsh",
    tagline: "Swarna Sparsh – Where Luxury Meets Identity",
    logo: "/logo.webp",
    footerTagline: "Timeless Elegance,",
    footerSubTagline: "Handcrafted for You.",
    footerDescription:
      "Every piece at Swarna Sparsh tells a story of heritage and modern grace. Join our community of silver lovers and celebrate life's most precious moments.",
    address:
      "Swarna Sparsh, Sarafa Lane Gandhi Chowk Wani, 445304, Dist - Yavatmal, Maharashtra",
    phone: "+919921128662",
    email: "support@swarnasparsh.com",
    footerColumn1Title: "Experience",
    footerColumn2Title: "Policies",
    footerColumn3Title: "Our World",
    footerExperienceLinks: [
      { name: "Easy Returns", path: "/returns" },
      { name: "Contact Us", path: "/contact" },
      { name: "FAQs", path: "/help" },
      { name: "Swarna Sparsh Gift Cards", path: "/gift-cards" },
    ],
    footerPoliciesLinks: [
      { name: "Shipping Policy", path: "/shipping-policy" },
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Cancellation Policy", path: "/cancellation-policy" },
      { name: "Terms & Conditions", path: "/terms" },
    ],
    footerWorldLinks: [
      { name: "About Us", path: "/about" },
      { name: "Jewellery Care Guide", path: "/care-guide" },
      { name: "Our Craft", path: "/craft" },
    ],
    socialLinks: {
      facebook: "#",
      twitter: "#",
      instagram: "#",
      youtube: "#",
    },
    footerDeliveryText: "Safe & Insured Express Worldwide Delivery",
    footerCopyrightText: "Swarna Sparsh. All Rights Reserved.",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get("public/settings");
        if (res.data.success && res.data.data?.settings) {
          const fetched = res.data.data.settings;
          setSettings((prev) => ({
            ...prev,
            ...fetched,
            socialLinks: {
              ...prev.socialLinks,
              ...(fetched.socialLinks || {}),
            },
          }));
          return;
        }
      } catch (err) {
        console.warn(
          "Failed to fetch public footer settings, falling back to localStorage/defaults:",
          err.message,
        );
      }

      const saved = localStorage.getItem("siteSettings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          socialLinks: {
            ...prev.socialLinks,
            ...(parsed.socialLinks || {}),
          },
        }));
      }
    };

    loadSettings();
    window.addEventListener("storage", loadSettings);
    return () => window.removeEventListener("storage", loadSettings);
  }, []);

  const activeLogo = globalSettings?.logo || settings.logo || defaultLogo;
  const activeStoreName = globalSettings?.storeName || settings.storeName || "Swarna Sparsh";
  const activeTagline = globalSettings?.footerTagline || settings.footerTagline;
  const activeSubTagline = globalSettings?.footerSubTagline || settings.footerSubTagline;
  const activeDescription = globalSettings?.footerDescription || settings.footerDescription;
  const activePhone = globalSettings?.phone || settings.phone;
  const activeEmail = globalSettings?.email || settings.email;
  const activeAddress = globalSettings?.address || settings.address;

  if (isOrderSuccess) return null;

  return (
    <footer className="relative bg-[#141211] text-stone-300 pt-16 pb-8 overflow-hidden border-t border-[#C59B27]/30">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#141211] via-[#C59B27] to-[#141211]"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-4">
              <Link
                to="/"
                className="inline-block transition-transform hover:scale-105 duration-500"
              >
                <img
                  src={activeLogo}
                  alt={activeStoreName}
                  className="h-16 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = defaultLogo;
                  }}
                />
              </Link>
              <div className="space-y-2">
                <h3 className="text-xl font-serif text-white leading-tight tracking-wide font-bold">
                  {activeTagline} <br />
                  <span className="italic font-serif text-[#C59B27] font-light">
                    {activeSubTagline}
                  </span>
                </h3>
                <p className="text-stone-400 font-sans text-[13px] leading-relaxed max-w-sm opacity-90">
                  {activeDescription}
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-center pt-2">
              {[
                { Icon: ShieldCheck, label: "Secure" },
                { Icon: Star, label: "925 Pure" },
                { Icon: Heart, label: "Verified" },
              ].map((badge, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 group cursor-default"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1C1917] shadow-sm border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27] group-hover:scale-110 group-hover:bg-[#C59B27] group-hover:text-[#141211] transition-all duration-500">
                    <badge.Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-stone-400 font-bold group-hover:text-[#E8D198] transition-colors">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8 pt-4">
            {[
              {
                title: settings.footerColumn1Title,
                links: settings.footerExperienceLinks,
              },
              {
                title: settings.footerColumn2Title,
                links: settings.footerPoliciesLinks,
              },
              {
                title: settings.footerColumn3Title,
                links: settings.footerWorldLinks,
              },
            ].map((col, i) => (
              <div key={i} className="space-y-4">
                <h4 className="font-serif text-[#E8D198] font-bold uppercase tracking-[0.25em] text-[11px] border-b border-[#C59B27]/30 pb-2 mb-2">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links?.map((link, idx) => (
                    <li key={idx}>
                      <Link
                        to={normalizeFooterLink(link.path)}
                        className="text-[13px] text-stone-400 hover:text-[#E8D198] transition-all hover:translate-x-1 inline-flex items-center group font-sans"
                      >
                        <span className="w-1.5 h-[1px] bg-[#C59B27] mr-2 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact Card */}
          <div className="lg:col-span-3">
            <div className="bg-[#1C1917] p-6 rounded-[2rem] border border-[#C59B27]/30 shadow-xl shadow-black/40 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#C59B27]/5 rounded-bl-full -z-0 group-hover:scale-[2] transition-transform duration-1000"></div>

              <div className="relative z-10 space-y-5">
                <h4 className="font-serif text-[#E8D198] font-bold uppercase tracking-[0.25em] text-[11px]">
                  Connect Directly
                </h4>
                <div className="space-y-4">
                  <a
                    href={`mailto:${activeEmail}`}
                    className="flex items-center gap-4 group/item"
                  >
                    <div className="w-10 h-10 bg-[#141211] border border-[#C59B27]/50 text-[#E8D198] rounded-[14px] flex items-center justify-center group-hover/item:bg-[#C59B27] group-hover/item:text-[#141211] transition-all duration-500 shadow-sm shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-medium text-stone-300 hover:text-[#E8D198] transition-colors break-all">
                      {activeEmail}
                    </span>
                  </a>
                  <a
                    href={`tel:${activePhone}`}
                    className="flex items-center gap-4 group/item"
                  >
                    <div className="w-10 h-10 bg-[#141211] border border-[#C59B27]/50 text-[#E8D198] rounded-[14px] flex items-center justify-center group-hover/item:bg-[#C59B27] group-hover/item:text-[#141211] transition-all duration-500 shadow-sm shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-medium text-stone-300 hover:text-[#E8D198] transition-colors">
                      {activePhone}
                    </span>
                  </a>
                  <div className="flex items-start gap-4 group/item">
                    <div className="w-10 h-10 bg-[#141211] border border-[#C59B27]/50 text-[#E8D198] rounded-[14px] flex items-center justify-center group-hover/item:bg-[#C59B27] group-hover/item:text-[#141211] transition-all duration-500 shadow-sm shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-[12px] font-normal text-stone-300 leading-relaxed">
                      {activeAddress}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800 space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400">
                    Social Gallery
                  </p>
                  <div className="flex gap-2.5">
                    {[
                      { Icon: Facebook, link: settings.socialLinks?.facebook },
                      { Icon: Twitter, link: settings.socialLinks?.twitter },
                      {
                        Icon: Instagram,
                        link: settings.socialLinks?.instagram,
                      },
                      { Icon: Youtube, link: settings.socialLinks?.youtube },
                    ].map((social, i) => (
                      <a
                        key={i}
                        href={normalizeExternalLink(social.link)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 bg-[#141211] border border-stone-700 rounded-xl flex items-center justify-center text-stone-400 hover:border-[#C59B27] hover:text-[#E8D198] hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
                      >
                        <social.Icon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 border border-[#C59B27]/20 bg-[#1C1917]/70 backdrop-blur-sm rounded-2xl py-3.5 px-6 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#C59B27]/10 border border-[#C59B27]/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
            </div>
            <p className="text-[11px] text-stone-400 font-sans leading-relaxed">
              <span className="font-bold text-[#E8D198] mr-2 uppercase tracking-wide">
                SECURITY ADVISORY:
              </span>
              {settings.fraudWarning ||
                "Swarna Sparsh will NEVER ask for OTPs, passwords, or sensitive financial information via unsolicited calls, WhatsApp, or emails."}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-stone-800">
          <div className="flex items-center gap-3 bg-[#1C1917] px-4 py-2 rounded-full border border-[#C59B27]/30 shadow-xs">
            <Truck className="w-4 h-4 text-[#C59B27]" />
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#E8D198]">
              {settings.footerDeliveryText}
            </span>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1.5">
            <p className="text-[10px] text-stone-500 uppercase tracking-[0.25em] font-semibold">
              &copy; {new Date().getFullYear()} {settings.footerCopyrightText}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
