export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden">
      {/* Colorful Animated Blobs for Background */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-emerald-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
