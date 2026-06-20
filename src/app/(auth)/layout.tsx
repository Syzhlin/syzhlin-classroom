export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at 50% 35%, #F5F2EC 0%, #E8E4DC 100%)',
        padding: '20px 16px',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
      }}
    >
      {children}
    </div>
  )
}
