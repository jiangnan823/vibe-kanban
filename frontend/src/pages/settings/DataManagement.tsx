import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FolderOpen, GitBranch, Download } from 'lucide-react';

import { ConfigSourceManagement } from './data-management/ConfigSourceManagement';
import { SessionManagement } from './data-management/SessionManagement';
import { RepoPathManagement } from './data-management/RepoPathManagement';
import { ImportExportManagement } from './data-management/ImportExportManagement';

type TabValue = 'config' | 'sessions' | 'repos' | 'import-export';

export function DataManagement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabValue>('config');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {t('settings.general.dataManagement.title')}
        </h2>
        <p className="text-muted-foreground mt-2">
          {t('settings.general.dataManagement.description')}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('settings.general.dataManagement.tabs.config')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('settings.general.dataManagement.tabs.sessions')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="repos" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('settings.general.dataManagement.tabs.repos')}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="import-export"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('settings.general.dataManagement.tabs.importExport')}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <ConfigSourceManagement />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <SessionManagement />
        </TabsContent>

        <TabsContent value="repos" className="space-y-4">
          <RepoPathManagement />
        </TabsContent>

        <TabsContent value="import-export" className="space-y-4">
          <ImportExportManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
