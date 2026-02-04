// app/loading.tsx

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        {/* Simple, elegant spinner matching your brand's black/amber style */}
        <div className="w-12 h-12 border-4 border-slate-100 border-t-amber-600 rounded-full animate-spin mb-4"></div>
        
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">
          Preparing Expedition...
        </p>
      </div>
    </div>
  );
}