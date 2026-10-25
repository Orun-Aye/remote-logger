"use client";

import { cn } from "@/lib/utils";

interface WebVitalGaugeProps {
  label: string;
  value: number;
  unit: string;
  thresholds: {
    good: number;
    needsImprovement: number;
  };
  description?: string;
  className?: string;
}

type Rating = "good" | "needs-improvement" | "poor";

function getRating(value: number, thresholds: WebVitalGaugeProps["thresholds"]): Rating {
  if (value <= thresholds.good) return "good";
  if (value <= thresholds.needsImprovement) return "needs-improvement";
  return "poor";
}

const ratingLabels: Record<Rating, string> = {
  good: "Good",
  "needs-improvement": "Needs Improvement",
  poor: "Poor",
};

const ratingColors: Record<Rating, string> = {
  good: "var(--rating-good)",
  "needs-improvement": "var(--rating-needs-improvement)",
  poor: "var(--rating-poor)",
};

const ratingBadgeBg: Record<Rating, string> = {
  good: "bg-rating-good/15 text-rating-good",
  "needs-improvement": "bg-rating-needs-improvement/15 text-rating-needs-improvement",
  poor: "bg-rating-poor/15 text-rating-poor",
};

// Arc geometry constants
const CX = 100;
const CY = 100;
const RADIUS = 70;
const STROKE_WIDTH = 10;
const ARC_START_DEG = 150; // bottom-left (7 o'clock)
const ARC_SWEEP_DEG = 240; // total sweep

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = degToRad(angleDeg);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function formatValue(value: number, unit: string): string {
  if (unit === "s") {
    return value.toFixed(1);
  }
  if (unit === "" || unit === "score") {
    // CLS-style: show decimal precision
    return value < 1 ? value.toFixed(3) : value.toFixed(2);
  }
  // ms: show integer or one decimal
  return value < 10 ? value.toFixed(1) : Math.round(value).toString();
}

