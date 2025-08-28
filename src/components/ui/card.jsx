import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border bg-white shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = ({ className, ...props }) => (
  <div
    className={cn("p-4 border-b", className)}
    {...props}
  />
)
const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("text-lg font-semibold leading-none", className)} {...props} />
)
const CardContent = ({ className, ...props }) => (
  <div className={cn("p-4", className)} {...props} />
)

export { Card, CardHeader, CardTitle, CardContent }
