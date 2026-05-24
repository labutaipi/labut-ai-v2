import { SignupForm } from "@/features/auth/components/register";

export default function Page() {
  return (
    <main className="page-wrap flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
      <SignupForm className="w-full max-w-md" />
    </main>
  );
}
