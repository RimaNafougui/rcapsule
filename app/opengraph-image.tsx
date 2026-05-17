import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=block`,
    { headers: { "User-Agent": "Mozilla/5.0" } },
  ).then((r) => r.text());

  const url = css.match(/src: url\(([^)]+)\)/)?.[1];

  if (!url) throw new Error(`Could not find font URL for ${family} ${weight}`);

  return fetch(url).then((r) => r.arrayBuffer());
}

export default async function OgImage() {
  const [displayLight, monoRegular] = await Promise.all([
    loadFont("Cormorant+Garamond", 300),
    loadFont("JetBrains+Mono", 400),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FAFAF7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Corner marks */}
        {[
          { top: 40, left: 40, borderTop: "1px solid #E5E3DC", borderLeft: "1px solid #E5E3DC" },
          { top: 40, right: 40, borderTop: "1px solid #E5E3DC", borderRight: "1px solid #E5E3DC" },
          { bottom: 40, left: 40, borderBottom: "1px solid #E5E3DC", borderLeft: "1px solid #E5E3DC" },
          { bottom: 40, right: 40, borderBottom: "1px solid #E5E3DC", borderRight: "1px solid #E5E3DC" },
        ].map((style, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 20,
              height: 20,
              display: "flex",
              ...style,
            }}
          />
        ))}

        {/* Wordmark — Cormorant Garamond display */}
        <div
          style={{
            fontFamily: "Cormorant Garamond",
            fontSize: 120,
            fontWeight: 300,
            color: "#0A0A0A",
            letterSpacing: "-0.025em",
            lineHeight: 0.92,
            display: "flex",
          }}
        >
          rcapsule
        </div>

        {/* Accent rule */}
        <div
          style={{
            width: 32,
            height: 1,
            background: "#7A2E1F",
            margin: "32px 0 28px",
            display: "flex",
          }}
        />

        {/* Eyebrow — mono caps */}
        <div
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: 12,
            fontWeight: 400,
            color: "#6B6B66",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          your digital wardrobe
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 44,
            fontFamily: "JetBrains Mono",
            fontSize: 11,
            fontWeight: 400,
            color: "#A8A8A2",
            letterSpacing: "0.12em",
            display: "flex",
          }}
        >
          rcapsule.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant Garamond", data: displayLight, weight: 300, style: "normal" },
        { name: "JetBrains Mono", data: monoRegular, weight: 400, style: "normal" },
      ],
    },
  );
}
