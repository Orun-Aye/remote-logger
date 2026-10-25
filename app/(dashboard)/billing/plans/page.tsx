"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  usePlans,
  useSubscription,
  useChangePlan,
} from "@/hooks/billing.hooks";
import { PlanConfig, PlanId } from "@/types/billing.types";
import {
  Check,
  Loader2,
  ArrowLeft,
  Zap,
  Crown,
  Building2,
  Rocket,
  Code2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

/**
 * Format cents to a dollar display.
 */
function formatPrice(cents: number): string {
  if (cents === 0) return "$0";
  if (cents < 0) return "Custom";
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * Plan icon mapping.
 */
const planIcons: Record<string, React.ElementType> = {
  developer: Code2,
  starter: Rocket,
  professional: Zap,
  team: Crown,
  enterprise: Building2,
};

export default function PlansPage() {
  const [annual, setAnnual] = useState(false);
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const changePlan = useChangePlan();

  const isLoading = plansLoading || subLoading;
  const currentPlan = subscription?.plan || "developer";

  const handleChangePlan = (planId: string) => {
    if (planId === currentPlan && (annual ? "annual" : "monthly") === subscription?.billingCycle) {
      toast.info("You are already on this plan");
      return;
    }

    if (planId === "enterprise") {
      toast.info("Please contact sales for Enterprise pricing");
      return;
    }

    changePlan.mutate(
      {
        plan: planId as PlanId,
        billingCycle: annual ? "annual" : "monthly",
      },
      {
        onSuccess: () => {
          toast.success(`Plan changed to ${planId} successfully`);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to change plan");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Plans"
          description="Choose the right plan for your needs"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        </div>
      </div>
    );
  }

  // Plan order
  const planOrder: PlanId[] = [
    "developer",
    "starter",
    "professional",
    "team",
    "enterprise",
  ];
  const sortedPlans = planOrder
    .map((id) => plans?.find((p) => p.id === id))
    .filter(Boolean) as PlanConfig[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="Choose the right plan for your needs"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/billing">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Billing
            </Link>
          </Button>
        }
      />

      {/* Annual / Monthly Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${
            !annual ? "text-text-primary" : "text-text-muted"
          }`}
        >
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
            annual ? "bg-signal" : "bg-bg-elevated"
          }`}
          aria-label="Toggle annual pricing"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-bg-void transition-transform duration-200 ${
              annual ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${
            annual ? "text-text-primary" : "text-text-muted"
          }`}
        >
          Annual{" "}
          <Badge variant="signal" className="ml-1 text-[10px]">
            Save up to 20%
          </Badge>
        </span>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {sortedPlans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isProfessional = plan.id === "professional";
          const isEnterprise = plan.monthlyPrice === -1;
          const isFree = plan.monthlyPrice === 0;
          const price = annual ? plan.annualPrice : plan.monthlyPrice;
          const Icon = planIcons[plan.id] || Zap;

          return (
            <div
              key={plan.id}
              className={`rounded-xl border bg-bg-surface p-5 flex flex-col transition-all duration-200 hover:-translate-y-0.5 relative ${
                isCurrent
                  ? "border-gs-900"
                  : isProfessional
                  ? "border-t-2 border-t-signal border-signal/30"
                  : "border-border-subtle"
              }`}
            >
              {/* Current badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="signal" className="text-[10px] font-display font-bold uppercase tracking-wider">
                    Current Plan
                  </Badge>
                </div>
              )}

              {/* Recommended badge */}
              {isProfessional && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-sm bg-signal text-bg-void text-[10px] font-display font-bold uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-signal" />
                <h3 className="font-display font-bold text-base text-text-primary">
                  {plan.name}
                </h3>
              </div>

              {/* Price */}
              <div className="mt-3 mb-1">
                {isEnterprise ? (
                  <span className="font-display font-extrabold text-3xl text-text-primary">
                    Custom
                  </span>
                ) : isFree ? (
                  <div>
                    <span className="font-display font-extrabold text-3xl text-text-primary">
                      $0
                    </span>
                    <span className="text-sm text-text-muted ml-1">forever</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-display font-extrabold text-3xl text-text-primary">
                      {formatPrice(price)}
                    </span>
                    <span className="text-sm text-text-muted ml-1">/mo</span>
                    {annual && !isFree && (
                      <p className="text-xs text-signal mt-0.5">
                        Save {formatPrice(plan.monthlyPrice - plan.annualPrice)}
                        /mo
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Support line */}
              <p className="text-xs text-text-muted mb-3">{plan.support}</p>

              {/* Features */}
              <div className="border-t border-border-faint pt-3 mb-4 flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <Check className="w-3.5 h-3.5 text-signal shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              {isCurrent ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : isEnterprise ? (
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="mailto:sales@apperio.dev">Contact Sales</Link>
                </Button>
              ) : (
                <Button
                  variant={isProfessional ? "signal" : "outline"}
                  className="w-full"
                  onClick={() => handleChangePlan(plan.id)}
                  disabled={changePlan.isPending}
                >
                  {changePlan.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFree ? (
                    "Downgrade to Free"
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Note */}
      <div className="text-center py-4">
        <p className="text-sm text-text-muted">
          All paid plans include a 14-day free trial. No credit card required to
          start.
        </p>
      </div>
    </div>
  );
}
