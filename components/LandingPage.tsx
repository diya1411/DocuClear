import React from 'react';
import { UploadCloud, ShieldCheck, ArrowRight, Star, FileCheck, Zap, MessageSquare } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center w-full px-4 pb-20 pt-6 max-w-[1400px] mx-auto space-y-6">
      
      {/* Hero Section */}
      <section className="w-full relative h-[600px] rounded-[2.5rem] overflow-hidden group">
        <div className="absolute inset-0 bg-earth-900">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop" 
            alt="Modern Office" 
            className="w-full h-full object-cover opacity-80 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-earth-900/90 via-transparent to-transparent"></div>
        </div>

        <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between">
            <div className="flex justify-between items-start text-white/80 text-sm font-medium tracking-wide uppercase">
               <span>Ai-Powered Legal Assistant</span>
            </div>

            <div className="flex flex-col md:flex-row items-end justify-between gap-8">
               <h1 className="text-5xl md:text-7xl font-serif text-white leading-[1.1]">
                 Legal Documents <br />
                 to Plain English
               </h1>
               
               <div className="max-w-md mb-2">
                 <p className="text-earth-100 text-lg leading-relaxed mb-6 font-light">
                   DocuClear simplifies the complex process of understanding contracts, leases, and agreements for everyone.
                 </p>
                 <button 
                   onClick={onStart}
                   className="bg-[#F2F0EA] text-earth-900 px-8 py-4 rounded-full font-semibold hover:bg-white transition flex items-center gap-2"
                 >
                   Start Your Analysis
                   <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </div>
        </div>
      </section>

      {/* Stats & Intro Section */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card - Brown */}
        <div className="lg:col-span-5 bg-[#C6A88F] rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[400px] text-[#3E3025]">
           <div>
              <span className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Our Impact</span>
              <div className="w-12 h-12 bg-[#3E3025] rounded-full flex items-center justify-center text-[#C6A88F] mb-8">
                 <Zap className="w-6 h-6" />
              </div>
           </div>

           <div className="space-y-8">
              <div>
                 <h3 className="text-5xl font-serif mb-1">150+</h3>
                 <p className="text-sm font-semibold uppercase tracking-wide opacity-80">Document Types</p>
              </div>
              <div>
                 <h3 className="text-5xl font-serif mb-1">3.0</h3>
                 <p className="text-sm font-semibold uppercase tracking-wide opacity-80">Powered by Gemini Pro</p>
              </div>
           </div>
        </div>

        {/* Right Card - Beige */}
        <div className="lg:col-span-7 bg-[#E6E2D8] rounded-[2.5rem] p-0 flex flex-col md:flex-row overflow-hidden min-h-[400px]">
           <div className="p-10 flex flex-col justify-center md:w-1/2">
              <h2 className="text-3xl font-serif text-[#3E3025] mb-6">Who We Are</h2>
              <p className="text-[#3E3025]/80 leading-relaxed mb-6">
                At DocuClear, we understand the challenges of deciphering legal jargon. 
                We've made it our mission to simplify the review process, ensuring every contract 
                is understood flawlessly from initial read to final signature.
              </p>
              <div className="flex gap-2">
                 <div className="w-10 h-10 rounded-full bg-white/50"></div>
                 <div className="w-10 h-10 rounded-full bg-white/50 ml-[-15px]"></div>
                 <div className="w-10 h-10 rounded-full bg-white/50 ml-[-15px] flex items-center justify-center text-xs font-bold text-[#3E3025]">+2k</div>
              </div>
           </div>
           <div className="md:w-1/2 h-64 md:h-auto relative">
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop" 
                alt="Working on documents" 
                className="absolute inset-0 w-full h-full object-cover"
              />
           </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="w-full py-12">
         <h2 className="text-3xl md:text-4xl font-serif text-[#3E3025] mb-10 pl-4">
           How We Simplify Your <br />
           <span className="text-earth-500">Document Experience</span>
         </h2>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step Card matching visual */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-earth-100 relative overflow-hidden group hover:shadow-lg transition">
               <span className="text-[120px] font-serif text-earth-100 absolute -top-4 -left-4 select-none leading-none">1</span>
               
               <div className="relative z-10 mt-16">
                  <h3 className="text-2xl font-serif text-[#3E3025] mb-3">Instant AI Analysis</h3>
                  <p className="text-earth-600 mb-6 leading-relaxed max-w-sm">
                    Our commitment to your clarity extends beyond simple reading. 
                    We conduct a thorough final walkthrough of every clause to ensure 
                    your satisfaction and understanding.
                  </p>
                  
                  <div className="relative h-64 w-full rounded-2xl overflow-hidden mt-8 shadow-2xl">
                     <img 
                       src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
                       alt="Interior"
                       className="w-full h-full object-cover"
                     />
                     {/* Overlay UI mockup */}
                     <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="bg-green-100 p-2 rounded-lg text-green-700">
                           <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-earth-900">Risk Score: 92/100</p>
                           <p className="text-[10px] text-earth-500">Document looks safe to sign</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-6">
               <div className="bg-[#F2F0EA] rounded-[2.5rem] p-10 flex-1 relative overflow-hidden group cursor-pointer hover:bg-[#E6E2D8] transition" onClick={onStart}>
                   <div className="absolute top-8 right-8 bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition">
                      <UploadCloud className="w-6 h-6 text-earth-600" />
                   </div>
                   <div className="mt-auto pt-20">
                      <h3 className="text-xl font-serif text-[#3E3025]">Drag & Drop Upload</h3>
                      <p className="text-sm text-earth-600 mt-2">Start by uploading your PDF</p>
                   </div>
               </div>
               <div className="bg-[#3E3025] rounded-[2.5rem] p-10 flex-1 text-[#F2F0EA] relative overflow-hidden">
                   <div className="absolute top-8 right-8 bg-white/10 p-3 rounded-full">
                      <MessageSquare className="w-6 h-6 text-[#F2F0EA]" />
                   </div>
                   <div className="mt-auto pt-20">
                      <h3 className="text-xl font-serif">Interactive Chat</h3>
                      <p className="text-sm text-earth-300 mt-2">Ask questions about any clause</p>
                   </div>
               </div>
            </div>
         </div>
      </section>

      {/* Why Choose Us */}
      <section className="w-full pb-12">
         <h2 className="text-3xl md:text-4xl font-serif text-[#3E3025] mb-10 pl-4">
            Why Choose DocuClear
         </h2>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#E6E2D8] p-8 rounded-[2rem] aspect-square flex flex-col justify-between">
               <span className="text-sm font-bold uppercase tracking-widest opacity-50">Precision</span>
               <div>
                  <h3 className="text-xl font-serif text-[#3E3025] mb-2">End-to-End Analysis</h3>
                  <p className="text-xs text-[#3E3025]/70 leading-relaxed">
                     We manage every aspect of your document review, saving you time and resources.
                  </p>
               </div>
            </div>

            <div className="bg-[#F2F0EA] p-8 rounded-[2rem] aspect-square flex flex-col justify-between">
               <span className="text-sm font-bold uppercase tracking-widest opacity-50">Support</span>
               <div className="flex justify-center my-4">
                  <div className="w-20 h-20 bg-gradient-to-tr from-earth-300 to-earth-100 rounded-full blur-xl opacity-80"></div>
               </div>
               <div className="text-center">
                  <h3 className="text-xl font-serif text-[#3E3025]">Legal Clarity</h3>
               </div>
            </div>

            <div className="bg-gradient-to-b from-[#6B5842] to-[#3E3025] p-8 rounded-[2rem] aspect-square flex flex-col justify-between text-[#F2F0EA]">
               <span className="text-sm font-bold uppercase tracking-widest opacity-50">Variety</span>
               <div>
                  <h3 className="text-xl font-serif mb-2">No Document Restrictions</h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                     We partner with the best LLMs to grant our quality standards, providing the broadest selection of legal knowledge.
                  </p>
               </div>
            </div>
         </div>
         
         <div className="w-full mt-6 h-64 md:h-80 rounded-[2.5rem] relative overflow-hidden group">
            <img 
               src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2340&auto=format&fit=crop"
               alt="Superior Quality"
               className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex items-end p-10">
               <div className="max-w-lg">
                  <h3 className="text-2xl font-serif text-white mb-2">Superior Security</h3>
                  <p className="text-white/80 text-sm">
                     We specialize in privacy-first analysis. Your documents are processed in memory and never used for training.
                  </p>
               </div>
            </div>
         </div>
      </section>

      <footer className="w-full py-8 text-center text-[#3E3025]/40 text-sm">
         <p>&copy; 2025 DocuClear. Design inspired by Compatto.</p>
      </footer>
    </div>
  );
};

export default LandingPage;