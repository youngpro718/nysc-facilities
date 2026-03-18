/**
 * UserStatsCards - Statistics cards for user management
 */

import { Card, CardContent } from "@/components/ui/card";
import { Shield, Clock, CheckCircle, Ban } from "lucide-react";

interface UserStatsCardsProps {
  totalUsers: number;
  pendingCount: number;
  verifiedCount: number;
  suspendedCount: number;
  adminCount: number;
  activeFilter: 'all' | 'pending' | 'verified' | 'suspended' | 'admins';
  onFilterChange: (filter: 'all' | 'pending' | 'verified' | 'suspended' | 'admins') => void;
}

export function UserStatsCards({
  totalUsers,
  pendingCount,
  verifiedCount,
  suspendedCount,
  adminCount,
  activeFilter,
  onFilterChange,
}: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          activeFilter === 'all' 
            ? 'ring-2 ring-primary bg-primary/5' 
            : 'hover:bg-accent'
        }`}
        onClick={() => onFilterChange('all')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-2xl font-bold">{totalUsers}</span>
          </div>
          <p className="text-sm font-medium">All Users</p>
          <p className="text-xs text-muted-foreground mt-1">Click to view</p>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-colors ${activeFilter === 'pending' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
        onClick={() => onFilterChange('pending')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-2xl font-bold">{pendingCount}</span>
          </div>
          <p className="text-sm font-medium">Pending</p>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-colors ${activeFilter === 'verified' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
        onClick={() => onFilterChange('verified')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-bold">{verifiedCount}</span>
          </div>
          <p className="text-sm font-medium">Verified</p>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-colors ${activeFilter === 'suspended' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
        onClick={() => onFilterChange('suspended')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-2xl font-bold">{suspendedCount}</span>
          </div>
          <p className="text-sm font-medium">Suspended</p>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-colors ${activeFilter === 'admins' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
        onClick={() => onFilterChange('admins')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-2xl font-bold">{adminCount}</span>
          </div>
          <p className="text-sm font-medium">Admins</p>
        </CardContent>
      </Card>
    </div>
  );
}
