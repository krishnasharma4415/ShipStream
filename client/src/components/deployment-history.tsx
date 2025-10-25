import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { 
  Clock, 
  ExternalLink, 
  Github, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Trash2
} from "lucide-react"

interface Deployment {
  id: string;
  repoUrl: string;
  status: 'deployed' | 'building' | 'failed';
  deployedAt: Date;
  deployedUrl: string;
}

export function DeploymentHistory() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  useEffect(() => {
    // Load deployments from localStorage
    const saved = localStorage.getItem('deployments');
    if (saved) {
      const parsed = JSON.parse(saved);
      setDeployments(parsed.map((d: any) => ({
        ...d,
        deployedAt: new Date(d.deployedAt)
      })));
    }
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'deployed':
        return { variant: 'success' as const, icon: CheckCircle, text: 'Deployed' };
      case 'building':
        return { variant: 'warning' as const, icon: Settings, text: 'Building' };
      case 'failed':
        return { variant: 'destructive' as const, icon: AlertCircle, text: 'Failed' };
      default:
        return { variant: 'default' as const, icon: Clock, text: 'Unknown' };
    }
  };

  const removeDeployment = (id: string) => {
    const updated = deployments.filter(d => d.id !== id);
    setDeployments(updated);
    localStorage.setItem('deployments', JSON.stringify(updated));
  };

  const getRepoName = (url: string) => {
    try {
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      return match ? `${match[1]}/${match[2]}` : url;
    } catch {
      return url;
    }
  };

  if (deployments.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Deployment History
          </CardTitle>
          <CardDescription>
            Your recent deployments will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No deployments yet</p>
            <p className="text-sm">Deploy your first repository to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Deployment History
        </CardTitle>
        <CardDescription>
          {deployments.length} deployment{deployments.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deployments.map((deployment) => {
            const statusConfig = getStatusConfig(deployment.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div 
                key={deployment.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <StatusIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getRepoName(deployment.repoUrl)}</p>
                      <Badge variant={statusConfig.variant} className="text-xs">
                        {statusConfig.text}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {deployment.deployedAt.toLocaleDateString()} at {deployment.deployedAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {deployment.status === 'deployed' && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={deployment.deployedUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeDeployment(deployment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}