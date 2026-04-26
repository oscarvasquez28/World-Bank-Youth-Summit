import * as React from 'react'

type Props = {
  initials?: string | null;
  src?: string | null;
  size?: number;
};

export default function Avatar({ initials, src, size = 8 }: Props) {
  const sz = `${size}rem`;

  if (src) {
    return (
      // image avatar
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="avatar" style={{ width: size * 8, height: size * 8 }} className="inline-flex rounded-full object-cover" />
    );
  }

  if (initials && initials.trim().length > 0) {
    return (
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-800">
        {initials}
      </div>
    );
  }

  // generic person icon
  return (
    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-800">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#0f172a" opacity="0.9" />
        <path d="M4 20c0-3.313 4.03-6 8-6s8 2.687 8 6v1H4v-1z" fill="#0f172a" opacity="0.6" />
      </svg>
    </div>
  );
}
