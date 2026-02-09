'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactForm({ brand, initialInterest, inputStyles, siteName }: any) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      type: "INQUIRY",
      siteName: siteName,
      brand: brand.name,
      data: {
        fullName: `${formData.get('firstName')} ${formData.get('lastName')}`,
        email: formData.get('email'),
        phone: formData.get('phone'),
        tourTitle: formData.get('interest'),
        message: formData.get('message'),
        arrivalDate: "TBD",
        departureDate: "TBD",
        travelers: "1"
      }
    };

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/contact/success');
      } else {
        alert("Failed to send inquiry. Please try again or contact us via WhatsApp.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <input 
          name="firstName" 
          type="text" 
          placeholder="First Name" 
          className={inputStyles} 
          required 
        />
        <input 
          name="lastName" 
          type="text" 
          placeholder="Last Name" 
          className={inputStyles} 
          required 
        />
      </div>
      
      <input 
        name="email" 
        type="email" 
        placeholder="Email Address" 
        className={inputStyles} 
        required 
      />
      
      <input 
        name="phone" 
        type="tel" 
        placeholder="Phone / WhatsApp" 
        className={inputStyles} 
      />
      
      <input 
        name="interest" 
        type="text" 
        placeholder="Interested Tour / Activity" 
        className={inputStyles} 
        defaultValue={initialInterest} 
      />
      
      <textarea 
        name="message" 
        rows={4} 
        placeholder="Tell us about your dates, group size, and specific needs..." 
        className={`${inputStyles} resize-none`} 
        required
      ></textarea>

      {/* Button styling: Uses the Tailwind v4 brand-accent utility. 
        Maintains the "Send Inquiry" button styling as requested.
      */}
      <button 
        type="submit" 
        disabled={loading} 
        className={`w-full py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-white transition-all shadow-lg mt-2 md:mt-4 
          bg-brand-accent hover:bg-brand-hover active:scale-[0.98]
          ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-brand-accent/20'}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : "Send Inquiry"}
      </button>

      <p className="text-[9px] md:text-[10px] text-center text-stone-400 uppercase tracking-widest font-bold">
        *We usually reply within 12 hours.
      </p>
    </form>
  );
}