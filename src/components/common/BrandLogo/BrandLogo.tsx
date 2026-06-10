import Image from "next/image";

export function BrandLogo() {
  return (
    <Image
      src="/improving-logo-light.png"
      alt="Improving"
      width={120}
      height={40}
      className="h-10 w-auto block"
    />
  );
}
