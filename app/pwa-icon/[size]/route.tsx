import { ImageResponse } from "next/og";

const SIZES: Record<string, number> = { "180": 180, "192": 192, "512": 512 };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const px = SIZES[size] ?? 192;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0283f3",
        }}
      >
        <svg width={px * 0.46} height={px * 0.46} viewBox="0 0 24 24" fill="#ffffff">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    ),
    { width: px, height: px }
  );

  image.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return image;
}