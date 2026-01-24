import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Download, Upload, FileDown, Package } from 'lucide-react';

export function ImportExportManagement() {
  const { t } = useTranslation();
  const [exportOptions, setExportOptions] = useState({
    include_config: true,
    include_profiles: true,
    include_projects: true,
    include_tags: true,
  });
  const [importOptions, setImportOptions] = useState({
    skip_existing: true,
    overwrite_config: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: string[];
    skipped: string[];
    errors: string[];
  } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (exportOptions.include_config) params.append('include_config', 'true');
      if (exportOptions.include_profiles) params.append('include_profiles', 'true');
      if (exportOptions.include_projects) params.append('include_projects', 'true');
      if (exportOptions.include_tags) params.append('include_tags', 'true');

      const response = await fetch(`/api/data-management/export/config?${params}`);
      const data = await response.json();

      if (data.data) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.data.filename || 'vibe-kanban-config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Configuration exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export configuration');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSessions = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/data-management/sessions/export');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Export failed');
      }

      // Get blob from response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition');
      let filename = 'vibe-kanban-sessions.zip';
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Sessions exported successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export sessions');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      setImportResult(null);

      try {
        const formData = new FormData();
        formData.append('config_file', file);

        // Add import options
        if (importOptions.skip_existing) {
          formData.append('skip_existing', 'true');
        }
        if (importOptions.overwrite_config) {
          formData.append('overwrite_config', 'true');
        }

        const response = await fetch('/api/data-management/import/config', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setImportResult(data.data);
          toast.success('Configuration imported successfully. Please restart the application.');
        } else {
          toast.error(data.message || 'Failed to import configuration');
        }
      } catch (error) {
        toast.error('Failed to import configuration');
        console.error(error);
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
          <CardDescription>
            Download your application configuration as a JSON file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include in export:</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="export-config"
                  checked={exportOptions.include_config}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, include_config: checked as boolean })
                  }
                />
                <label htmlFor="export-config" className="text-sm cursor-pointer">
                  Application configuration (config.json)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="export-profiles"
                  checked={exportOptions.include_profiles}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, include_profiles: checked as boolean })
                  }
                />
                <label htmlFor="export-profiles" className="text-sm cursor-pointer">
                  Agent profiles (profiles.json)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="export-projects"
                  checked={exportOptions.include_projects}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, include_projects: checked as boolean })
                  }
                />
                <label htmlFor="export-projects" className="text-sm cursor-pointer">
                  Project metadata (without paths)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="export-tags"
                  checked={exportOptions.include_tags}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, include_tags: checked as boolean })
                  }
                />
                <label htmlFor="export-tags" className="text-sm cursor-pointer">
                  Task tags
                </label>
              </div>
            </div>
          </div>
          <Button onClick={handleExport} disabled={isExporting} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Configuration'}
          </Button>
        </CardContent>
      </Card>

      {/* Export Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Sessions</CardTitle>
          <CardDescription>
            Download all session files as a ZIP archive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-medium">Sessions will be organized as:</p>
            <pre className="text-xs bg-muted-foreground/10 p-2 rounded">
              sessions/
              {'\n'}  {'{project_name}'}/
              {'\n'}    {'{task_name}'}/
              {'\n'}      2025-01-23-14-30.md
            </pre>
          </div>
          <Button onClick={handleExportSessions} disabled={isExporting} variant="outline" className="w-full sm:w-auto">
            <Package className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export All Sessions'}
          </Button>
        </CardContent>
      </Card>

      {/* Import Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Import Configuration</CardTitle>
          <CardDescription>
            Import a previously exported configuration file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Import options:</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-existing"
                  checked={importOptions.skip_existing}
                  onCheckedChange={(checked) =>
                    setImportOptions({ ...importOptions, skip_existing: checked as boolean })
                  }
                />
                <label htmlFor="skip-existing" className="text-sm cursor-pointer">
                  Skip existing items (don't overwrite)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwrite-config"
                  checked={importOptions.overwrite_config}
                  onCheckedChange={(checked) =>
                    setImportOptions({ ...importOptions, overwrite_config: checked as boolean })
                  }
                />
                <label htmlFor="overwrite-config" className="text-sm cursor-pointer">
                  Overwrite configuration files
                </label>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-medium">Note:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Importing will merge with existing configuration</li>
              <li>Sensitive data (credentials) are not included</li>
              <li>Paths will need to be adjusted for cross-device usage</li>
              <li>Application restart may be required</li>
            </ul>
          </div>
          <Button onClick={handleImport} disabled={isImporting} variant="outline" className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import Configuration'}
          </Button>

          {/* Import Result */}
          {importResult && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-medium text-sm">Import Result:</p>
              {importResult.imported.length > 0 && (
                <div className="text-sm">
                  <p className="text-green-600 font-medium">Imported ({importResult.imported.length}):</p>
                  <ul className="list-disc list-inside text-muted-foreground ml-2">
                    {importResult.imported.slice(0, 5).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {importResult.imported.length > 5 && (
                      <li>... and {importResult.imported.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              {importResult.skipped.length > 0 && (
                <div className="text-sm">
                  <p className="text-yellow-600 font-medium">Skipped ({importResult.skipped.length}):</p>
                  <ul className="list-disc list-inside text-muted-foreground ml-2">
                    {importResult.skipped.slice(0, 5).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {importResult.skipped.length > 5 && (
                      <li>... and {importResult.skipped.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div className="text-sm">
                  <p className="text-red-600 font-medium">Errors ({importResult.errors.length}):</p>
                  <ul className="list-disc list-inside text-red-400 ml-2">
                    {importResult.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
