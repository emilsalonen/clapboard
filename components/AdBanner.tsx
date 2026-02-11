"use client";

interface AdBannerProps {
  slot?: string;
  className?: string;
}

export default function AdBanner({ slot, className = "" }: AdBannerProps) {
  if (!slot) {
    return (
      <div
        className={`w-full p-4 border border-dashed border-[#d8cdb8] rounded text-center text-[#7a6a55]/50 text-xs ${className}`}
      >
        Ad space - AdSense pending approval
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
