import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-[#141414] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="space-y-4 max-w-md">
        <h1 className="text-5xl font-bold tracking-tight text-[#141414]">404.</h1>
        <h2 className="text-xl font-bold text-[#141414]">Page Not Found.</h2>
        <p className="text-xs text-[#707070] font-light">
          The requested system route or resource does not exist in Stoq.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs font-semibold rounded-full transition"
          >
            Return to Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
