"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { STRAPI_URL, getBrand, getField, getStrapiMedia } from "@/lib/constants";
import { clearCart, getCart, removeFromCart } from "@/lib/cart";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tourIdParam = searchParams.get('tourId'); 
  const brand = getBrand();
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    agreedToTerms: false
  });
  const [errors, setErrors] = useState<any>({});

  // Sync URL with LocalStorage if URL is empty
  useEffect(() => {
    if (!tourIdParam) {
      const cartIds = getCart();
      if (cartIds.length > 0) {
        router.replace(`/checkout?tourId=${cartIds.join(',')}`);
      }
    }
  }, [tourIdParam, router]);

  useEffect(() => {
    document.title = `Secure Checkout | ${window.location.hostname.replace('www.', '')}`;
    const meta = document.createElement('meta');
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.getElementsByTagName('head')[0].appendChild(meta);

    return () => {
      const head = document.getElementsByTagName('head')[0];
      if (head.contains(meta)) head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    async function fetchTours() {
      if (!tourIdParam) {
        setTours([]);
        setLoading(false);
        return;
      }
      try {
        const ids = tourIdParam.split(',').filter(Boolean);
        // Strapi v5 filtering logic
        const filters = ids.map((id, index) => `filters[documentId][$in][${index}]=${id}`).join('&');
        const query = `${STRAPI_URL}/api/tours?${filters}&populate=*`;
        
        const res = await fetch(query, { cache: 'no-store' });
        const json = await res.json();
        
        const fetchedTours = json.data?.map((tour: any) => ({
          ...tour,
          selectedTravelers: 2, 
          selectedDate: ''
        })) || [];

        setTours(fetchedTours);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTours();
  }, [tourIdParam]);

  const handleRemoveTour = (docId: string) => {
    removeFromCart(docId);
    const remainingIds = tours.filter(t => t.documentId !== docId).map(t => t.documentId);
    if (remainingIds.length > 0) {
      router.push(`/checkout?tourId=${remainingIds.join(',')}`);
    } else {
      router.push('/tours');
    }
  };

  const updateTourSelection = (index: number, key: string, value: any) => {
    const newTours = [...tours];
    newTours[index][key] = value;
    setTours(newTours);
  };

  const getTourPriceBreakdown = (tour: any) => {
    const tiers = getField(tour, 'pricing_tiers');
    const n = tour.selectedTravelers;
    let ppp = 0;
    
    if (tiers) {
      if (n === 1) ppp = getField(tiers, 'tier_1') || 0;
      else if (n <= 3) ppp = getField(tiers, 'tier_2_3') || 0;
      else if (n <= 10) ppp = getField(tiers, 'tier_4_10') || 0;
      else ppp = getField(tiers, 'tier_11_plus') || 0;
    } else {
      ppp = getField(tour, 'price') || 0;
    }
    
    return { ppp, total: ppp * n };
  };

  const totalCostOfTours = tours.reduce((acc, tour) => acc + getTourPriceBreakdown(tour).total, 0);

  const validateForm = () => {
    let newErrors: any = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Required";
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = "Invalid email";
    if (!formData.phone.trim()) newErrors.phone = "Required";
    if (!formData.agreedToTerms) newErrors.agreedToTerms = "Accept policies";
    if (tours.some(t => !t.selectedDate)) newErrors.dates = "Select dates for all tours";
    setErrors(newErrors);
    // ADD THIS: Feedback for the user
    if (Object.keys(newErrors).length > 0) {
      alert("Please complete all required fields and accept the Booking Terms to proceed to payment.");
    }
    
    return Object.keys(newErrors).length === 0;
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-stone-400 uppercase text-[10px] tracking-widest text-center">Initialising Checkout...</div>;

  if (tours.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-[#fafaf9]">
        <p className="font-black italic uppercase text-stone-400 tracking-widest">Your Tour Cart is Empty</p>
        <Link href="/tours" className={`px-8 py-4 rounded-full text-white font-black uppercase text-[11px] tracking-widest ${brand.bgAccent} hover:scale-105 transition-transform shadow-lg`}>
          Browse Tours
        </Link>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "", currency: "USD" }}>
      <div className="min-h-screen bg-[#F5F5F7] text-slate-900 pb-20 font-sans">
        
        <header className="bg-white border-b border-stone-200 py-4 px-8 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${brand.bgAccent} animate-pulse`}></div>
            <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-800">
              Secure Checkout
            </h1>
          </div>
          
          <div className="flex items-center gap-6 shrink-0">
            <Link 
              href="/tours" 
              className="hidden sm:block text-[9px] font-black text-stone-500 uppercase tracking-widest hover:text-black hover:underline underline-offset-4"
            >
              + Add More
            </Link>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em]">
              {window.location.hostname.replace('www.', '')}
            </span>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            <div className="lg:w-7/12 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-black italic uppercase tracking-tight text-stone-800">
                  My Tours ({tours.length})
                </h2>
                <Link 
                  href="/tours" 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#c2410c] text-[#c2410c] text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all active:scale-95`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                  Add Another Tour
                </Link>
              </div>
              
              {tours.map((tour, idx) => {
                const title = getField(tour, 'title');
                const mainImage = getField(tour, 'image');
                const gallery = getField(tour, 'gallery');
                const displayImage = mainImage?.url ? mainImage : (Array.isArray(gallery) ? gallery[0] : null);
                const { ppp, total } = getTourPriceBreakdown(tour);
                
                return (
                  <div key={tour.documentId} className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden relative group">
                    <button 
                      onClick={() => handleRemoveTour(tour.documentId)}
                      className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md text-red-600 p-2 rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-red-50 shadow-sm border border-stone-100"
                      title="Remove from pack"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 h-40 md:h-auto bg-stone-100 relative">
                        {displayImage ? (
                          <img 
                            src={getStrapiMedia(displayImage)} 
                            alt={title} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-stone-300 uppercase">No Image</div>
                        )}
                      </div>
                      <div className="md:w-2/3 p-6 space-y-4">
                        <h3 className="text-lg font-black uppercase italic leading-tight break-words overflow-wrap-anywhere tracking-tighter">
                          {title}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-stone-50 pt-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Tour Start Date</label>
                            <input 
                              type="date" 
                              required
                              value={tour.selectedDate}
                              onChange={(e) => updateTourSelection(idx, 'selectedDate', e.target.value)}
                              className="w-full p-2 bg-stone-50 rounded-lg text-xs font-bold border-none outline-none focus:ring-1 focus:ring-[#c2410c]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Travelers</label>
                            <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-lg w-fit">
                              <button onClick={() => updateTourSelection(idx, 'selectedTravelers', Math.max(1, tour.selectedTravelers - 1))} className="w-6 h-6 bg-white rounded shadow-sm font-bold text-sm hover:bg-stone-100 transition-colors">-</button>
                              <span className="font-bold text-xs px-1">{tour.selectedTravelers}</span>
                              <button onClick={() => updateTourSelection(idx, 'selectedTravelers', tour.selectedTravelers + 1)} className="w-6 h-6 bg-white rounded shadow-sm font-bold text-sm hover:bg-stone-100 transition-colors">+</button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-stone-50 p-3 rounded-xl flex justify-between items-center border border-stone-100">
                          <div className="text-[9px] font-bold uppercase text-stone-400">
                            Price per Person: <span className="text-stone-900 ml-1">${ppp}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[14px] font-black italic text-[#c2410c]">Subtotal: ${total}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="bg-stone-900 rounded-3xl p-6 text-white flex justify-between items-center shadow-lg">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Total Amount</h4>
                  <p className="hidden sm:block text-[9px] text-stone-500 italic font-medium">Prices are inclusive of local taxes</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black italic tracking-tighter text-white">${totalCostOfTours}</span>
                </div>
              </div>
            </div>

            <aside className="lg:w-5/12">
              <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm sticky top-28">
                <h2 className="text-lg font-black mb-6 italic uppercase tracking-tight text-stone-800">Lead Traveler Details</h2>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest px-1"> Full Name</label>
                    <input type="text" placeholder="John Doe" onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl text-sm font-bold border-none outline-none focus:ring-1 focus:ring-[#c2410c]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest px-1">Email</label>
                    <input type="email" placeholder="email@example.com" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl text-sm font-bold border-none outline-none focus:ring-1 focus:ring-[#c2410c]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest px-1">Phone / WhatsApp</label>
                    <input type="tel" placeholder="+..." onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl text-sm font-bold border-none outline-none focus:ring-1 focus:ring-[#c2410c]" />
                  </div>

                  <div className="pt-6 border-t border-stone-50">
                    <label className="flex items-start gap-3 cursor-pointer mb-6 group">
  <input 
    type="checkbox" 
    checked={formData.agreedToTerms} 
    onChange={(e) => setFormData({...formData, agreedToTerms: e.target.checked})} 
    className="mt-1 w-4 h-4 rounded border-stone-300 accent-[#c2410c] cursor-pointer" 
  />
  <p className="text-[10px] font-bold text-stone-500 uppercase leading-relaxed italic">
    I accept the {' '}
    <Link 
      href="/booking-terms" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-[#c2410c] underline decoration-stone-300 underline-offset-2 hover:text-[#9a3412] transition-colors"
    >
      Booking Terms and Conditions
    </Link>.
  </p>
</label>

                    <div className="relative z-10">
                      {(!formData.agreedToTerms || !formData.fullName || tours.some(t => !t.selectedDate)) ? (
                        <button onClick={validateForm} className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-stone-800 transition-all shadow-md">
                          Complete Info to Proceed to Payment
                        </button>
                      ) : (
                        <PayPalButtons 
                          style={{ layout: "vertical", shape: "pill", color: "black", height: 45 }}
                          createOrder={(data, actions) => {
                            return actions.order.create({
                              intent: "CAPTURE",
                              purchase_units: [{
                                description: `${window.location.hostname.replace('www.', '')} - ${tours.map(t => getField(t, 'title')).join(', ')}`,
                                amount: { currency_code: "USD", value: totalCostOfTours.toString() }
                              }]
                            });
                          }}
                          onApprove={async (data, actions) => {
                            if (actions.order) {
                              const details = await actions.order.capture();
                              
                              await fetch(`${STRAPI_URL}/api/bookings`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  data: {
                                    fullName: formData.fullName,
                                    email: formData.email,
                                    phone: formData.phone,
                                    totalPaid: totalCostOfTours,
                                    bookingStatus: 'paid',
                                    site_source: window.location.hostname.replace('www.', ''),
                                    details: tours.map(t => ({
                                      title: getField(t, 'title'),
                                      date: t.selectedDate,
                                      travelers: t.selectedTravelers,
                                      total: getTourPriceBreakdown(t).total
                                    })),
                                    paypalOrderId: details.id
                                  }
                                })
                              });

                              await fetch('/api/emails', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  type: "BOOKING",
                                  siteName: window.location.hostname.replace('www.', ''),
                                  data: {
                                    tours: tours.map(t => `${getField(t, 'title')} (${t.selectedDate})`).join(', '),
                                    customerName: formData.fullName,
                                    customerEmail: formData.email,
                                    amount: totalCostOfTours
                                  }
                                })
                              });

                              clearCart(); 
                              router.push('/checkout/success');
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </PayPalScriptProvider>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-xs text-stone-300 bg-[#fafaf9]">PROCESSING...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}