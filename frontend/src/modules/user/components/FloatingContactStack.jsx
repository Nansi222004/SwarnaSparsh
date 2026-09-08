import React from 'react';
import WhatsAppFloating from './WhatsAppFloating';
import SupportChatWidget from './SupportChatWidget';

/**
 * Bottom-right FAB stack — Support sits directly above WhatsApp with a
 * consistent gap. On product pages the whole stack is nudged upward via
 * `.floating-contact-stack` in ProductDetails.jsx (mobile sticky bar).
 */
const FloatingContactStack = () => (
  <div className="floating-contact-stack fixed bottom-20 md:bottom-8 right-6 z-[9999] flex flex-col-reverse items-center gap-3">
    <WhatsAppFloating inline />
    <SupportChatWidget inline />
  </div>
);

export default FloatingContactStack;
