import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Car, Train, Clock, ExternalLink, Copy, Check, ShieldCheck } from 'lucide-react';

interface Props {
  lang?: string;
}

export const VenueMap: React.FC<Props> = () => {
  const [copied, setCopied] = useState(false);

  const address = 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304';
  const gateInfo = 'महर्षि विश्वविद्यालय / आश्रम - गेट संख्या 5 (Gate No. 5)';
  const googleMapsUrl = 'https://maps.app.goo.gl/aFmMAF5gFHR46gBGA';

  const handleCopy = () => {
    navigator.clipboard.writeText(`${gateInfo}, ${address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 space-y-6">
      {/* Venue Header Banner */}
      <div className="bg-gradient-to-r from-[#4a0e17] via-[#6a1521] to-[#3a080f] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-400/40 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-[#fce49b] px-3.5 py-1 rounded-full text-xs font-bold border border-amber-400/30">
            <MapPin className="w-4 h-4 text-amber-300" />
            <span>आधिकारिक महायज्ञ स्थल एवं प्रवेश द्वार</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#ffea79]">
            {gateInfo}
          </h2>

          <p className="text-sm sm:text-base text-amber-100 font-medium">
            {address}
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>गूगल मैप्स पर दिशा-निर्देश प्राप्त करें</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/30 font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'पता कॉपी हो गया!' : 'पूर्ण पता कॉपी करें'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Map & Quick Navigation Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Interactive Map Iframe */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-3 sm:p-4 shadow-md border border-amber-200 flex flex-col">
          <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-stone-100 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-stone-900">
              <Compass className="w-4 h-4 text-amber-800" />
              <span>लाइव जीपीएस मानचित्र (Live GPS Map - Sector 110 Noida)</span>
            </div>
            <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
              गेट नं. 5 मुख्य द्वार
            </span>
          </div>

          <div className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border border-stone-200 shadow-inner bg-stone-100">
            {/* OpenStreetMap iframe centered at Noida Sector 110 Maharishi Nagar */}
            <iframe
              title="Maharishi Ashram Ramlila Maidan Gate 5 Noida"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src="https://www.openstreetmap.org/export/embed.html?bbox=77.375%2C28.520%2C77.410%2C28.545&amp;layer=mapnik&amp;marker=28.532%2C77.392"
              className="w-full h-full filter saturate-[1.1]"
            />
            {/* Overlay badge with location tag */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl shadow-lg border border-amber-300 text-xs text-stone-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              <span className="font-bold text-stone-900">
                गेट संख्या 5, महर्षि आश्रम रामलीला मैदान
              </span>
            </div>
          </div>
        </div>

        {/* Right Info Cards */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* Card 1: Metro */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2.5">
              <Train className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm mb-1 font-heading">
              निकटतम मेट्रो स्टेशन
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              <strong>एक्वा लाइन (Aqua Line):</strong> सेक्टर-81 अथवा NSEZ मेट्रो स्टेशन से मात्र 1.5 से 2 किमी की दूरी। स्टेशन से ई-रिक्शा एवं ऑटो सेवा महर्षि आश्रम गेट 5 हेतु निरंतर उपलब्ध हैं।
            </p>
          </div>

          {/* Card 2: Road & Highway */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-2.5">
              <Car className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm mb-1 font-heading">
              सड़क मार्ग एवं पार्किंग
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              नोएडा-ग्रेटर नोएडा एक्सप्रेसवे से सेक्टर-110 की ओर प्रवेश करें। महर्षि विश्वविद्यालय के <strong>गेट संख्या 5</strong> पर यजमानों हेतु समर्पित निशुल्क पार्किंग स्थल उपलब्ध है।
            </p>
          </div>

          {/* Card 3: Gate Timing & Entry Pass */}
          <div className="bg-amber-50/80 rounded-2xl p-4 sm:p-5 shadow-sm border border-amber-300">
            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center mb-2.5">
              <Clock className="w-5 h-5 text-amber-800" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm mb-1 font-heading">
              यजमान प्रवेश समय
            </h4>
            <p className="text-xs text-stone-700 leading-relaxed">
              यज्ञ प्रातः <strong>07:30 बजे</strong> प्रारंभ होगा। कृपया प्रातः <strong>06:45 से 07:15 बजे</strong> के बीच गेट नं. 5 पर अपना डिजिटल अथवा प्रिंटेड प्रवेश पत्र (Slip) दिखाकर प्रवेश करें।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
