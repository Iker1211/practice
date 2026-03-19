import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";

export interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md border-0 shadow-lg bg-background/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description && (
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
