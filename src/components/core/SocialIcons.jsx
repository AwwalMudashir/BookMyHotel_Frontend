// Purpose: Small generic social-platform glyphs, drawn in the same monoline stroke style as
// lucide-react (which no longer ships brand/logo icons) — sized/colored via className like any
// lucide icon (`h-4 w-4`, `text-slate-400`, etc.).
const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const FacebookIcon = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M15 3h-2a5 5 0 0 0-5 5v3H6v4h2v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const InstagramIcon = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

export const LinkedinIcon = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <line x1="7" y1="10" x2="7" y2="17" />
    <circle cx="7" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    <path d="M11 17v-4a2.5 2.5 0 0 1 5 0v4" />
    <line x1="11" y1="10" x2="11" y2="17" />
  </svg>
);

export const YoutubeIcon = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="2" y="5" width="20" height="14" rx="4" />
    <polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" />
  </svg>
);
