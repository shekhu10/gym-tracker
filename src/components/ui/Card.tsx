import { cn } from "../../lib/utils";
import React from "react";

export const Card = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "card border border-gray-200 dark:border-gray-700",
      className,
    )}
    {...props}
  />
);
