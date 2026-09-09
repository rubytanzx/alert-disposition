import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLElement>;

export function H1({ children, className, ...props }: Props) {
  return (
    <h1 className={cn("text-4xl font-semibold tracking-tight", className)} {...props}>
      {children}
    </h1>
  );
}

export function H2({ children, className, ...props }: Props) {
  return (
    <h2 className={cn("text-3xl font-semibold tracking-tight", className)} {...props}>
      {children}
    </h2>
  );
}

export function H3({ children, className, ...props }: Props) {
  return (
    <h3 className={cn("text-2xl font-semibold tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

export function H4({ children, className, ...props }: Props) {
  return (
    <h4 className={cn("text-xl font-semibold tracking-tight", className)} {...props}>
      {children}
    </h4>
  );
}

export function Body({ children, className, ...props }: Props) {
  return (
    <p className={cn("text-base leading-7 text-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function Small({ children, className, ...props }: Props) {
  return (
    <p className={cn("text-sm leading-6 text-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function Muted({ children, className, ...props }: Props) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function Label({ children, className, ...props }: Props) {
  return (
    <span className={cn("text-xs font-medium text-muted-foreground uppercase tracking-wide", className)} {...props}>
      {children}
    </span>
  );
}

export function Code({ children, className, ...props }: Props) {
  return (
    <code
      className={cn(
        "font-mono text-sm bg-muted px-1.5 py-0.5 rounded text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}
