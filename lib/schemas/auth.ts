// @/lib/schemas/auth.ts
import { z } from "zod";

export const signUpSchema = z
  .object({
    inviteCode: z
      .string({
        required_error: "An invite code is required for early access.",
      })
      .min(1, "An invite code is required for early access."),
    firstName: z
      .string({
        required_error: "Everything has a name.",
      })
      .min(2, "First name must be at least 2 characters.")
      .max(25, "First name must be at most 25 characters."),
    lastName: z
      .string({
        required_error: "Please enter your surname.",
      })
      .min(2, "Last name must be at least 2 characters.")
      .max(25, "Last name must be at most 25 characters."),
    email: z
      .string({
        required_error: "Please input your email.",
      })
      .email("Please enter a valid email address."),
    company: z.string().optional(),

    password: z
      .string({
        required_error: "Please enter a password.",
      })
      .min(8, "Password must be at least 8 characters long.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character."
      ),

    confirmPassword: z.string({
      required_error: "Please confirm your password.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // This path ensures the error message appears under the confirmPassword field
  });

/**
 * Sign-in only checks that something was entered. Complexity rules belong on
 * signup and reset, where a password is being *chosen* — enforcing them here
 * locks out every account whose password predates the current policy, and does
 * it silently, because the form simply refuses to submit. The server is the
 * authority on whether a credential is correct.
 */
export const signInSchema = z.object({
  email: z
    .string({
      required_error: "Please input your email.",
    })
    .email("Please enter a valid email address."),
  password: z
    .string({
      required_error: "Please enter a password.",
    })
    .min(1, "Please enter a password."),
});

export const forgotPasswordSchema = z.object({
    email: z
    .string({
      required_error: "Please input your email.",
    })
    .email("Please enter a valid email address."),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string({
        required_error: "Please enter a new password.",
      })
      .min(8, "Password must be at least 8 characters long.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character."
      ),
    confirmPassword: z.string({
      required_error: "Please confirm your password.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignUpType = z.infer<typeof signUpSchema>;
export type SignInType = z.infer<typeof signInSchema>;
export type ForgotPasswordType = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
