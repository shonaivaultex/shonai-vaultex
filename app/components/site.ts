export const siteNavigation = [
  { label: "HOME", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "FEATURE", href: "/#weapons" },
  { label: "PROGRAM", href: "/program" },
  { label: "NEWS", href: "/#news" },
  { label: "MY PAGE", href: "/mypage" },
  { label: "SCHEDULE", href: "/mypage/schedules" },
  {label: "COACH", href: "/coach",},//
] as const;

export const primaryNavigation = siteNavigation.filter(
  ({ label }) => label !== "HOME",
);

export const lineOfficialUrl = "https://line.me/R/ti/p/@082fhyco";
