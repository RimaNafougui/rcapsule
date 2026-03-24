import { tv } from "tailwind-variants";

export const display = tv({
  base: "font-display font-light tracking-[0.1em] leading-[0.9]",
  variants: {
    size: {
      sm: "text-[clamp(2rem,5vw,3.5rem)]",
      md: "text-[clamp(2.5rem,6vw,5rem)]",
      lg: "text-[clamp(3rem,8vw,7rem)]",
    },
    fullWidth: {
      true: "w-full block",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

export const title = tv({
  base: "font-display font-light tracking-[0.1em] leading-tight",
  variants: {
    size: {
      sm: "text-[clamp(1.125rem,2vw,1.5rem)]",
      md: "text-[clamp(1.5rem,3vw,2.5rem)]",
      lg: "text-[clamp(2rem,5vw,3.5rem)]",
    },
    fullWidth: {
      true: "w-full block",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const heading = tv({
  base: "font-display font-light tracking-[0.2em]",
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const subtitle = tv({
  base: "text-default-500 leading-relaxed",
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base lg:text-lg",
    },
    fullWidth: {
      true: "w-full",
    },
  },
  defaultVariants: {
    size: "md",
    fullWidth: true,
  },
});

export const label = tv({
  base: "text-[clamp(0.625rem,0.8vw,0.75rem)] font-display font-light tracking-[0.2em] text-default-500",
});

export const caption = tv({
  base: "text-[clamp(0.625rem,0.8vw,0.75rem)] uppercase tracking-widest text-default-400",
});
