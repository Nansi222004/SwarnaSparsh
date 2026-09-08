import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { useSettings } from "../../../context/SettingsContext";

const InfoPage = ({ type }) => {
  const { settings } = useSettings();

  // Dynamic Content Config
  const contentMap = {
    about: {
      title: "About Swarna Sparsh",
      subtitle: "Delivering elegance to your doorstep",
      content: (
        <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
          <p>
            At Swarna Sparsh, we believe in the power of pure, exquisite
            jewellery. Our journey began with a simple mission: to bring timeless
            craftsmanship and contemporary designs to mindful consumers.
          </p>
          <p>
            We source premium dry fruits, nuts, seeds, and organic staples
            directly from growers who practice sustainable farming. Every
            product is handpicked, quality-checked, and packed with care to
            ensure you get nothing but the best.
          </p>
          <h3 className="text-2xl font-black text-footerBg mt-10 mb-4">
            Our Values
          </h3>
          <ul className="grid md:grid-cols-3 gap-6">
            <li className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <strong className="block text-primary text-xl mb-2">
                Authenticity
              </strong>
              What you see is what you get. No hidden additives, preservatives,
              or artificial flavors.
            </li>
            <li className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <strong className="block text-primary text-xl mb-2">
                Quality
              </strong>
              Premium grade produce sourced directly from the best regions
              globally.
            </li>
            <li className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <strong className="block text-primary text-xl mb-2">
                Sustainability
              </strong>
              Supporting eco-friendly farming practices and ethical sourcing.
            </li>
          </ul>
        </div>
      ),
    },
    privacy: {
      title: "Privacy Policy",
      subtitle: "Your trust is our priority",
      content: (
        <div className="space-y-8 text-gray-600 leading-relaxed">
          <p>
            Your privacy is important to us. This policy outlines how we
            collect, use, and protect your personal information.
          </p>

          <div>
            <h3 className="text-xl font-bold text-footerBg mb-2">
              1. Information Collection
            </h3>
            <p>
              We collect information you provide directly to us, such as when
              you create an account, make a purchase, or sign up for our
              newsletter. This includes your name, email address, phone number,
              and shipping address.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-footerBg mb-2">
              2. Use of Information
            </h3>
            <p>
              We use your information to process orders, communicate with you,
              and improve our services. We may also send you promotional emails
              about new products, special offers, or other information which we
              think you may find interesting.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-footerBg mb-2">
              3. Data Security
            </h3>
            <p>
              We implement security measures to protect your data. We do not
              sell your personal information to third parties. Access to your
              personal data is restricted to employees who need it to perform
              their job.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-footerBg mb-2">4. Cookies</h3>
            <p>
              We use cookies to analyze website traffic and optimize your
              browsing experience. You can choose to accept or decline cookies
              in your browser settings.
            </p>
          </div>
        </div>
      ),
    },
    terms: {
      title: "Terms of Service",
      subtitle: "Please read carefully",
      content: (
        <div className="space-y-8 text-gray-600 leading-relaxed">
          <p>
            By accessing and using this website, you agree to comply with and be
            bound by the following terms and conditions.
          </p>

          <div>
            <h3 className="text-xl font-bold text-footerBg mb-2">
              1. Product Quality & Sourcing
            </h3>
            <p>
              All products are natural and subject to seasonal variations. We
              strive to maintain the highest quality standards, but minor
              variations in size, color, and texture may occur naturally.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-footerBg mb-2">
              2. Orders & Payments
            </h3>
            <p>
              We accept online payments via major credit/debit cards, UPI, and net
              banking. Orders are confirmed upon successful payment. Cash on
              Delivery (COD) may be available for select pin codes.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-footerBg mb-2">
              3. Returns & Refunds
            </h3>
            <p>
              Due to the perishable nature of our products, returns are only
              accepted for damaged, defective, or incorrect items reported within
              48 hours of delivery.
            </p>
          </div>
        </div>
      ),
    },
    contact: {
      title: "Contact Us",
      subtitle: "We'd love to hear from you",
      content: (
        <div className="space-y-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Direct Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-footerBg mb-2">
                  Get in Touch
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Have a question about your order, want to partner with us, or
                  simply want to say hello? We are always ready to help.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-footerBg text-sm">
                      Visit Us
                    </h4>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                      {settings?.address || "Swarna Sparsh, Sarafa Lane Gandhi Chowk Wani, 445304, Dist - Yavatmal, Maharashtra"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-footerBg text-sm">
                      Email Us
                    </h4>
                    <div className="text-gray-500 text-sm mt-1 space-y-0.5">
                      <a
                        href={`mailto:${settings?.email || "support@swarnasparsh.com"}`}
                        className="block hover:text-primary transition-colors font-medium"
                      >
                        {settings?.email || "support@swarnasparsh.com"}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-footerBg text-sm">Call Us</h4>
                    <p className="text-gray-500 text-sm mt-1">
                      <a
                        href={`tel:${settings?.phone || "+919921128662"}`}
                        className="hover:text-primary transition-colors font-medium"
                      >
                        {settings?.phone || "+919921128662"}
                      </a>{" "}
                      <span className="text-xs text-gray-400 ml-1">
                        (Mon-Sat, 10am-7pm)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Form */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-lg font-bold text-footerBg mb-4">
                Send a Message
              </h3>
              <form className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                    placeholder="Phone"
                  />
                </div>
                <input
                  type="email"
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                  placeholder="Email Address"
                />
                <textarea
                  rows="3"
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none text-sm"
                  placeholder="Your Message"
                ></textarea>
                <button className="w-full bg-footerBg hover:bg-primary text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-md hover:shadow-lg">
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Compact Map */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 h-48 w-full grayscale hover:grayscale-0 transition-all duration-500">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117925.21662668516!2d75.81898162269986!3d22.72396328325608!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fcad1b410ddb%3A0x96ec4da356240f4!2sIndore%2C%20Madhya%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      ),
    },
  };

  const data = contentMap[type] || contentMap.about;

  return (
    <div className="bg-[#fcfcfc] min-h-screen py-8 px-6 lg:px-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-5xl font-black text-footerBg uppercase tracking-tighter mb-2">
            {data.title}
          </h1>
          <p className="text-primary font-black tracking-[0.2em] uppercase text-xs">
            {data.subtitle}
          </p>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
          {data.content}
        </div>
      </motion.div>
    </div>
  );
};

export default InfoPage;
