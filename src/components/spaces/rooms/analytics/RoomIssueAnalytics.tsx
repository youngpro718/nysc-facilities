
// @ts-nocheck

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface RoomAnalyticsProps {
  roomId: string;
}

interface RoomIssueStats {
  room_id: string;
  room_name: string;
  room_number: string;
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  avg_resolution_hours: number;
  issue_types: Record<string, number>;
  last_issue_date: string;
  most_common_issue: string;
}

export function RoomIssueAnalytics({ roomId }: RoomAnalyticsProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["room-analytics", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_issue_analytics")
        .select("*")
        .eq("room_id", roomId)
        .single();

      if (error) throw error;
      return data as RoomIssueStats;
    },
  });

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  const issueTypeData = Object.entries(analytics.issue_types || {}).map(
    ([type, count]) => ({
      type,
      count,
    })
  );

  const resolvedPercentage = analytics.total_issues
    ? Math.round((analytics.resolved_issues / analytics.total_issues) * 100)
    : 0;

  const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Total Issues
          </h4>
          <p className="mt-2 text-2xl font-bold">{analytics.total_issues}</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Open Issues
          </h4>
          <p className="mt-2 text-2xl font-bold">{analytics.open_issues}</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Resolution Rate
          </h4>
          <p className="mt-2 text-2xl font-bold">{resolvedPercentage}%</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Avg. Resolution Time
          </h4>
          <p className="mt-2 text-2xl font-bold">
            {Math.round(analytics.avg_resolution_hours)}h
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Issues by Type</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={issueTypeData}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count">
                {issueTypeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Most Common Issue
          </h4>
          <p className="mt-2 text-lg font-medium">
            {analytics.most_common_issue || "N/A"}
          </p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Last Issue Reported
          </h4>
          <p className="mt-2 text-lg font-medium">
            {analytics.last_issue_date
              ? format(new Date(analytics.last_issue_date), "MMM d, yyyy")
              : "N/A"}
          </p>
        </Card>
      </div>
    </div>
  );
}
