"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProjects } from "@/hooks/project.hooks";

const isObjectId = (str: string) => /^[a-f\d]{24}$/i.test(str);

const decodeSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

/**
 * The mono eyebrow trail above every page title ("PROJECTS —— my-app —— LOGS").
 * Section names read in uppercase; resolved project names keep their own case.
 */
export function PageTrail() {
  const pathname = usePathname();
  const { data: projectsResponse } = useProjects();

  // Build a lookup map from project IDs to names
  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    const projects = projectsResponse?.data;
    if (Array.isArray(projects)) {
      for (const project of projects) {
        if (project?._id && project?.name) {
          map.set(project._id, project.name);
        }
      }
    }
    return map;
  }, [projectsResponse]);

  const crumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, i) => {
      const href = "/" + segments.slice(0, i + 1).join("/");
      const isLast = i === segments.length - 1;
      if (isObjectId(segment)) {
        const name = projectNameMap.get(segment);
        return { href, isLast, name: name ?? `${segment.slice(0, 8)}…`, isName: true };
      }
      const label = decodeSegment(segment).split("-").join(" ");
      // Dynamic segments (an error message on the error page) are long, and
      // URL-encoded they are one unbreakable word that widened the whole page
      const name = label.length > 32 ? `${label.slice(0, 31)}…` : label;
      return { href, isLast, name, isName: false };
    });
  }, [pathname, projectNameMap]);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      {crumbs.map((crumb, i) => {
        const text = (
          <span
            className={
              crumb.isName
                ? "font-mono text-xs text-text-secondary"
                : "eyebrow"
            }
          >
            {crumb.name}
          </span>
        );
        return (
          <Fragment key={crumb.href}>
            {i > 0 && <span aria-hidden className="h-px w-6 bg-border-accent" />}
            {crumb.isLast ? (
              <span aria-current="page">{text}</span>
            ) : (
              <Link href={crumb.href} className="hover:[&>span]:text-text-primary">
                {text}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
