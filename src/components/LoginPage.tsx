import { SignIn } from "@clerk/clerk-react";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C0B2E] to-[#2D1548] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Banco Orbital</h1>
          <p className="text-purple-200">Tu banca digital</p>
        </div>
        <div className="bg-[#1C0B2E]/50 rounded-2xl border border-primary/20 p-8 backdrop-blur-sm">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: "bg-gradient-to-r from-[#A855F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9]",
                card: "bg-transparent border-0 shadow-none",
                headerTitle: "text-white",
                headerSubtitle: "text-purple-200",
                socialButtonsBlockButton: "border-primary/20 text-white hover:bg-[#2D1548]",
                formFieldInput: "bg-[#2D1548]/50 border-primary/20 text-white",
                formFieldLabel: "text-purple-100",
                footerActionLink: "text-purple-400 hover:text-purple-300",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
