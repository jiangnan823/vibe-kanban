import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FolderOpen, RefreshCw, FileText, Trash2, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SessionStats {
  session_dir: string;
  count: number;
  total_size: number;
  latest: string | null;
}

interface SessionListItem {
  id: string;
  task_id: string;
  file_path: string;
  file_size: number;
  created_at: string;
  project_name: string | null;
  task_name: string | null;
}

export function SessionManagement() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsRes = await fetch('/api/data-management/sessions/stats');
      const statsData = await statsRes.json();
      setStats(statsData.data);

      // Load sessions
      const listRes = await fetch('/api/data-management/sessions/list?limit=20&offset=0');
      const listData = await listRes.json();
      setSessions(listData.data);
    } catch (error) {
      toast.error(t('settings.general.dataManagement.toasts.failedToLoadSession'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/data-management/sessions/rescan', { method: 'PUT' });
      const data = await res.json();

      toast.success(data.data.message || t('settings.general.dataManagement.toasts.scanCompleted'));
      await loadData();
    } catch (error) {
      toast.error(t('settings.general.dataManagement.toasts.failedToScan'));
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const handleOpenFolder = () => {
    if (stats?.session_dir) {
      window.api?.openPath(stats.session_dir);
    }
  };

  const handleViewSession = async (session: SessionListItem) => {
    try {
      const content = await fetch(session.file_path).then((res) => res.text());
      // Open in new tab or modal
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error(t('settings.general.dataManagement.toasts.failedToOpenSession'));
      console.error(error);
    }
  };

  const handleDeleteSession = async (session: SessionListItem) => {
    if (!confirm(t('settings.general.dataManagement.toasts.deleteConfirm', { name: session.task_name || t('settings.general.dataManagement.sessions.untitled') }))) {
      return;
    }

    try {
      await fetch(`/api/data-management/sessions/${session.id}`, {
        method: 'DELETE',
      });
      toast.success(t('settings.general.dataManagement.toasts.sessionDeleted'));
      await loadData();
    } catch (error) {
      toast.error(t('settings.general.dataManagement.toasts.failedToDelete'));
      console.error(error);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">{t('settings.general.dataManagement.errors.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session Directory Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general.dataManagement.sessions.sessionDirectory.title')}</CardTitle>
          <CardDescription>
            {t('settings.general.dataManagement.sessions.sessionDirectory.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('settings.general.dataManagement.sessions.directoryPath')}</label>
                <code className="block w-full px-3 py-2 bg-muted rounded-md text-sm">
                  {stats.session_dir}
                </code>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold">{stats.count}</div>
                  <div className="text-sm text-muted-foreground">{t('settings.general.dataManagement.sessions.sessionFiles')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatSize(stats.total_size)}</div>
                  <div className="text-sm text-muted-foreground">{t('settings.general.dataManagement.sessions.totalSize')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats.latest ? formatDistanceToNow(new Date(stats.latest), { addSuffix: true }) : t('settings.general.dataManagement.sessions.never')}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('settings.general.dataManagement.sessions.latestSession')}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleRescan} disabled={scanning}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
                  {t('settings.general.dataManagement.sessions.scanSessions')}
                </Button>
                <Button variant="outline" onClick={handleOpenFolder}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {t('settings.general.dataManagement.sessions.openFolder')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session Files List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general.dataManagement.sessions.savedSessions.title')}</CardTitle>
          <CardDescription>{t('settings.general.dataManagement.sessions.savedSessions.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('settings.general.dataManagement.sessions.noSavedSessions')}
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="font-medium truncate">
                        {session.project_name || t('settings.general.dataManagement.sessions.unknown')} / {session.task_name || t('settings.general.dataManagement.sessions.untitled')}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                      {' • '}
                      {formatSize(session.file_size)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSession(session)}
                    >
                      {t('settings.general.dataManagement.sessions.view')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSession(session)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
