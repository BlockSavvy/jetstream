import React from 'react';
import { cn } from '@/lib/utils';

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode;
}

export function Code({ className, children, ...props }: CodeProps) {
  return (
    <pre
      className={cn(
        "p-4 rounded-lg overflow-x-auto text-sm font-mono bg-muted text-muted-foreground",
        className
      )}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
} 