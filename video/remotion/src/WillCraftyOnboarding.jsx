import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const scenes = [
  {
    eyebrow: "Step 1",
    title: "Answer simple questions",
    copy: "A calm guided flow collects your identity, jurisdiction, executor, and first wishes without legal fog.",
    metric: "04 min",
    accent: "#0ABAB5",
  },
  {
    eyebrow: "Step 2",
    title: "Name people who matter",
    copy: "Add beneficiaries, guardians, and trusted contacts so your loved ones know exactly what you intended.",
    metric: "100%",
    accent: "#12A878",
  },
  {
    eyebrow: "Step 3",
    title: "Preview a clear will draft",
    copy: "Your answers assemble into a readable will draft with signing reminders and witness guidance.",
    metric: "Ready",
    accent: "#FF7A59",
  },
  {
    eyebrow: "Step 4",
    title: "Download privately",
    copy: "Export PDF, Word, or text. No account required and no will data stored on WillCrafty servers.",
    metric: "0 data",
    accent: "#102126",
  },
];

export const WillCraftyOnboarding = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sceneFrames = fps * 4;
  const sceneIndex = Math.min(scenes.length - 1, Math.floor(frame / sceneFrames));
  const scene = scenes[sceneIndex];
  const localFrame = frame - sceneIndex * sceneFrames;
  const enter = spring({ frame: localFrame, fps, config: { damping: 17, stiffness: 92 } });
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  const slowFloat = Math.sin(frame / 18) * 12;

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 88% 12%, rgba(10,186,181,0.3), transparent 520px), linear-gradient(135deg, #ffffff 0%, #eefbf9 56%, #d9fbf8 100%)",
        color: "#102126",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile("willcrafty-onboarding-storyboard.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.08,
          filter: "saturate(0.8)",
        }}
      />

      <Brand />

      <div style={{ position: "absolute", left: 90, top: 248, width: 760 }}>
        <p
          style={{
            margin: "0 0 24px",
            color: "#078f8b",
            fontSize: 23,
            fontWeight: 950,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: enter,
            transform: `translateY(${interpolate(enter, [0, 1], [44, 0])}px)`,
          }}
        >
          {scene.eyebrow}
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: 118,
            lineHeight: 0.92,
            letterSpacing: "-0.055em",
            opacity: enter,
            transform: `translateY(${interpolate(enter, [0, 1], [56, 0])}px)`,
          }}
        >
          {scene.title}
        </h1>
        <p
          style={{
            marginTop: 32,
            color: "#5e7074",
            fontSize: 31,
            lineHeight: 1.45,
            opacity: enter,
            transform: `translateY(${interpolate(enter, [0, 1], [44, 0])}px)`,
          }}
        >
          {scene.copy}
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 72,
            marginTop: 42,
            padding: "0 28px",
            borderRadius: 999,
            background: "#102126",
            color: "white",
            fontSize: 34,
            fontWeight: 950,
          }}
        >
          {scene.metric}
        </div>
      </div>

      <div style={{ position: "absolute", right: 74, top: 118, width: 930, height: 820 }}>
        <div
          style={{
            position: "absolute",
            inset: "40px 0 80px 80px",
            border: "2px solid rgba(10,186,181,0.2)",
            borderRadius: 999,
            transform: `rotate(${frame * 0.08}deg)`,
          }}
        />
        <Device scene={scene} enter={enter} slowFloat={slowFloat} />
        <Document sceneIndex={sceneIndex} enter={enter} />
        <People visible={sceneIndex === 1} />
        <Exports visible={sceneIndex === 3} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 90,
          bottom: 94,
          width: 620,
          height: 14,
          overflow: "hidden",
          borderRadius: 999,
          background: "rgba(16,33,38,0.12)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "inherit",
            background: "#0ABAB5",
            transform: `scaleX(${progress})`,
            transformOrigin: "left",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Brand = () => (
  <div style={{ position: "absolute", top: 70, left: 80, display: "flex", alignItems: "center", gap: 22 }}>
    <div
      style={{
        display: "grid",
        width: 72,
        height: 72,
        placeItems: "center",
        borderRadius: 18,
        background: "#0ABAB5",
        color: "white",
        boxShadow: "0 28px 70px rgba(10,186,181,0.28)",
      }}
    >
      <svg width="46" height="46" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="5" width="28" height="38" rx="8" />
        <path d="M18 26.5 23 31.5 34 18.5" />
        <path d="M29 5v10h10" />
      </svg>
    </div>
    <div style={{ fontSize: 34, fontWeight: 900 }}>WillCrafty</div>
  </div>
);

