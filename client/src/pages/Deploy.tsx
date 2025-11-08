import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deploymentService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/AuthLayout';
import { Button } from '../components/ui/button';

export default function Deploy() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    repoUrl: '',
    branch: 'main'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await deploymentService.createDeployment(formData.repoUrl, formData.branch);
      navigate(`/deployments/${response.data.id}`);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create deployment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg border-0 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
              Create New Deployment
            </h3>
            
            <div className="mb-6 p-4 bg-blue-50/80 dark:bg-blue-950/80 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <img
                    src={user?.avatarUrl}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Deploying as <strong>{user?.username}</strong>
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    This deployment will be associated with your account
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="repoUrl" className="block text-sm font-medium text-foreground">
                  Repository URL
                </label>
                <input
                  type="url"
                  name="repoUrl"
                  id="repoUrl"
                  required
                  value={formData.repoUrl}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username/repository"
                  className="mt-1 block w-full border-input bg-background rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm px-3 py-2 border"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the GitHub repository URL you want to deploy
                </p>
              </div>

              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-foreground">
                  Branch
                </label>
                <input
                  type="text"
                  name="branch"
                  id="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  placeholder="main"
                  className="mt-1 block w-full border-input bg-background rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm px-3 py-2 border"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Specify which branch to deploy (default: main)
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-4">
                  <div className="text-sm text-destructive">{error}</div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.repoUrl}
                >
                  {isLoading ? 'Creating...' : 'Deploy'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}