import { LoginForm } from "@/features/auth/components/login-form";

export default function Page() {
  return (
    <main className="page-wrap flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
      <LoginForm className="w-full max-w-md" />
    </main>
  );
}
