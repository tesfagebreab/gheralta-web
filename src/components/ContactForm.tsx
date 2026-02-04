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
        <input name="firstName" type="text" placeholder="First Name" className={`${inputStyles} text-base`} required />
        <input name="lastName" type="text" placeholder="Last Name" className={`${inputStyles} text-base`} required />
      </div>
      <input name="email" type="email" placeholder="Email Address" className={`${inputStyles} text-base`} required />
      <input name="phone" type="tel" placeholder="Phone / WhatsApp" className={`${inputStyles} text-base`} />
      <input 
        name="interest" 
        type="text" 
        placeholder="Interested Tour / Activity" 
        className={`${inputStyles} text-base`} 
        defaultValue={initialInterest} 
      />
      <textarea 
        name="message" 
        rows={4} 
        placeholder="Tell us about your dates, group size, and specific needs..." 
        className={`${inputStyles} text-base resize-none`} 
        required
      ></textarea>

      {/* Button styling matches the sandstone/burnt clay theme - optimized height for mobile tap targets */}
      <button 
        type="submit" 
        disabled={loading} 
        className={`w-full py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-white transition-all shadow-lg mt-2 md:mt-4 
          ${brand.colors.bgAccent} 
          hover:brightness-110 active:scale-[0.98]
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {loading ? "Processing..." : "Send Inquiry"}
      </button>

      <p className="text-[9px] md:text-[10px] text-center text-stone-400 uppercase tracking-widest">
        *We usually reply within 12 hours.
      </p>
    </form>
  );
}