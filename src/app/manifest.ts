import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prode",
    short_name: "Prode",
    description:
      "Join the Improving Prode (lottery) and put your prediction skills to the test. Pick your winners, compete with your coworkers, and see who comes out on top for the FIFA World Cup 2026.",
    start_url: "/",
    display: "standalone",
    background_color: "#005596",
    theme_color: "#005596",
    icons: [
      {
        src: "/192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
