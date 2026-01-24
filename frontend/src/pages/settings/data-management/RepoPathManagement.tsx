import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw, AlertCircle, CheckCircle, FolderOpen } from 'lucide-react';
import { useFilePicker } from '@/hooks';
import { normalizePath } from '@/lib/pathUtils';

interface RepoValidationInfo {
  repo_id: string;
  repo_name: string;
  path: string;
  valid: boolean;
  error: string | null;
}

export function RepoPathManagement() {
  const { t } = useTranslation();
  const { pickFolder } = useFilePicker();
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
      toast.error(
        t('settings.general.dataManagement.toasts.failedToScanRepos')
      );
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const handleFixPath = async (repo: RepoValidationInfo) => {
    // Use file picker to select new repository path
    const newPath = await pickFolder(
      t('settings.general.dataManagement.repos.selectNewPath', {
        name: repo.repo_name,
      })
    );

    if (!newPath) return;

    // Normalize path for cross-platform compatibility
    const normalizedPath = normalizePath(newPath);

    try {
      const response = await fetch(`/api/repos/${repo.repo_id}/fix-path`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_path: normalizedPath }),
      });

      const data = await response.json();

      if (data.data.success) {
        toast.success(t('settings.general.dataManagement.toasts.pathUpdated'));
        await handleScan();
      } else {
        toast.error(
          data.data.message ||
            t('settings.general.dataManagement.toasts.updateFailed')
        );
      }
    } catch (error) {
      toast.error(t('settings.general.dataManagement.toasts.failedToFixPath'));
      console.error(error);
    }
  };

  const handleBatchFix = () => {
    const invalidRepos = repos.filter((r) => !r.valid);
    if (invalidRepos.length === 0) {
      toast.info(t('settings.general.dataManagement.repos.noInvalidRepos'));
      return;
    }

    toast.info(
      t('settings.general.dataManagement.repos.foundInvalidRepos', {
        count: invalidRepos.length,
      })
    );
  };

  const invalidCount = repos.filter((r) => !r.valid).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('settings.general.dataManagement.repos.title')}
        </CardTitle>
        <CardDescription>
          {t('settings.general.dataManagement.repos.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scan Progress */}
        {scanning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {t(
                  'settings.general.dataManagement.repos.scanningRepositories'
                )}
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleScan} disabled={scanning}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`}
            />
            {t('settings.general.dataManagement.repos.scanRepositories')}
          </Button>
          {invalidCount > 0 && (
            <Button variant="outline" onClick={handleBatchFix}>
              {t('settings.general.dataManagement.repos.fixAll', {
                count: invalidCount,
              })}
            </Button>
          )}
        </div>

        {/* Repository List */}
        {repos.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t('settings.general.dataManagement.repos.foundRepos', {
                count: repos.length,
                invalid: invalidCount,
              })}
            </div>
            <div className="space-y-2">
              {repos.map((repo) => (
                <div
                  key={repo.repo_id}
                  className={`p-4 border rounded-lg ${
                    repo.valid
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-red-500/20 bg-red-500/5'
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
                          {repo.valid
                            ? t('settings.general.dataManagement.repos.valid')
                            : t(
                                'settings.general.dataManagement.repos.invalid'
                              )}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFixPath(repo)}
                      >
                        {t('settings.general.dataManagement.repos.fixPath')}
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
            <p>{t('settings.general.dataManagement.repos.clickScan')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
