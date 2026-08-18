// Legacy compatibility facade for the original Base44-generated screens.
// It intentionally exposes only the capabilities Lexia already uses and maps
// every call through the provider-neutral `lexiaPlatform` contract.
import { lexiaPlatform } from '@/platform';

const ChildProgress = Object.freeze({
  list: (...args) => lexiaPlatform.progress.list(...args),
  create: (data) => lexiaPlatform.progress.create(data),
  update: (id, data) => lexiaPlatform.progress.update(id, data),
  delete: (id) => lexiaPlatform.progress.remove(id),
});

const Core = Object.freeze({
  UploadFile: ({ file }) => lexiaPlatform.storage.uploadFile(file),
  InvokeLLM: (request) => lexiaPlatform.ai.invoke(request),
  SendEmail: (message) => lexiaPlatform.email.send(message),
});

export const base44 = Object.freeze({
  entities: Object.freeze({ ChildProgress }),
  auth: Object.freeze({
    me: () => lexiaPlatform.auth.me(),
    logout: (redirectTo) => lexiaPlatform.auth.logout(redirectTo),
    redirectToLogin: (returnTo) => lexiaPlatform.auth.redirectToLogin(returnTo),
  }),
  integrations: Object.freeze({ Core }),
});
