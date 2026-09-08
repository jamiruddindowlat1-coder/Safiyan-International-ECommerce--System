import { SIES_BRANDING } from "../config/branding";

// Reusable logo component. Use this everywhere instead of hardcoding
// an <img> tag, so the logo and name always come from one place.
//
// Usage:
//   <Logo />                          -> icon + full name
//   <Logo variant="short" />          -> icon + "SIES"
//   <Logo variant="icon" size={40} /> -> icon only (e.g. favicon-style spot)

export default function Logo({ variant = "full", size = 48 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img
        src={SIES_BRANDING.logo}
        alt={SIES_BRANDING.shortName}
        style={{ height: size, width: "auto" }}
      />
      {variant === "full" && (
        <span style={{ fontWeight: 700, fontSize: size * 0.4, color: SIES_BRANDING.colors.primary }}>
          {SIES_BRANDING.name}
        </span>
      )}
      {variant === "short" && (
        <span style={{ fontWeight: 700, fontSize: size * 0.5, color: SIES_BRANDING.colors.primary }}>
          {SIES_BRANDING.shortName}
        </span>
      )}
    </div>
  );
}
