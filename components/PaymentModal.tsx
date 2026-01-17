
import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { X, CreditCard, ShieldCheck, Zap, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { NeonCard } from './NeonCard';

interface PaymentModalProps {
  plan: {
    key: string;
    label: string;
    price: string;
    credits: number;
  };
  lang: Language;
  onClose: () => void;
  onSuccess: (credits: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ plan, lang, onClose, onSuccess }) => {
  const t = translations[lang];
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'details' | 'redirecting' | 'processing' | 'success'>('details');

  const handlePay = () => {
    setIsProcessing(true);
    setStep('redirecting');
    
    // Step 1: Simulated Redirect to Stripe Checkout Page
    setTimeout(() => {
        setStep('processing');
        // Step 2: Simulated callback from Stripe (Webhooks would handle this in cloud)
        setTimeout(() => {
            setStep('success');
            setIsProcessing(false);
            setTimeout(() => {
                onSuccess(plan.credits);
            }, 2000);
        }, 3000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cyber-dark/95 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-md glass-card border border-cyber-turquoise/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(52,224,247,0.2)]">
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-cyber-turquoise/20 rounded-lg text-cyber-turquoise">
                <CreditCard size={20} />
             </div>
             <h2 className="text-xl font-futuristic font-bold neon-text-cyan uppercase tracking-widest">{t.paymentTitle}</h2>
          </div>
          {!isProcessing && (
            <button onClick={onClose} className="text-gray-500 hover:text-white transition">
                <X size={24} />
            </button>
          )}
        </div>

        <div className="p-8">
          {step === 'details' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">SELECTED POWER LEVEL</p>
                <div className="flex justify-between items-end">
                  <h3 className="text-2xl font-black text-white">{plan.label}</h3>
                  <div className="text-right">
                    <span className="text-2xl font-black text-cyber-turquoise">${plan.price}</span>
                    <span className="text-[10px] text-gray-500 uppercase ml-1">{t.perMonth}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 bg-cyber-turquoise/5 p-4 rounded-xl border border-cyber-turquoise/20">
                <ShieldCheck size={20} className="text-cyber-turquoise shrink-0" />
                <p>Payment secured by **Stripe**. Your financial data never touches our neural network.</p>
              </div>

              <button 
                onClick={handlePay}
                className="w-full py-4 bg-gradient-to-r from-cyber-turquoise to-cyber-purple text-white font-black rounded-xl hover:shadow-[0_0_20px_rgba(52,224,247,0.4)] transition-all uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <Zap size={18} /> {t.payNow}
              </button>
            </div>
          )}

          {step === 'redirecting' && (
             <div className="text-center py-12 space-y-6 animate-fadeIn">
                <div className="relative inline-block">
                    <Loader2 size={64} className="text-cyber-turquoise animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-cyber-turquoise/20 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-lg font-futuristic font-bold text-white uppercase tracking-widest">{t.redirectingStripe}</h3>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center justify-center gap-2">
                    <ArrowRight size={12}/> secure.stripe.com
                </p>
             </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12 space-y-6 animate-pulse">
              <div className="relative inline-block">
                <Loader2 size={64} className="text-cyber-turquoise animate-spin" />
                <div className="absolute inset-0 blur-xl bg-cyber-turquoise/20 rounded-full animate-pulse"></div>
              </div>
              <p className="text-cyber-turquoise font-futuristic font-bold tracking-widest uppercase">{t.stripeConnect}</p>
              <div className="flex justify-center gap-1">
                {[1,2,3].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-cyber-turquoise rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12 space-y-6 animate-fadeIn">
              <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(74,222,128,0.4)]">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-futuristic font-black text-white uppercase tracking-tighter">{t.paymentSuccess}</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">{t.creditsAdded}</p>
              <div className="flex items-center justify-center gap-2 text-cyber-turquoise font-black text-xl">
                <Zap size={24} /> +{plan.credits}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-black/20 text-center">
           <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">SECURE TRANSACTION GATEWAY • SociAI MediA Studio</p>
        </div>
      </div>
    </div>
  );
};
