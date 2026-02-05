import { STRAPI_URL, SITE_NAME } from '@/lib/constants';

export default async function DebugPage() {
  let allData = null;
  let error = null;
  // We remove the filter from the URL to stop the 400 error
  const apiUrl = `${STRAPI_URL}/api/domains?populate=*`;

  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    allData = await res.json();
  } catch (err: any) {
    error = err.message;
  }

  // Look for the specific brand in the returned list
  const myBrand = allData?.data?.find((item: any) => {
    const values = Object.values(item).map(v => String(v).toLowerCase());
    return values.some(v => v.includes(SITE_NAME.toLowerCase()));
  });

  return (
    <div className="p-10 font-mono text-sm bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Multi-Domain Debugger</h1>
      
      <div className="space-y-6">
        <section className="bg-blue-50 p-4 border border-blue-200 rounded">
          <p><strong>Current Domain (SITE_NAME):</strong> {SITE_NAME}</p>
          <p><strong>Brand Found in List:</strong> {myBrand ? "✅ Yes" : "❌ No"}</p>
        </section>

        <section className="bg-slate-900 text-green-400 p-6 rounded shadow-xl overflow-auto max-h-[500px]">
          <h2 className="text-white font-bold mb-4 border-b border-slate-700 pb-2">Full API Response (All 3 Domains):</h2>
          <pre>{JSON.stringify(allData, null, 2)}</pre>
        </section>

        {myBrand && (
          <section className="bg-white p-4 border border-green-200 rounded">
            <h2 className="font-bold text-green-600 mb-2">Your Specific Brand Data:</h2>
            <pre className="text-xs">{JSON.stringify(myBrand, null, 2)}</pre>
          </section>
        )}
      </div>
    </div>
  );
}