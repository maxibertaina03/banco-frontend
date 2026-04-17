import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="card">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">
        Crear Cuenta
      </h1>
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
            card: 'bg-transparent border-0',
            header: 'hidden',
            socialButtonsBlockButton: 'bg-white bg-opacity-10 border border-white border-opacity-20 text-white hover:bg-opacity-20',
          },
        }}
        redirectUrl="/dashboard"
      />
    </div>
  );
}
