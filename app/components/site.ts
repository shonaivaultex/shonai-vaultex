export const siteNavigation = [
  { label: "HOME", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "FEATURE", href: "/#weapons" },
  { label: "PROGRAM", href: "/program" },
  { label: "NEWS", href: "/#news" },
  { label: "CONTACT", href: "/#contact" },
  {label: "COACH", href: "/coach",},//
] as const;

export const primaryNavigation = siteNavigation.filter(
  ({ label }) => label !== "HOME",
);

export const lineOfficialUrl = "https://line.me/R/ti/p/@082fhyco";
