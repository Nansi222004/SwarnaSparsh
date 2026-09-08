import React, { useEffect } from "react";
import {
  FileText,
  ShieldCheck,
  Scale,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../context/SettingsContext";

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  useEffect(() => {}, []);

  const sections = [
    {
      title: "1. Acceptance of Terms",
      icon: <ShieldCheck className="w-6 h-6" />,
      content:
        "By accessing and using Swarna Sparsh, you agree to be bound by these Terms and Conditions. Our services are provided to you subject to your compliance with these terms.",
    },
    {
      title: "2. Product Information",
      icon: <FileText className="w-6 h-6" />,
      content:
        "We strive to display products as accurately as possible. However, due to the nature of jewelry (lighting, screen resolution), actual colors and sizes may vary slightly. All gold and silver items are hallmarked as per regulatory standards.",
    },
    {
      title: "3. Pricing & Payments",
      icon: <Scale className="w-6 h-6" />,
      content:
        "Prices are subject to change based on daily market gold/silver rates. Payments are processed securely via Razorpay. We reserve the right to cancel orders in case of pricing errors.",
    },
    {
      title: "4. Shipping & Returns",
      icon: <AlertCircle className="w-6 h-6" />,
      content:
        "We offer secure shipping across India. Returns are accepted within 7 days of delivery for unworn items with original tags. Custom-made or personalized jewelry is non-returnable.",
    },
  ];

  return (
    <div className="bg-white min-h-screen py-8 md:py-20 selection:bg-[#C59B27] selection:text-[#141211]">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-800 hover:text-[#C59B27] transition-all group font-bold uppercase tracking-widest text-[10px] mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="text-center mb-12 md:mb-20">
          <span className="text-[#C59B27] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-3 block">
            Legal Information
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#141211] mb-6">
            Terms & Conditions
          </h1>
          <div className="w-16 md:w-24 h-0.5 bg-[#C59B27]/40 mx-auto mb-6"></div>
          <p className="text-stone-400 text-xs md:text-sm font-serif italic">
            Last Updated: December 2025
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 md:p-12 shadow-sm border border-stone-200">
          <p className="text-stone-600 mb-10 md:mb-16 leading-relaxed text-sm md:text-base text-center max-w-2xl mx-auto">
            Welcome to Swarna Sparsh. Before you proceed with your purchase,
            please read these terms carefully. They outline our commitment to
            you and your responsibilities as a customer.
          </p>

          <div className="space-y-6 md:space-y-8">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="flex gap-4 md:gap-8 group p-6 rounded-2xl transition-all hover:bg-stone-50 border border-transparent hover:border-stone-200"
              >
                <div className="bg-white p-4 rounded-xl h-fit text-[#141211] border border-[#C59B27]/30 group-hover:bg-[#FAF8F5] transition-all duration-300 flex-shrink-0 shadow-sm">
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-serif font-bold text-[#141211] mb-3">
                    {section.title}
                  </h3>
                  <p className="text-stone-500 leading-relaxed text-sm md:text-base">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 md:mt-20 p-6 md:p-8 bg-stone-50 rounded-2xl border border-stone-200">
            <h4 className="font-bold text-[#141211] mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base font-serif">
              <AlertCircle className="w-5 h-5 text-[#C59B27]" />
              Need clarification?
            </h4>
            <p className="text-xs md:text-sm text-stone-500">
              If you have any questions regarding our terms, please reach out to
              our support team at{" "}
              <a
                href={`mailto:${settings?.email || "support@swarnasparsh.com"}`}
                className="font-bold text-[#141211] border-b border-[#C59B27]/40 hover:text-[#C59B27] transition-colors"
              >
                {settings?.email || "support@swarnasparsh.com"}
              </a>{" "}
              or visit our help center.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
