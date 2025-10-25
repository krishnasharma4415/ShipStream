import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DeploymentHistory } from "./deployment-history"
import { ThemeToggle } from "./theme-toggle"
import { useState } from "react"
import axios from "axios"
import pirateShipLogo from "../assets/pirate-ship.png"
import {
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Clock,
  Upload,
  Settings,
  Anchor
} from "lucide-react"

const BACKEND_UPLOAD_URL = import.meta.env.VITE_API_URL || "http://localhost:5500";

interface DeploymentStatus {
  status: 'idle' | 'uploading' | 'uploaded' | 'building' | 'deployed' | 'failed';
  progress: number;
  message: string;
}

export function Landing() {
  const [repoUrl, setRepoUrl] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [error, setError] = useState("");
  const [deployedUrl, setDeployedUrl] = useState("");

  const validateGitHubUrl = (url: string): boolean => {
    const githubRegex = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+(?:\.git)?(?:\/.*)?$/;
    return githubRegex.test(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'uploading':
        return {
          variant: 'warning' as const,
          icon: Upload,
          text: 'Loading Cargo',
          progress: 25,
          message: 'Gathering your code treasures and loading them aboard...'
        };
      case 'uploaded':
        return {
          variant: 'warning' as const,
          icon: Clock,
          text: 'Awaiting Departure',
          progress: 50,
          message: 'Ship is loaded and waiting for favorable winds...'
        };
      case 'building':
        return {
          variant: 'warning' as const,
          icon: Settings,
          text: 'Setting Sail',
          progress: 75,
          message: 'Hoisting the sails and navigating to production waters...'
        };
      case 'deployed':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          text: 'Anchored',
          progress: 100,
          message: 'Ship has successfully reached port!'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          text: 'Shipwrecked',
          progress: 0,
          message: 'Encountered rough seas. Please try launching again.'
        };
      default:
        return {
          variant: 'default' as const,
          icon: Anchor,
          text: 'Ready to Sail',
          progress: 0,
          message: ''
        };
    }
  };

  const saveDeployment = (id: string, repoUrl: string, status: string) => {
    const deployments = JSON.parse(localStorage.getItem('deployments') || '[]');
    const existingIndex = deployments.findIndex((d: any) => d.id === id);

    const deployment = {
      id,
      repoUrl,
      status,
      deployedAt: new Date().toISOString(),
      deployedUrl: `http://${id}.localhost:3000`
    };

    if (existingIndex >= 0) {
      deployments[existingIndex] = deployment;
    } else {
      deployments.unshift(deployment);
    }

    // Keep only last 10 deployments
    if (deployments.length > 10) {
      deployments.splice(10);
    }

    localStorage.setItem('deployments', JSON.stringify(deployments));
  };

  const handleDeploy = async () => {
    if (!validateGitHubUrl(repoUrl)) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }

    setError("");
    setDeploymentStatus({ status: 'uploading', progress: 25, message: 'Preparing to set sail...' });

    try {
      const res = await axios.post(`${BACKEND_UPLOAD_URL}/send-url`, {
        repoUrl: repoUrl
      });

      setUploadId(res.data.generated);
      setDeployedUrl(`http://${res.data.generated}.localhost:3000`);

      // Save initial deployment
      saveDeployment(res.data.generated, repoUrl, 'uploading');

      // Poll for status updates
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(`${BACKEND_UPLOAD_URL}/status?id=${res.data.generated}`);
          const status = response.data.status;
          const config = getStatusConfig(status);

          setDeploymentStatus({
            status: status,
            progress: config.progress,
            message: config.message
          });

          // Update deployment in localStorage
          saveDeployment(res.data.generated, repoUrl, status);

          if (status === "deployed" || status === "failed") {
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Status check failed:', err);
        }
      }, 2000);

    } catch (err) {
      setError("Failed to launch your ship. Please check your connection and try again.");
      setDeploymentStatus({ status: 'failed', progress: 0, message: 'Ship launch failed' });
    }
  };

  const statusConfig = getStatusConfig(deploymentStatus.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={pirateShipLogo}
                alt="ShipStream Logo"
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">ShipStream</h1>
              <Badge variant="secondary" className="ml-2">Beta</Badge>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <img
                src={pirateShipLogo}
                alt="ShipStream"
                className="h-20 w-20 object-contain animate-pulse-slow"
              />
            </div>
            <h2 className="text-4xl font-bold tracking-tight">
              Set sail with your GitHub repository
              <span className="text-blue-600"> instantly</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Navigate your code to production with ShipStream. Deploy any GitHub repository in seconds with automatic builds and smooth sailing to live domains.
            </p>
          </div>

          {/* Deployment Form */}
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Anchor className="h-5 w-5 text-blue-600" />
                Ship Your Repository
              </CardTitle>
              <CardDescription>
                Drop anchor on your GitHub repository URL and let ShipStream navigate it to production
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="github-url">GitHub Repository URL</Label>
                <Input
                  id="github-url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="text-base"
                  disabled={deploymentStatus.status !== 'idle' && deploymentStatus.status !== 'failed'}
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                onClick={handleDeploy}
                disabled={!repoUrl || (deploymentStatus.status !== 'idle' && deploymentStatus.status !== 'failed')}
                className="w-full text-base py-6"
                size="lg"
              >
                {deploymentStatus.status === 'idle' || deploymentStatus.status === 'failed' ? (
                  <>
                    <Anchor className="mr-2 h-4 w-4" />
                    Set Sail & Deploy
                  </>
                ) : (
                  <>
                    <StatusIcon className="mr-2 h-4 w-4 animate-pulse-slow" />
                    {statusConfig.text}...
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Deployment Status */}
          {deploymentStatus.status !== 'idle' && (
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5" />
                    Deployment Status
                  </span>
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.text}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Deployment ID: <code className="bg-muted px-1 rounded">{uploadId}</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{deploymentStatus.progress}%</span>
                  </div>
                  <Progress value={deploymentStatus.progress} className="h-2" />
                </div>

                {deploymentStatus.message && (
                  <Alert variant={deploymentStatus.status === 'failed' ? 'destructive' : 'default'}>
                    <AlertDescription>{deploymentStatus.message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Deployment Success */}
          {deploymentStatus.status === 'deployed' && deployedUrl && (
            <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  Ship Has Reached Port! 🚢
                </CardTitle>
                <CardDescription className="text-green-600 dark:text-green-400">
                  Your application has successfully sailed to production and is now live
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deployed-url">Deployed URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="deployed-url"
                      readOnly
                      value={deployedUrl}
                      className="bg-white dark:bg-slate-800"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(deployedUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Board Your Ship
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeploymentStatus({ status: 'idle', progress: 0, message: '' });
                      setUploadId('');
                      setDeployedUrl('');
                      setRepoUrl('');
                    }}
                  >
                    Launch Another Ship
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deployment History */}
          <DeploymentHistory />
        </div>
      </main>
    </div>
  )
}
