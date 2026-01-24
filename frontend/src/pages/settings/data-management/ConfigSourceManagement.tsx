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
import type { ConfigSourceInfo } from '@/types';

export function ConfigSourceManagement() {
  const { t } = useTranslation();
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
      setConfigInfo(info);
    } catch (error) {
      toast.error('Failed to load configuration info');
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
        toast.success('Configuration is valid');
      } else {
        toast.error(`Configuration issues: ${result.data.issues.join(', ')}`);
      }
    } catch (error) {
      toast.error('Validation failed');
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
        toast.success(result.data.message || 'Configuration reloaded successfully');
        await loadConfigInfo(); // Refresh config info
      } else {
        toast.error(result.message || 'Failed to reload configuration');
      }
    } catch (error) {
      toast.error('Failed to reload configuration');
      console.error(error);
    } finally {
      setReloading(false);
    }
  };

  const handleSwitchSource = async () => {
    if (!newConfigPath.trim()) {
      toast.error('Please enter a configuration path');
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
        toast.success(result.data.message || 'Configuration source switched successfully');
        setNewConfigPath('');
        await loadConfigInfo(); // Refresh config info
      } else {
        toast.error(result.message || 'Failed to switch configuration source');
      }
    } catch (error) {
      toast.error('Failed to switch configuration source');
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
    // Use Electron/Tauri folder picker if available
    if (window.api?.selectFolder) {
      try {
        const path = await window.api.selectFolder();
        if (path) {
          setNewConfigPath(path);
        }
      } catch (error) {
        toast.error('Failed to select folder');
        console.error(error);
      }
    } else {
      // Fallback: prompt user to enter path manually
      const path = prompt('Enter the full path to the configuration directory:');
      if (path) {
        setNewConfigPath(path);
      }
    }
  };

  if (!configInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const getFileStatus = (fileName: string) => {
    const file = configInfo.files.find((f) => f.name === fileName);
    return file?.exists ?? false;
  };

  return (
    <div className="space-y-4">
      {/* Current Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration Source</CardTitle>
          <CardDescription>
            Location where application configurations are stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Path */}
          <div className="space-y-2">
            <Label>Current Location</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                {configInfo.current_path}
              </code>
              <Badge variant={configInfo.is_custom ? 'default' : 'secondary'}>
                {configInfo.is_custom ? 'Custom' : 'Default'}
              </Badge>
            </div>
          </div>

          {/* Session Directory */}
          <div className="space-y-2">
            <Label>Session Directory</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                {configInfo.session_save_dir || 'Not configured'}
              </code>
            </div>
          </div>

          {/* Files Status */}
          <div className="space-y-2">
            <Label>Configuration Files</Label>
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

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={validating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${validating ? 'animate-spin' : ''}`} />
              Validate Configuration
            </Button>
            <Button
              variant="outline"
              onClick={handleReload}
              disabled={reloading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${reloading ? 'animate-spin' : ''}`} />
              {reloading ? 'Reloading...' : 'Reload Config'}
            </Button>
            <Button variant="outline" onClick={handleOpenFolder}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Open Folder
            </Button>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="text-muted-foreground">
              <strong>Note:</strong> Click "Reload Config" to apply configuration changes without restarting the application.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Switch Configuration Source */}
      <Card>
        <CardHeader>
          <CardTitle>Switch Configuration Source</CardTitle>
          <CardDescription>
            Change to a different configuration directory (e.g., for multi-device sync)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-medium">Requirements:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>The directory must exist and contain a config.json file</li>
              <li>Optional: profiles.json and custom_path.json</li>
              <li>Choose to copy existing configurations to the new location</li>
            </ul>
          </div>

          {/* Path Input */}
          <div className="space-y-2">
            <Label htmlFor="new-config-path">New Configuration Path</Label>
            <div className="flex gap-2">
              <Input
                id="new-config-path"
                placeholder="/path/to/config/directory"
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
              Copy existing configuration files to new location
            </label>
          </div>

          {/* Switch Button */}
          <Button
            onClick={handleSwitchSource}
            disabled={switching || !newConfigPath.trim()}
            className="w-full"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            {switching ? 'Switching...' : 'Switch Configuration Source'}
          </Button>

          {/* Warning */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm dark:border-yellow-800 dark:bg-yellow-950">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">Important:</p>
            <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
              <li>After switching, the application will use configurations from the new location</li>
              <li>Click "Reload Config" to apply the changes</li>
              <li>Make sure the new directory is accessible and has proper permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
