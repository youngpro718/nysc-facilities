import { useState } from 'react';
import { Search, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useHelpContent, useSearchHelpContent, trackHelpView } from '../hooks/useHelpContent';
import { useRolePermissions } from '@/features/auth/hooks/useRolePermissions';
import { cn } from '@/lib/utils';

interface HelpContentViewerProps {
  category?: 'feature' | 'role' | 'workflow' | 'troubleshooting';
  showSearch?: boolean;
}

export function HelpContentViewer({ category, showSearch = true }: HelpContentViewerProps) {
  const { userRole } = useRolePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedContent, setExpandedContent] = useState<string | null>(null);

  const { data: helpContent, isLoading } = useHelpContent(
    category,
    userRole || undefined
  );

  const { data: searchResults } = useSearchHelpContent(searchQuery);

  const displayContent = searchQuery.trim() ? searchResults : helpContent;

  const handleContentClick = (contentKey: string) => {
    setExpandedContent(expandedContent === contentKey ? null : contentKey);
    if (expandedContent !== contentKey) {
      trackHelpView(contentKey);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {!displayContent || displayContent.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No help articles match your search.' : 'No help articles available.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayContent.map((content) => {
            const isExpanded = expandedContent === content.content_key;
            return (
              <Card
                key={content.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  isExpanded && 'border-primary/50'
                )}
                onClick={() => handleContentClick(content.content_key)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{content.title}</CardTitle>
                    <div className="flex gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {content.category}
                      </Badge>
                      {content.role_specific && (
                        <Badge variant="secondary" className="text-xs">
                          {content.role_specific}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {content.content}
                      </p>
                    </div>
                    {content.view_count > 0 && (
                      <p className="text-xs text-muted-foreground mt-4">
                        Viewed {content.view_count} times
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
