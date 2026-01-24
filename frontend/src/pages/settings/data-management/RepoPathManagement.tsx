import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw, AlertCircle, CheckCircle, FolderOpen } from 'lucide-react';

interface RepoValidationInfo {
  repo_id: string;
  repo_name: string;
  path: string;
  valid: boolean;
  error: string | null;
}

export function RepoPathManagement() {
  const { t } = useTranslation();
  const [repos, setRepos] = useState<RepoValidationInfo[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleScan = async () => {
    setScanning(true);
    setProgress(0);

    try {
      const response = await fetch('/api/repos/validate-all', {
        method: 'POST',
      });
      const data = await response.json();

      setRepos(data.data.results);
      setProgress(100);
    } catch (error) {
      toast.error('Failed to scan repositories');
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const handleFixPath = async (repo: RepoValidationInfo) => {
    // For now, just show an alert. In a real implementation, this would open a file picker
    const newPath = prompt(
      `Enter the new path for repository "${repo.repo_name}":`,
      repo.path
    );

    if (!newPath) return;

    try {
      const response = await fetch(`/api/repos/${repo.repo_id}/fix-path`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_path: newPath }),
      });

      const data = await response.json();

      if (data.data.success) {
        toast.success('Repository path updated successfully');
        await handleScan();
      } else {
        toast.error(data.data.message || 'Failed to update path');
      }
    } catch (error) {
      toast.error('Failed to fix repository path');
      console.error(error);
    }
  };

  const handleBatchFix = () => {
    const invalidRepos = repos.filter((r) => !r.valid);
    if (invalidRepos.length === 0) {
      toast.info('No invalid repositories found');
      return;
    }

    toast.info(`Found ${invalidRepos.length} invalid repositories. Please fix them individually.`);
  };

  const invalidCount = repos.filter((r) => !r.valid).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repository Path Validation</CardTitle>
        <CardDescription>
          Check and fix invalid repository paths for cross-device usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scan Progress */}
        {scanning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Scanning repositories...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleScan} disabled={scanning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            Scan Repositories
          </Button>
          {invalidCount > 0 && (
            <Button variant="outline" onClick={handleBatchFix}>
              Fix All ({invalidCount})
            </Button>
          )}
        </div>

        {/* Repository List */}
        {repos.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Found {repos.length} repositories ({invalidCount} invalid)
            </div>
            <div className="space-y-2">
              {repos.map((repo) => (
                <div
                  key={repo.repo_id}
                  className={`p-4 border rounded-lg ${
                    repo.valid ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {repo.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        <span className="font-medium">{repo.repo_name}</span>
                        <Badge variant={repo.valid ? 'default' : 'destructive'}>
                          {repo.valid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 font-mono">
                        {repo.path}
                      </div>
                      {repo.error && (
                        <div className="text-sm text-red-500 mt-1">
                          {repo.error}
                        </div>
                      )}
                    </div>
                    {!repo.valid && (
                      <Button variant="outline" size="sm" onClick={() => handleFixPath(repo)}>
                        Fix Path
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {repos.length === 0 && !scanning && (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Scan Repositories" to check repository paths</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
