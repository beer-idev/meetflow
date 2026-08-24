import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand-dark shadow-sm shadow-blue-700/10",
        secondary: "border border-[#d8deea] bg-white text-[#28344b] hover:bg-[#f7f9fc]",
        ghost: "text-[#5c6880] hover:bg-[#eef3fb] hover:text-[#1e4fa8]",
        danger: "bg-[#fff0eb] text-[#b84a24] hover:bg-[#ffe5dc]",
      },
      size: { sm: "h-9 px-3", md: "h-11 px-4", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean; }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
