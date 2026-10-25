"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/schemas/auth";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { changePassword } from "@/services/auth.service";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Auto-redirect after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => router.push("/login"), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      await changePassword(token, values.password);
      setIsSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: any) {
      const message = err?.message || "Failed to reset password. The link may be invalid or expired.";
      setError(message);
      toast.error(message);
    }

    setIsLoading(false);
  };

  const getPasswordStrength = (pw: string) => {
    let strength = 0;
    if (pw.length >= 8) strength += 30;
    if (/[A-Z]/.test(pw)) strength += 17.5;
    if (/[a-z]/.test(pw)) strength += 17.5;
    if (/[0-9]/.test(pw)) strength += 17.5;
    if (/[^A-Za-z0-9]/.test(pw)) strength += 17.5;
    return Math.min(strength, 100);
  };

  const passwordStrength = getPasswordStrength(password);

  const getStrengthLabel = (strength: number) => {
    if (strength < 25) return "Very Weak";
    if (strength < 50) return "Weak";
    if (strength < 75) return "Good";
    if (strength < 100) return "Strong";
    return "Very Strong";
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 25) return "var(--status-danger)";
    if (strength < 50) return "var(--status-warn)";
    if (strength < 75) return "var(--status-warn)";
    return "var(--signal)";
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="space-y-8">
        <div className="text-center lg:text-left space-y-2">
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <CheckCircle2 className="w-5 h-5 text-signal" />
            <span className="text-sm font-medium text-signal">Success</span>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-text-primary">
            Password Reset!
          </h1>
          <p className="text-text-secondary text-sm">
            Your password has been updated successfully.
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-signal/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-signal" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-2">
              You&apos;re all set
            </h3>
            <p className="text-sm text-text-secondary">
              Redirecting you to the login page in a moment...
            </p>
          </div>
          <Button
            variant="signal"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left space-y-2">
        <h1 className="text-3xl font-display font-bold tracking-tight text-text-primary">
          Set new password
        </h1>
        <p className="text-text-secondary text-sm">
          Choose a strong password for your Apperio account.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-status-danger/10 border border-status-danger/30 text-sm text-status-danger">
          {error}
          <div className="mt-2">
            <Link
              href="/forgot-password"
              className="text-text-primary underline underline-offset-4 decoration-border-accent hover:decoration-current underline text-xs"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* New Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary">
                  New Password
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Create a strong password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setPassword(e.target.value);
                      }}
                      type={showPassword ? "text" : "password"}
                      disabled={isLoading}
                      className="bg-bg-base border-border-subtle"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="hover:bg-transparent"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-text-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-text-muted" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Strength */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  Password Strength
                </span>
                <span className="text-xs font-medium text-text-secondary">
                  {getStrengthLabel(passwordStrength)}
                </span>
              </div>
              <Progress
                style={{ backgroundColor: getStrengthColor(passwordStrength) }}
                value={passwordStrength}
              />
            </div>
          )}

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Confirm your password"
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      disabled={isLoading}
                      className="bg-bg-base border-border-subtle"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-text-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-text-muted" />
                      )}
                    </Button>
                  </div>
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
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Resetting password...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 mr-2" />
                Reset Password
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-text-primary underline underline-offset-4 decoration-border-accent hover:decoration-current"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
