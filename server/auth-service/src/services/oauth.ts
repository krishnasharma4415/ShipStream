import { githubConfig } from '../config/github';
import { generateSecureToken } from '../utils/encryption';
import { setItem, getItem, deleteItem } from './memory-store';

export const generateAuthUrl = async (): Promise<{ url: string; state: string }> => {
  const state = generateSecureToken(16);
  
  await setItem(`oauth_state:${state}`, 'valid', 600);
  
  const params = new URLSearchParams({
    client_id: githubConfig.clientId,
    redirect_uri: githubConfig.redirectUri,
    scope: githubConfig.scope.join(' '),
    state: state,
    response_type: 'code'
  });
  
  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
  
  return { url, state };
};

export const validateState = async (state: string): Promise<boolean> => {
  try {
    const isValid = await getItem(`oauth_state:${state}`);
    if (isValid) {
      await deleteItem(`oauth_state:${state}`);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};