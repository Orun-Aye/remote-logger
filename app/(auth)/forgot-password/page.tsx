"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
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
import Link from "next/link";
import { passwordResetRequest } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true);

    try {
      await passwordResetRequest(values.email);
      setIsSubmitted(true);
      toast.success("Reset link sent!");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }

    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-8">
        <div className="text-center lg:text-left space-y-2">
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <CheckCircle2 className="w-5 h-5 text-signal" />
            <span className="text-sm font-medium text-signal">Email Sent</span>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-text-primary">
            Check your email
          </h1>
          <p className="text-text-secondary text-sm">
            We&apos;ve sent password reset instructions to{" "}
            <strong className="text-text-primary">
              {form.getValues("email")}
            </strong>
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-signal/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-signal" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-2">
              Email sent successfully
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Click the link in the email to reset your password. The link
              will expire in 1 hour.
            </p>
            <p className="text-xs text-text-muted">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-text-primary underline underline-offset-4 decoration-border-accent hover:decoration-current transition-colors"
              >
                try again
              </button>
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-text-primary underline underline-offset-4 decoration-border-accent hover:decoration-current transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left space-y-2">
        <h1 className="text-3xl font-display font-bold tracking-tight text-text-primary">
          Forgot your password?
        </h1>
        <p className="text-text-secondary text-sm">
          No worries! Enter your email and we&apos;ll send you reset instructions.
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
                    placeholder="femi@example.com"
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
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Sending reset link...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send reset link
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center space-y-4">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-text-primary underline underline-offset-4 decoration-border-accent hover:decoration-current transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to sign in
        </Link>

        <div className="text-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-text-primary underline underline-offset-4 decoration-border-accent hover:decoration-current font-medium transition-colors"
          >
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  );
}
