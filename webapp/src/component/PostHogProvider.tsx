import React, { ReactNode } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PostHogReactProvider } from 'posthog-js/react';
import { useConfig, useUser } from 'tg.globalContext/helpers';
import { getUtmParams } from 'tg.fixtures/utmCookie';

const IGNORED_USER_DOMAINS = ['tolgee.io'];

interface PostHogProviderProps {
  children: ReactNode;
}

let isPostHogInitialized = false;

export const PostHogProvider: React.FC<PostHogProviderProps> = ({ children }) => {
  const config = useConfig();
  const userData = useUser();

  // Initialize PostHog only once and only if conditions are met
  if (
    !isPostHogInitialized &&
    config?.postHogApiKey &&
    userData?.id !== undefined &&
    IGNORED_USER_DOMAINS.every((domain) => !userData.username.endsWith(domain))
  ) {
    try {
      posthog.init(config.postHogApiKey, {
        api_host: config?.postHogHost || 'https://us.i.posthog.com',
        disable_session_recording: false,
      });

      // Identify user with UTM parameters
      posthog.identify(userData.id.toString(), {
        name: userData.username,
        email: userData.username,
        ...getUtmParams(),
      });

      isPostHogInitialized = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('PostHog initialization failed:', error);
    }
  }

  // If PostHog is not initialized or conditions aren't met, render children without provider
  if (!isPostHogInitialized || !config?.postHogApiKey) {
    return <>{children}</>;
  }

  return (
    <PostHogReactProvider client={posthog}>{children}</PostHogReactProvider>
  );
};
