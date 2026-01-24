import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowRight, FolderOpen, Sparkles } from 'lucide-react';
import { useFilePicker } from '@/hooks';
import { normalizePath } from '@/lib/pathUtils';

type FirstRunCheckResponse = {
  is_first_run: boolean;
  has_config: boolean;
  has_valid_config_source: boolean;
  issues: string[];
  suggested_actions: string[];
};

type WizardStep = 'welcome' | 'choose-config' | 'import-config' | 'complete';

export function FirstRunWizard() {
  const { t } = useTranslation(['wizard', 'common', 'settings']);
  const navigate = useNavigate();
  const { pickFolder } = useFilePicker();
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [checkResult, setCheckResult] = useState<FirstRunCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [configPath, setConfigPath] = useState('');
  const [copyExisting, setCopyExisting] = useState(false);
  const [useDefault, setUseDefault] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [configValid, setConfigValid] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstRun();
  }, []);

  const checkFirstRun = async () => {
    try {
      const response = await fetch('/api/data-management/first-run-check');
      const data = await response.json();

      if (data.success) {
        setCheckResult(data.data);

        // If not first run and has valid config, skip wizard
        if (!data.data.is_first_run && data.data.has_valid_config_source) {
          // Redirect to main app
          navigate('/', { replace: true });
        }
      }
    } catch (error) {
      console.error('Failed to check first run status:', error);
      // On error, allow user to proceed
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaultConfig = async () => {
    setUseDefault(true);
    setCurrentStep('complete');
  };

  const handleChooseConfig = () => {
    setCurrentStep('choose-config');
  };

  const handleSelectFolder = async () => {
    // Use file picker to select configuration directory
    const path = await pickFolder(t('wizard.prompt.configPath'));

    if (path) {
      // Normalize path for cross-platform compatibility
      const normalizedPath = normalizePath(path);
      setConfigPath(normalizedPath);
      await validateConfig(normalizedPath);
    }
  };

  const validateConfig = async (path: string) => {
    try {
      const response = await fetch('/api/data-management/config-source/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      const data = await response.json();

      setConfigValid(data.data.valid);

      if (!data.data.valid) {
        toast.error(t('error.invalidConfig', { issues: data.data.issues.join(', ') }));
      }
    } catch (error) {
      setConfigValid(false);
      toast.error(t('error.validationFailed'));
    }
  };

  const handleApplyConfig = async () => {
    if (!configPath || !configValid) {
      toast.error(t('error.invalidDirectory'));
      return;
    }

    setSwitching(true);
    try {
      const response = await fetch('/api/data-management/config-source/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: configPath,
          copy_existing: copyExisting,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('success.configApplied'));
        setCurrentStep('complete');
      } else {
        toast.error(data.message || t('error.applyFailed'));
      }
    } catch (error) {
      toast.error(t('error.applyFailed'));
      console.error(error);
    } finally {
      setSwitching(false);
    }
  };

  const handleComplete = () => {
    // Reload config and go to main app
    fetch('/api/data-management/reload', { method: 'POST' });
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-muted-foreground">{t('loading.checkingConfiguration')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-2xl space-y-4">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2">
          <Badge variant={currentStep === 'welcome' ? 'default' : 'secondary'}>{t('progress.welcome')}</Badge>
          <Badge variant={currentStep === 'choose-config' ? 'default' : 'secondary'}>{t('progress.setup')}</Badge>
          <Badge variant={currentStep === 'complete' ? 'default' : 'secondary'}>{t('progress.complete')}</Badge>
        </div>

        {/* Step 1: Welcome */}
        {currentStep === 'welcome' && (
          <Card>
            <CardHeader className="text-center">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary" />
              <CardTitle className="text-2xl">{t('welcome.title')}</CardTitle>
              <CardDescription>
                {checkResult?.is_first_run
                  ? t('welcome.firstRunDescription')
                  : t('welcome.fixConfigDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Issues */}
              {checkResult && checkResult.issues.length > 0 && (
                <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
                  <p className="font-medium text-sm text-destructive">{t('welcome.issues.label')}</p>
                  <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                    {checkResult.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                <Card
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={handleUseDefaultConfig}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium">{t('welcome.options.useDefault.title')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('welcome.options.useDefault.description')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={handleChooseConfig}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FolderOpen className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium">{t('welcome.options.useExisting.title')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('welcome.options.useExisting.description')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Suggested Actions */}
              {checkResult && checkResult.suggested_actions.length > 0 && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="font-medium text-sm mb-2">{t('welcome.suggestedActions.title')}</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {checkResult.suggested_actions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Configuration */}
        {currentStep === 'choose-config' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('setup.title')}</CardTitle>
              <CardDescription>
                {t('setup.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">{t('setup.requirements.title')}</p>
                <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
                  <li>{t('setup.requirements.configJson')}</li>
                  <li>{t('setup.requirements.profilesJson')}</li>
                  <li>{t('setup.requirements.customPathJson')}</li>
                </ul>
              </div>

              {/* Path Input */}
              <div className="space-y-2">
                <Label htmlFor="config-path">{t('setup.configPath')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="config-path"
                    placeholder={t('setup.configPathPlaceholder')}
                    value={configPath}
                    onChange={(e) => {
                      setConfigPath(e.target.value);
                      setConfigValid(null);
                    }}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleSelectFolder}>
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
                {configValid !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    {configValid ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">{t('setup.validDirectory')}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">{t('setup.invalidDirectory')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Copy Existing Option */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="copy-existing-wizard"
                  checked={copyExisting}
                  onCheckedChange={(checked) => setCopyExisting(checked as boolean)}
                />
                <label htmlFor="copy-existing-wizard" className="text-sm cursor-pointer">
                  {t('setup.copyDefaultConfig')}
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('welcome')}
                  className="flex-1"
                >
                  {t('setup.buttons.back')}
                </Button>
                <Button
                  onClick={handleApplyConfig}
                  disabled={!configPath || !configValid || switching}
                  className="flex-1"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {switching ? t('setup.buttons.applying') : t('setup.buttons.applyConfiguration')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {currentStep === 'complete' && (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <CardTitle className="text-2xl">{t('complete.title')}</CardTitle>
              <CardDescription>
                {useDefault
                  ? t('complete.defaultDescription')
                  : t('complete.customDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-sm">
                <p className="font-medium text-green-800 dark:text-green-200 mb-2">{t('complete.whatsNext.title')}</p>
                <ul className="list-disc list-inside text-green-700 dark:text-green-300 space-y-1">
                  <li>{t('complete.whatsNext.exploreProjects')}</li>
                  <li>{t('complete.whatsNext.customizeSettings')}</li>
                  <li>{t('complete.whatsNext.saveSessions')}</li>
                  {!useDefault && <li>{t('complete.whatsNext.configureRepos')}</li>}
                </ul>
              </div>

              <Button onClick={handleComplete} className="w-full" size="lg">
                {t('complete.getStarted')} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
