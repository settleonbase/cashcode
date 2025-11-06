

export default function CashcodeLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="240"
      height="240"
      role="img"
      aria-label="Cashcode animated logo"
      style={{ color: "#0052FF" }} // 所有 currentColor 都变蓝
    >
      <style>{`
        @keyframes draw {
          0% { stroke-dashoffset: 120; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 120; }
        }

        /* cubic-bezier(0.45, 0, 0.55, 1) 是一个平滑的缓入缓出曲线 */
        /* cubic-bezier(0.85, 0, 0.15, 1) 则更有“急促中段”的效果 */
        .a {
          stroke-dasharray: 120;
          stroke-dashoffset: 120;
          animation: draw 3.5s cubic-bezier(0.85, 0, 0.15, 1) infinite;
        }
        .b {
          stroke-dasharray: 120;
          stroke-dashoffset: 120;
          animation: draw 3.5s cubic-bezier(0.85, 0, 0.15, 1) 0.3s infinite;
        }
        .c {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: draw 3.5s cubic-bezier(0.85, 0, 0.15, 1) 0.6s infinite;
        }
      `}</style>

      <rect
        x="1"
        y="1"
        width="22"
        height="22"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="a"
      />
      <path
        d="M14.5 7.5a4.5 4.5 0 1 0 0 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="b"
      />
      <path
        d="M9.5 16.5a4.5 4.5 0 1 0 0-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="b"
      />
      <path
        d="M7 12h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="c"
      />
    </svg>
  );
}
