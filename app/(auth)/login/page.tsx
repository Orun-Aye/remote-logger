"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "@/lib/schemas/auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { signinUser } from "@/services/auth.service";

type SignInForm = z.infer<typeof signInSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInForm) => {
    setIsLoading(true);
    try {
      const result = await signinUser(values.email, values.password);

      if (result?.requiresMfa) {
        router.push(`/mfa-verify?token=${result.mfaToken}`);
        return;
      }

      toast.success("Welcome back.");
      router.push("/dashboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Sign in failed. Please try again.";
      toast.error(message);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center lg:text-left space-y-2">
        <h1 className="text-3xl font-display font-bold tracking-tight text-text-primary">
          Welcome back
        </h1>
        <p className="text-text-secondary text-sm">
          Sign in to your Apperio account.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ada@example.com"
                    {...field}
                    disabled={isLoading}
                    className="bg-bg-base border-border-subtle"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-text-secondary">
                    Password
                  </FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-signal hover:text-signal-bright transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                    disabled={isLoading}
                    className="bg-bg-base border-border-subtle"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="signal"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      {/* OAuth divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border-subtle" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-bg-base px-2 text-text-muted">
            or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full border-border-subtle text-text-secondary hover:text-text-primary"
        disabled={isLoading}
        onClick={() => {
          const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
          if (githubClientId) {
            const redirectUri = `${window.location.origin}/callback`;
            window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user:email&state=github&redirect_uri=${encodeURIComponent(redirectUri)}`;
          } else {
            toast.error("GitHub OAuth is not configured.");
          }
        }}
      >
        <Github className="w-4 h-4 mr-2" />
        GitHub
      </Button>

      <div className="text-center space-y-3 text-sm text-text-muted">
        <div>
          New to Apperio?{" "}
          <Link
            href="/signup"
            className="text-signal hover:text-signal-bright font-medium transition-colors"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
