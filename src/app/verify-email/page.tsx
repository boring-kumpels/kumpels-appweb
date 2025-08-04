import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Check Your Email
        </h1>

        <div className="text-center mb-8">
          <p className="mb-4">
            We&apos;ve sent you a verification link to your email address.
          </p>
          <p className="text-sm text-gray-600">
            Please check your inbox and click the link to verify your account.
            If you don&apos;t see the email, check your spam folder.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-sidebar rounded-md hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sidebar"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
