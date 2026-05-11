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
  const [fontBold, fontRegular] = await Promise.all([
    loadFont("Plus+Jakarta+Sans", 700),
    loadFont("Plus+Jakarta+Sans", 400),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#171717",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Plus Jakarta Sans",
          position: "relative",
        }}
      >
        {/* Corner marks — editorial detail */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 24,
            height: 24,
            borderTop: "1.5px solid #404040",
            borderLeft: "1.5px solid #404040",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            width: 24,
            height: 24,
            borderTop: "1.5px solid #404040",
            borderRight: "1.5px solid #404040",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 40,
            width: 24,
            height: 24,
            borderBottom: "1.5px solid #404040",
            borderLeft: "1.5px solid #404040",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            width: 24,
            height: 24,
            borderBottom: "1.5px solid #404040",
            borderRight: "1.5px solid #404040",
            display: "flex",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "0.1em",
            lineHeight: 1,
            display: "flex",
          }}
        >
          RCAPSULE
        </div>

        {/* Divider */}
        <div
          style={{
            width: 40,
            height: 1,
            background: "#525252",
            margin: "28px 0",
            display: "flex",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 400,
            color: "#737373",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Your digital wardrobe
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 44,
            fontSize: 14,
            fontWeight: 400,
            color: "#404040",
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
        { name: "Plus Jakarta Sans", data: fontBold, weight: 700 },
        { name: "Plus Jakarta Sans", data: fontRegular, weight: 400 },
      ],
    },
  );
}
