export const siteNavigation = [
  { label: "HOME", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "FEATURE", href: "/#feature" },
  { label: "PROGRAM", href: "/program" },
  { label: "NEWS", href: "/#news" },
  { label: "CONTACT", href: "/#contact" },
] as const;

export const primaryNavigation = siteNavigation.filter(
  ({ label }) => label !== "HOME",
);
