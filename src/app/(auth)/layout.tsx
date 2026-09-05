export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest" style={{ color: "var(--ff-accent)" }}>
            FAN<span className="font-black">FARE</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ff-muted)" }}>
            ファンの数だけ、ファンファーレ。
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