export function WebVitalGauge({
  label,
  value,
  unit,
  thresholds,
  description,
  className,
}: WebVitalGaugeProps) {
  const rating = getRating(value, thresholds);
  const color = ratingColors[rating];
  const gaugeMax = thresholds.needsImprovement * 2;

  // Clamp value to [0, gaugeMax] for positioning
  const clampedValue = Math.max(0, Math.min(value, gaugeMax));

  // Compute zone angles
  const goodFraction = thresholds.good / gaugeMax;
  const niFraction = thresholds.needsImprovement / gaugeMax;

  const goodEndAngle = ARC_START_DEG + goodFraction * ARC_SWEEP_DEG;
  const niEndAngle = ARC_START_DEG + niFraction * ARC_SWEEP_DEG;
  const arcEndAngle = ARC_START_DEG + ARC_SWEEP_DEG;

  // Needle angle
  const needleFraction = clampedValue / gaugeMax;
  const needleAngle = ARC_START_DEG + needleFraction * ARC_SWEEP_DEG;
  const needlePos = polarToCartesian(CX, CY, RADIUS, needleAngle);

  // Needle triangle pointing outward from center
  const needleOuterPos = polarToCartesian(CX, CY, RADIUS + STROKE_WIDTH / 2 + 4, needleAngle);
  const needleLeftPos = polarToCartesian(CX, CY, RADIUS - STROKE_WIDTH / 2 - 2, needleAngle - 4);
  const needleRightPos = polarToCartesian(CX, CY, RADIUS - STROKE_WIDTH / 2 - 2, needleAngle + 4);

  // Track arc (background)
  const trackPath = describeArc(CX, CY, RADIUS, ARC_START_DEG, arcEndAngle);

  // Zone arcs
  const goodPath = describeArc(CX, CY, RADIUS, ARC_START_DEG, goodEndAngle);
  const niPath = describeArc(CX, CY, RADIUS, goodEndAngle, niEndAngle);
  const poorPath = describeArc(CX, CY, RADIUS, niEndAngle, arcEndAngle);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      {/* Description */}
      {description && (
        <span className="text-xs text-text-muted font-body">{description}</span>
      )}

      {/* SVG Gauge */}
      <svg
        viewBox="0 0 200 145"
        className="w-full max-w-[200px]"
        role="img"
        aria-label={`${label}: ${formatValue(value, unit)}${unit} - ${ratingLabels[rating]}`}
      >
        {/* Background track */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={STROKE_WIDTH + 2}
          strokeLinecap="round"
        />

        {/* Green zone: 0 to good */}
        <path
          d={goodPath}
          fill="none"
          stroke="var(--rating-good)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="butt"
          opacity={0.85}
        />

        {/* Yellow zone: good to needsImprovement */}
        <path
          d={niPath}
          fill="none"
          stroke="var(--rating-needs-improvement)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="butt"
          opacity={0.85}
        />

        {/* Red zone: needsImprovement to max */}
        <path
          d={poorPath}
          fill="none"
          stroke="var(--rating-poor)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="butt"
          opacity={0.85}
        />

        {/* Round caps on the very start and end */}
        <circle
          cx={polarToCartesian(CX, CY, RADIUS, ARC_START_DEG).x}
          cy={polarToCartesian(CX, CY, RADIUS, ARC_START_DEG).y}
          r={STROKE_WIDTH / 2}
          fill="var(--rating-good)"
          opacity={0.85}
        />
        <circle
          cx={polarToCartesian(CX, CY, RADIUS, arcEndAngle).x}
          cy={polarToCartesian(CX, CY, RADIUS, arcEndAngle).y}
          r={STROKE_WIDTH / 2}
          fill="var(--rating-poor)"
          opacity={0.85}
        />

        {/* Needle indicator triangle */}
        <polygon
          points={`${needleOuterPos.x},${needleOuterPos.y} ${needleLeftPos.x},${needleLeftPos.y} ${needleRightPos.x},${needleRightPos.y}`}
          fill={color}
        />

        {/* Needle dot at tip */}
        <circle
          cx={needlePos.x}
          cy={needlePos.y}
          r={3}
          fill={color}
          stroke="var(--bg-void)"
          strokeWidth={1.5}
        />

        {/* Center value */}
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="28"
          fontWeight="700"
          fontFamily="var(--font-display), Syne, sans-serif"
        >
          {formatValue(value, unit)}
        </text>

        {/* Unit below value */}
        <text
          x={CX}
          y={CY + 18}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-muted)"
          fontSize="11"
          fontFamily="var(--font-body), Inter, sans-serif"
        >
          {unit || label}
        </text>

        {/* Bottom labels */}
        {/* "Good" on the left */}
        <text
          x={polarToCartesian(CX, CY, RADIUS + 20, ARC_START_DEG).x + 4}
          y={polarToCartesian(CX, CY, RADIUS + 20, ARC_START_DEG).y - 2}
          textAnchor="start"
          fill="var(--rating-good)"
          fontSize="8"
          fontWeight="600"
          fontFamily="var(--font-body), Inter, sans-serif"
        >
          Good
        </text>
        <text
          x={polarToCartesian(CX, CY, RADIUS + 20, ARC_START_DEG).x + 4}
          y={polarToCartesian(CX, CY, RADIUS + 20, ARC_START_DEG).y + 8}
          textAnchor="start"
          fill="var(--text-muted)"
          fontSize="7"
          fontFamily="var(--font-body), Inter, sans-serif"
        >
          {`< ${thresholds.good}${unit}`}
        </text>

        {/* "Poor" on the right */}
        <text
          x={polarToCartesian(CX, CY, RADIUS + 20, arcEndAngle).x - 4}
          y={polarToCartesian(CX, CY, RADIUS + 20, arcEndAngle).y - 2}
          textAnchor="end"
          fill="var(--rating-poor)"
          fontSize="8"
          fontWeight="600"
          fontFamily="var(--font-body), Inter, sans-serif"
        >
          Poor
        </text>
        <text
          x={polarToCartesian(CX, CY, RADIUS + 20, arcEndAngle).x - 4}
          y={polarToCartesian(CX, CY, RADIUS + 20, arcEndAngle).y + 8}
          textAnchor="end"
          fill="var(--text-muted)"
          fontSize="7"
          fontFamily="var(--font-body), Inter, sans-serif"
        >
          {`> ${thresholds.needsImprovement}${unit}`}
        </text>
      </svg>

      {/* Label */}
      <span className="font-display text-sm font-bold text-text-primary -mt-1">
        {label}
      </span>

      {/* Rating badge */}
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-body",
          ratingBadgeBg[rating]
        )}
      >
        {ratingLabels[rating]}
      </span>
    </div>
  );
}
