import { createClient } from '@base44/sdk';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const client = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl,
});

async function getPublicSettings() {
  if (!appId) {
    return { id: null, public_settings: {} };
  }

  const appClient = createAxiosClient({
    baseURL: '/api/apps/public',
    headers: { 'X-App-Id': appId },
    token,
    interceptResponses: true,
  });

  return appClient.get(`/prod/public-settings/by-id/${appId}`);
}

async function clearAllProgress() {
  const records = await client.entities.ChildProgress.list();
  await Promise.all(records.map((record) => client.entities.ChildProgress.delete(record.id)));
}

export const base44Adapter = {
  provider: 'base44',

  progress: {
    list: (...args) => client.entities.ChildProgress.list(...args),
    create: (data) => client.entities.ChildProgress.create(data),
    update: (id, data) => client.entities.ChildProgress.update(id, data),
    remove: (id) => client.entities.ChildProgress.delete(id),
    clearAll: clearAllProgress,
  },

  auth: {
    me: () => client.auth.me(),
    logout: (redirectTo) => client.auth.logout(redirectTo),
    redirectToLogin: (returnTo) => client.auth.redirectToLogin(returnTo),
    getPublicSettings,
    hasAccessToken: () => Boolean(token),
  },

  storage: {
    uploadFile: (file) => client.integrations.Core.UploadFile({ file }),
  },

  ai: {
    invoke: (request) => client.integrations.Core.InvokeLLM(request),
  },

  email: {
    send: (message) => client.integrations.Core.SendEmail(message),
  },
};
