const bubbles = [
  { left: '4%', size: 20, delay: 0, duration: 13, opacity: 0.2 },
  { left: '11%', size: 14, delay: 1, duration: 11, opacity: 0.16 },
  { left: '18%', size: 26, delay: 2, duration: 16, opacity: 0.22 },
  { left: '25%', size: 16, delay: 0.5, duration: 12, opacity: 0.18 },
  { left: '31%', size: 24, delay: 3, duration: 15, opacity: 0.2 },
  { left: '38%', size: 12, delay: 1.8, duration: 10, opacity: 0.15 },
  { left: '45%', size: 22, delay: 2.5, duration: 14, opacity: 0.21 },
  { left: '52%', size: 18, delay: 0.2, duration: 12, opacity: 0.17 },
  { left: '58%', size: 28, delay: 3.5, duration: 17, opacity: 0.22 },
  { left: '64%', size: 15, delay: 1.2, duration: 11, opacity: 0.16 },
  { left: '71%', size: 19, delay: 2.3, duration: 13, opacity: 0.19 },
  { left: '77%', size: 12, delay: 0.9, duration: 9, opacity: 0.14 },
  { left: '83%', size: 26, delay: 2.9, duration: 16, opacity: 0.22 },
  { left: '89%', size: 17, delay: 1.5, duration: 12, opacity: 0.18 },
  { left: '95%', size: 21, delay: 3.1, duration: 14, opacity: 0.2 },
];

export default function WaterBubbles() {
  return (
    <div style={styles.layer} aria-hidden="true">
      <style>{`
        @keyframes bubbleRise {
          0% { transform: translateY(108vh) scale(0.92); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translateY(-18vh) scale(1.08); opacity: 0; }
        }
        @keyframes bubbleDrift {
          0%, 100% { margin-left: 0; }
          50% { margin-left: 12px; }
        }
        .water-bubble {
          position: absolute;
          bottom: -40px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          background: radial-gradient(circle at 30% 28%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.36) 30%, rgba(255,255,255,0.12) 68%, rgba(255,255,255,0.05) 100%);
          box-shadow: inset -2px -4px 8px rgba(12, 74, 110, 0.12);
          animation-name: bubbleRise, bubbleDrift;
          animation-timing-function: linear, ease-in-out;
          animation-iteration-count: infinite, infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .water-bubble { animation: none !important; display: none; }
        }
      `}</style>

      {bubbles.map((bubble, index) => (
        <span
          key={index}
          className="water-bubble"
          style={{
            left: bubble.left,
            width: bubble.size,
            height: bubble.size,
            opacity: bubble.opacity,
            animationDuration: `${bubble.duration}s, ${Math.max(6, bubble.duration - 4)}s`,
            animationDelay: `${bubble.delay}s, ${bubble.delay / 2}s`,
          }}
        />
      ))}
    </div>
  );
}

const styles = {
  layer: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    overflow: 'hidden',
  },
};