const Device = ({ scene, enter, slowFloat }) => (
  <div
    style={{
      position: "absolute",
      left: 38,
      bottom: 80 + slowFloat,
      width: 500,
      height: 610,
      padding: 44,
      border: "1px solid rgba(16,33,38,0.08)",
      borderRadius: 22,
      background: "rgba(255,255,255,0.88)",
      boxShadow: "0 40px 100px rgba(14,48,52,0.16)",
      transform: `rotate(${interpolate(enter, [0, 1], [-5, -1.5])}deg)`,
      opacity: enter,
    }}
  >
    <div style={{ width: 112, height: 112, borderRadius: 28, background: scene.accent }} />
    <Line dark width="84%" />
    <Line width="72%" />
    <Line width="56%" />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 40 }}>
      {[0, 1, 2].map((item) => (
        <div key={item} style={{ height: 110, borderRadius: 18, background: "#f1fbfa" }} />
      ))}
    </div>
  </div>
);

const Document = ({ sceneIndex, enter }) => (
  <div
    style={{
      position: "absolute",
      right: 0,
      top: 118,
      width: 420,
      height: 560,
      padding: 48,
      border: "1px solid rgba(16,33,38,0.08)",
      borderRadius: 22,
      background: "rgba(255,255,255,0.9)",
      boxShadow: "0 40px 100px rgba(14,48,52,0.16)",
      transform: `translateX(${interpolate(enter, [0, 1], [90, 0])}px) rotate(${sceneIndex === 2 ? 0 : 3}deg)`,
      opacity: enter,
    }}
  >
    <div style={{ width: "72%", height: 34, borderRadius: 999, background: "#0ABAB5", marginBottom: 42 }} />
    <Line width="94%" />
    <Line width="86%" />
    <Line width="62%" />
  </div>
);

const People = ({ visible }) => (
  <>
    {["60%", "30%", "10%"].map((text, index) => (
      <FloatCard key={text} text={text} visible={visible} x={[390, 304, 430][index]} y={[40, 212, 382][index]} />
    ))}
  </>
);

const Exports = ({ visible }) => (
  <>
    {["PDF", "DOC", "TXT"].map((text, index) => (
      <FloatCard key={text} text={text} visible={visible} x={[644, 430, 222][index]} y={[650, 680, 638][index]} />
    ))}
  </>
);

const FloatCard = ({ text, visible, x, y }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      display: "grid",
      placeItems: "center",
      width: 190,
      height: 130,
      border: "1px solid rgba(16,33,38,0.08)",
      borderRadius: 22,
      background: "rgba(255,255,255,0.92)",
      boxShadow: "0 30px 80px rgba(14,48,52,0.14)",
      color: "#102126",
      fontSize: 32,
      fontWeight: 950,
      opacity: visible ? 1 : 0,
      transform: `scale(${visible ? 1 : 0.72})`,
    }}
  >
    {text}
  </div>
);

const Line = ({ width, dark = false }) => (
  <div
    style={{
      width,
      height: dark ? 34 : 18,
      marginTop: 24,
      borderRadius: 999,
      background: dark ? "#102126" : "#d2e0df",
    }}
  />
);
