import axios from 'axios';
import { githubConfig } from '../config/github';
import { GitHubUser } from '../types';

export const exchangeCodeForToken = async (code: string): Promise<string> => {
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: githubConfig.clientId,
      client_secret: githubConfig.clientSecret,
      code: code,
      redirect_uri: githubConfig.redirectUri
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.data.error) {
      throw new Error(response.data.error_description || 'OAuth token exchange failed');
    }

    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to exchange code for token');
  }
};

export const fetchGitHubUser = async (accessToken: string): Promise<GitHubUser> => {
  try {
    const [userResponse, emailResponse] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
    ]);

    const user = userResponse.data;
    const emails = emailResponse.data;
    
    const primaryEmail = emails.find((email: any) => email.primary)?.email || user.email || '';

    return {
      id: user.id,
      login: user.login,
      email: primaryEmail,
      avatar_url: user.avatar_url,
      name: user.name || user.login
    };
  } catch (error) {
    throw new Error('Failed to fetch GitHub user data');
  }
};