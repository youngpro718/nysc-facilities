import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Camera, User, Phone, Building2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { AvatarUploadModal } from './modals/AvatarUploadModal';

export function ProfileCompletionCard() {
  const { profile, refreshSession } = useAuth();
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  if (!profile) return null;

  const completionItems = [
    {
      id: 'avatar',
      label: 'Profile Picture',
      icon: Camera,
      completed: !!profile.avatar_url,
      onClick: () => setShowAvatarModal(true)
    },
    {
      id: 'name',
      label: 'Full Name',
      icon: User,
      completed: !!(profile.first_name && profile.last_name),
      onClick: () => {} // Navigate to profile edit
    },
    {
      id: 'phone',
      label: 'Phone Number',
      icon: Phone,
      completed: !!profile.phone,
      onClick: () => {} // Navigate to profile edit
    },
    {
      id: 'department',
      label: 'Department',
      icon: Building2,
      completed: !!profile.department_id,
      onClick: () => {} // Navigate to profile edit
    }
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const completionPercentage = (completedCount / completionItems.length) * 100;

  // Don't show if profile is complete
  if (completionPercentage === 100) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserAvatar
              src={profile.avatar_url}
              firstName={profile.first_name}
              lastName={profile.last_name}
              size="lg"
            />
            <div className="flex-1">
              <CardTitle className="text-lg">Complete Your Profile</CardTitle>
              <CardDescription>
                {completedCount} of {completionItems.length} items completed
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Profile Completion</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <div className="grid gap-2">
            {completionItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={item.onClick}
                      className="text-xs"
                    >
                      Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AvatarUploadModal
        open={showAvatarModal}
        onOpenChange={setShowAvatarModal}
        currentAvatarUrl={profile.avatar_url}
        onAvatarUpdate={refreshSession}
      />
    </>
  );
}