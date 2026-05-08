"use client";

import { useState } from "react";
import { faviconUrl } from "@/lib/utils/cn";
import { getAvatarColor, getInitials } from "@/lib/utils/avatar";

interface Props {
  name: string;
  website: string | null | undefined;
  size?: number;
}

/**
 * Favicon-first avatar with deterministic colour fallback.
 * If the favicon img errors (no website, blocked, 404), swap to a coloured circle
 * with company initials. Same name always produces the same colour.
 */
export function Avatar({ name, website, size = 48 }: Props) {
  const src = faviconUrl(website ?? null);
  const [errored, setErrored] = useState(false);
  const showFallback = !src || errored;
  const initials = getInitials(name);
  const bg = getAvatarColor(name);
  const fontSize = Math.max(11, Math.round(size * 0.34));

  if (showFallback) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full text-white"
        style={{
          width: size,
          height: size,
          backgroundColor: bg,
          fontSize,
          fontWeight: 700
        }}
        aria-hidden="true"
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setErrored(true)}
      className="shrink-0 rounded-full bg-surface-2 object-cover"
      style={{ width: size, height: size }}
    />
  );
}
