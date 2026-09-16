export interface NavItem {
  label: string;
  href: string;
}

export interface FeaturePillar {
  figNumber: string;
  title: string;
  description: string;
}

export interface FeatureSection {
  sectionNumber: string;
  sectionLabel: string;
  heading: string;
  description: string;
  linkLabel: string;
  linkHref: string;
  subItems: SubFeatureItem[];
  mockupImage: string;
  mockupAlt: string;
}

export interface SubFeatureItem {
  number: string;
  label: string;
  href: string;
}

export interface ChangelogEntry {
  title: string;
  description: string;
  date: string;
  href: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  company: string;
  logoSrc?: string;
  variant: "primary" | "secondary";
}

export interface FooterColumn {
  heading: string;
  links: NavItem[];
}

export interface CustomerLogo {
  name: string;
  src: string;
  alt: string;
}
