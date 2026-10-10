import './Brand.css';

/** Logo mark: a cocoon hanging from a twig with a freshly emerged butterfly. */
export function KozaMark({ size = 36 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect className="brand-mark-bg" x="1" y="1" width="38" height="38" rx="12" />
      {/* twig + leaf */}
      <path className="brand-mark-twig" d="M6 10.5c6-1.6 14-2 28-.8" />
      <path className="brand-mark-leaf" d="M26.6 9.7c1.6-3.6 4.6-5 8-4.4-.8 3.4-3.6 5.2-8 4.4Z" />
      {/* silk thread + cocoon */}
      <path className="brand-mark-thread" d="M15.5 9.8v3" />
      <path
        className="brand-mark-cocoon"
        d="M15.5 12.6c4.6 0 7 5 7 10.2 0 5.6-3 10.4-7 10.4s-7-4.8-7-10.4c0-5.2 2.4-10.2 7-10.2Z"
      />
      <g className="brand-mark-silk">
        <path d="M9.2 18.6q6.3 2.4 12.6 0" />
        <path d="M8.6 23.6q6.9 2.6 13.8 0" />
        <path d="M9.4 28.6q6.1 2.2 12.2 0" />
      </g>
      {/* butterfly */}
      <g className="brand-mark-wings">
        <path className="brand-mark-wing-a" d="M30 24.4c-2.4-4-5.6-5-6.2-2.6-.5 2.2 2.4 3.6 6.2 2.6Z" />
        <path className="brand-mark-wing-a" d="M30 24.4c2.4-4 5.6-5 6.2-2.6.5 2.2-2.4 3.6-6.2 2.6Z" />
        <path className="brand-mark-wing-b" d="M30 25c-3.2.4-4.8 2.6-3.6 4 1.2 1.2 3-.6 3.6-4Z" />
        <path className="brand-mark-wing-b" d="M30 25c3.2.4 4.8 2.6 3.6 4-1.2 1.2-3-.6-3.6-4Z" />
      </g>
      <path className="brand-mark-body" d="M30 22.6v5.4M30 22.8q-.6-1.8-1.8-2.4M30 22.8q.6-1.8 1.8-2.4" />
    </svg>
  );
}

/** Logo: cocoon mark + "koza" wordmark. */
function Brand({ compact = false }) {
  return (
    <span className={`brand${compact ? ' brand--compact' : ''}`}>
      <KozaMark size={compact ? 30 : 38} />
      <span className="brand-text">
        <span className="brand-name">koza</span>
        {!compact && <span className="brand-tag hand">planla, odaklan, yaşa</span>}
      </span>
    </span>
  );
}

export default Brand;
