import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { FolderOpen, CheckCircle, XCircle, RefreshCw, FolderOpen as FolderOpenIcon, ArrowRight } from 'lucide-react';
import { dataStorageApi } from '@/lib/api';
import { useFilePicker } from '@/hooks';
import { normalizePath } from '@/lib/pathUtils';

interface ConfigFileInfo {
  name: string;
  exists: boolean;
}

interface ConfigSourceInfo {
  current_path: string;
  default_path?: string;
  custom_path?: string;
  session_save_dir?: string | null;
  is_custom: boolean;
  files?: ConfigFileInfo[];
}

export function ConfigSourceManagement() {
  const { t } = useTranslation();
  const { pickFolder } = useFilePicker();
  const [configInfo, setConfigInfo] = useState<ConfigSourceInfo | null>(null);
  const [validating, setValidating] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [newConfigPath, setNewConfigPath] = useState('');
  const [copyExisting, setCopyExisting] = useState(true);

  useEffect(() => {
    loadConfigInfo();
  }, []);

  const loadConfigInfo = async () => {
    try {
      const info = await dataStorageApi.getPathConfig();
      setConfigInfo({
        current_path: info.current_path,
        default_path: info.default_path,
        custom_path: info.custom_path || undefined,
        session_save_dir: info.session_save_dir || undefined,
        is_custom: info.is_custom,
        files: []
      });
    } catch (error) {
      toast.error(t('settings.general.dataManagement.toasts.failedToLoadConfig'));
      console.error(error);
    }
  };

  const handleValidate = async () => {
    if (!configInfo) return;

    setValidating(true);
    try {
      const result = await fetch('/api/data-management/config-source/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: configInfo.custom_path || configInfo.current_path }),
      }).then((res) => res.json());

      if (result.data.valid) {
        toast.success(t('settings.general.dataManagement.toasts.configurationValid'));
      } else {
        toast.error(t('settings.general.dataManagement.toasts.configurationIssues', { issues: result.data.issues.join(', ') }));
      }
    } catch (error) {
      toast.error(t('settings.general.dataManagement.toasts.validationFailed'));
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  const handleReload = async () => {
    setReloading(true);
    try {
      const result = await fetch('/api/data-management/reload', {
        method: 'POST',
      }).then((res) => res.json());

      if (result.success) {
        toast.success(result.data.message || t('settings.general.dataManagement.toasts.reloadedSuccessfully'));
        await loadConfigInfo(); // Refresh config info
      } else {
        toast.error(result.message || t('settings.general.dataManagement.toasts.reloadFailed'));
      }
    } catch (error) {
      toast.error(t('settings.general.dataManagement.toasts.reloadFailed'));
      console.error(error);
    } finally {
      setReloading(false);
    }
  };

  const handleSwitchSource = async () => {
    if (!newConfigPath.trim()) {
      toast.error(t('settings.general.dataManagement.toasts.enterConfigPath'));
      return;
    }

    setSwitching(true);
    try {
      const result = await fetch('/api/data-management/config-source/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: newConfigPath,
          copy_existing: copyExisting,
        }),
      }).then((res) => res.json());

      if (result.success) {
        toast.success(result.data.message || t('settings.general.dataManagement.toasts.switchedSuccessfully'));
        setNewConfigPath('');
        await loadConfigInfo(); // Refresh config info
      } else {
        toast.error(result.message || t('settings.general.dataManagement.toasts.switchFailed'));
      }
    } catch (error) {
      toast.error(t('settings.general.dataManagement.toasts.switchFailed'));
      console.error(error);
    } finally {
      setSwitching(false);
    }
  };

  const handleOpenFolder = () => {
    if (configInfo?.current_path) {
      // Open folder in default file manager
      window.api?.openPath(configInfo.current_path);
    }
  };

  const handleSelectFolder = async () => {
    // Use file picker to select configuration directory
    const path = await pickFolder(t('settings.general.dataManagement.configSource.selectConfigDir'));

    if (path) {
      // Normalize path for cross-platform compatibility
      setNewConfigPath(normalizePath(path));
    }
  };

  if (!configInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">{t('settings.general.dataManagement.errors.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  const getFileStatus = (fileName: string) => {
    if (!configInfo.files) return false;
    const file = configInfo.files.find((f: any) => f.name === fileName);
    return file?.exists ?? false;
  };

  return (
    <div className="space-y-4">
      {/* Current Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general.dataManagement.configSource.currentConfig.title')}</CardTitle>
          <CardDescription>
            {t('settings.general.dataManagement.configSource.currentConfig.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Path */}
          <div className="space-y-2">
            <Label>{t('settings.general.dataManagement.configSource.currentLocation')}</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                {configInfo.current_path}
              </code>
              <Badge variant={configInfo.is_custom ? 'default' : 'secondary'}>
                {configInfo.is_custom ? t('settings.general.dataManagement.configSource.custom') : t('settings.general.dataManagement.configSource.default')}
              </Badge>
            </div>
          </div>

          {/* Session Directory */}
          <div className="space-y-2">
            <Label>{t('settings.general.dataManagement.configSource.sessionDirectory')}</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                {configInfo.session_save_dir || t('settings.general.dataManagement.configSource.notConfigured')}
              </code>
            </div>
          </div>

          {/* Files Status */}
          {configInfo.files && (
            <div className="space-y-2">
              <Label>{t('settings.general.dataManagement.configSource.configurationFiles')}</Label>
              <div className="space-y-2">
                {['config.json', 'profiles.json', 'custom_path.json'].map((file) => {
                  const exists = getFileStatus(file);
                  return (
                    <div key={file} className="flex items-center gap-2 text-sm">
                      {exists ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{file}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={validating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${validating ? 'animate-spin' : ''}`} />
              {t('settings.general.dataManagement.configSource.validateConfiguration')}
            </Button>
            <Button
              variant="outline"
              onClick={handleReload}
              disabled={reloading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${reloading ? 'animate-spin' : ''}`} />
              {reloading ? t('settings.general.dataManagement.configSource.reloading') : t('settings.general.dataManagement.configSource.reloadConfig')}
            </Button>
            <Button variant="outline" onClick={handleOpenFolder}>
              <FolderOpen className="h-4 w-4 mr-2" />
              {t('settings.general.dataManagement.configSource.openFolder')}
            </Button>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="text-muted-foreground">
              <strong>{t('settings.general.dataManagement.configSource.note').split('：')[0]}:</strong> {t('settings.general.dataManagement.configSource.note').split('：')[1]}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Switch Configuration Source */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general.dataManagement.configSource.switchSource.title')}</CardTitle>
          <CardDescription>
            {t('settings.general.dataManagement.configSource.switchSource.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-medium">{t('settings.general.dataManagement.configSource.requirements')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {(t('settings.general.dataManagement.configSource.requirementsList', { returnObjects: true }) as string[]).map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Path Input */}
          <div className="space-y-2">
            <Label htmlFor="new-config-path">{t('settings.general.dataManagement.configSource.newConfigPath')}</Label>
            <div className="flex gap-2">
              <Input
                id="new-config-path"
                placeholder={t('settings.general.dataManagement.configSource.pathPlaceholder')}
                value={newConfigPath}
                onChange={(e) => setNewConfigPath(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSelectFolder}>
                <FolderOpenIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Copy Existing Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="copy-existing"
              checked={copyExisting}
              onCheckedChange={(checked) => setCopyExisting(checked as boolean)}
            />
            <label htmlFor="copy-existing" className="text-sm cursor-pointer">
              {t('settings.general.dataManagement.configSource.copyExisting')}
            </label>
          </div>

          {/* Switch Button */}
          <Button
            onClick={handleSwitchSource}
            disabled={switching || !newConfigPath.trim()}
            className="w-full"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            {switching ? t('settings.general.dataManagement.configSource.switching') : t('settings.general.dataManagement.configSource.switchSourceButton')}
          </Button>

          {/* Warning */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm dark:border-yellow-800 dark:bg-yellow-950">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">{t('settings.general.dataManagement.configSource.important')}</p>
            <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
              {(t('settings.general.dataManagement.configSource.importantList', { returnObjects: true }) as string[]).map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
