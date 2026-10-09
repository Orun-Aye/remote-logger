import Link from "next/link";

// About, Privacy, Terms and Security are left out until those pages exist.
// TODO(changelog): add "Changelog" back to Resources once /changelog shows
// real entries instead of the invented seed history.
const footerSections = [
  {
    title: "Product",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/logs", label: "Log Explorer" },
      { href: "/alerts", label: "Alerts" },
      { href: "/sdk", label: "SDK" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/sdk", label: "SDK Reference" },
      { href: "/status", label: "Status Page" },
    ],
  },
  {
    title: "Company",
    links: [{ href: "mailto:femi@apperio.dev", label: "Contact" }],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-void">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 28 28"
                fill="none"
                className="text-signal"
                aria-hidden="true"
              >
                <path
                  d="M4 20L4 16L8 12L12 18L18 8L22 14L24 10"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="4" cy="20" r="2" fill="currentColor" />
                <circle cx="24" cy="10" r="2" fill="currentColor" />
              </svg>
              <span className="font-display text-lg font-semibold tracking-[-0.02em] text-text-primary">
                apperio
              </span>
            </Link>
            <p className="max-w-[240px] text-sm leading-relaxed text-text-muted">
              Errors, traced back to the change that caused them.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary transition-colors duration-150 hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border-subtle pt-6 text-xs text-text-muted">
          <p>&copy; {new Date().getFullYear()} Apperio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
