
import React from "react";
import {
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function TermsHeader() {
  return (
    <CardHeader>
      <CardTitle>Term Schedules</CardTitle>
      <CardDescription>
        View and manage uploaded court term schedules
      </CardDescription>
    </CardHeader>
  );
}
