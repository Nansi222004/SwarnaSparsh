import React, { useState, useEffect } from "react";
import loginHero from "@assets/login_hero_silver.png";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Crown, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useShop } from "../../../context/ShopContext";
import {
  readMenPendingCartItem,
  clearMenPendingCartItem,
} from "../utils/menNavigation";
import {
  readWomenPendingCartItem,
  clearWomenPendingCartItem,
} from "../utils/womenNavigation";

import defaultLogo from "@assets/logo.webp";
import { useSettings } from "../../../context/SettingsContext";

const Login = () => {
  const { sendOtp, verifyOtp } = useAuth();
  const { addToCart } = useShop();
  const { settings } = useSettings();
  const currentLogo = settings?.logo || defaultLogo;
  const currentStoreName = settings?.storeName || "Swarna Sparsh";
  const navigate = useNavigate();
  const location = useLocation();

  // Determine mode based on URL
  const isSignup = location.pathname === "/signup";
  const redirectParam = new URLSearchParams(location.search).get("redirect");
  const redirectTarget =
    redirectParam && redirectParam.startsWith("/") ? redirectParam : "/profile";

  const [phoneNumber, setPhoneNumber] = useState("");
  const [loginStep, setLoginStep] = useState(1);
  const [otp, setOtp] = useState(["", "", "", ""]);

  // Additional fields for Signup
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Reset state when mode changes
  useEffect(() => {
    setLoginStep(1);
    setPhoneNumber("");
    setOtp(["", "", "", ""]);
    setFullName("");
    setEmail("");
  }, [isSignup]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phoneNumber.length === 10) {
      const res = await sendOtp(phoneNumber, isSignup ? "signup" : "login");
      if (res.success) {
        setLoginStep(2);
      } else {
        toast.error(res.message);
      }
    } else {
      toast.error("Please enter a valid 10-digit phone number");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length === 4) {
      const res = await verifyOtp(
        phoneNumber,
        enteredOtp,
        isSignup ? "signup" : "login",
        isSignup
          ? {
            name: fullName.trim(),
            email: email.trim(),
          }
          : {},
      );
      if (res.success) {
        const pendingWomenCartItem = readWomenPendingCartItem();
        if (pendingWomenCartItem) {
          addToCart(pendingWomenCartItem);
          clearWomenPendingCartItem();
          navigate("/cart", { replace: true });
          return;
        }

        const pendingCartItem = readMenPendingCartItem();
        if (pendingCartItem) {
          addToCart(pendingCartItem);
          clearMenPendingCartItem();
          navigate("/cart", { replace: true });
          return;
        }

        navigate(redirectTarget, { replace: true });
      } else {
        toast.error(res.message);
      }
    } else {
      toast.error("Please enter the 4-digit OTP");
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    let newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 overflow-hidden bg-white">
      {/* Dynamic Background - Abstract Luxury */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-left-bottom scale-[1.35] origin-bottom-left animate-in fade-in duration-1000 grayscale-[20%]"
          style={{
            backgroundImage: `url(${loginHero})`, // Using existing local hero
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-black/20 backdrop-blur-[2px]"></div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-[60] text-black hover:bg-black/5 p-3 rounded-full transition-all group">
        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* Mobile View - Clean & Minimal */}
      <div className="absolute inset-0 z-50 flex flex-col justify-center px-4">
        <div className="relative w-full max-w-sm mx-auto p-[2px] rounded-[2rem] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {/* Animated Border */}
          <div className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#C59B27_360deg)] animate-[spin_4s_linear_infinite] z-0" />
          
          <div className="relative z-10 bg-white/95 backdrop-blur-xl px-6 py-8 rounded-[calc(2rem-2px)] w-full mx-auto border border-[#E8DFD0]/40">
          {/* Brand */}
          <div className="text-center mb-8 flex flex-col items-center gap-1.5">
            <img
              src={currentLogo}
              alt={currentStoreName}
              className="w-20 h-20 object-contain drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.src = defaultLogo;
              }}
            />
            <span className="font-serif text-lg font-bold tracking-wider text-stone-900 uppercase">
              {currentStoreName}
            </span>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-serif text-stone-900 mb-1 font-bold">
              {loginStep === 1
                ? isSignup
                  ? "Create Account"
                  : "Welcome Back"
                : "Verify OTP"}
            </h2>
            <p className="text-stone-500 text-sm font-sans">
              {loginStep === 1
                ? isSignup
                  ? "Begin your journey with us."
                  : "Please login to continue."
                : `Enter code sent to +91 ${phoneNumber}`}
            </p>
          </div>

          {loginStep === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {isSignup && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider pl-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-12 bg-stone-50/50 border border-stone-200 rounded-xl px-4 text-stone-900 font-medium placeholder:text-stone-400 focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27] outline-none transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider pl-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 bg-stone-50/50 border border-stone-200 rounded-xl px-4 text-stone-900 font-medium placeholder:text-stone-400 focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27] outline-none transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                </>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider pl-1">
                  Mobile Number
                </label>
                <div className="flex bg-stone-50/50 border border-stone-200 rounded-xl overflow-hidden h-12 items-center focus-within:border-[#C59B27] focus-within:ring-1 focus-within:ring-[#C59B27] transition-all">
                  <div className="h-full px-4 flex items-center gap-2 text-stone-700 font-semibold border-r border-stone-200">
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    placeholder="98765 43210"
                    className="flex-1 h-full bg-transparent border-0 px-4 text-stone-900 font-medium text-base placeholder:text-stone-400 focus:ring-0 outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#141211] text-[#E8D198] border border-[#C59B27]/50 hover:bg-[#1C1917] hover:border-[#C59B27] py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md mt-2">
                Get OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-between gap-3 px-2">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="1"
                    value={data}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onFocus={(e) => e.target.select()}
                    className="w-14 h-16 bg-transparent border-b-2 border-stone-300 focus:border-[#C59B27] text-center text-3xl font-bold text-stone-900 outline-none transition-all p-0 rounded-none"
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full bg-[#141211] text-[#E8D198] border border-[#C59B27]/50 hover:bg-[#1C1917] hover:border-[#C59B27] py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md">
                Verify & Proceed
              </button>
              <button
                type="button"
                onClick={() => setLoginStep(1)}
                className="w-full text-center text-[11px] font-bold text-stone-500 uppercase tracking-wider py-2 hover:text-[#C59B27] transition-colors">
                Change Mobile Number
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-stone-500 font-sans">
              {isSignup ? "Already a Member?" : "New here?"}
              <Link
                to={isSignup ? "/login" : "/signup"}
                className="ml-1 text-stone-900 font-bold border-b border-stone-900 hover:text-[#C59B27] hover:border-[#C59B27] transition-colors">
                {isSignup ? "Login" : "Join Now"}
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>


    </div>
  );
};

export default Login;
