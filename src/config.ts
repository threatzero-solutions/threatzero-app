import { type KeycloakConfig, type KeycloakInitOptions } from "keycloak-js";

export interface IConfig {
  keycloak: {
    config: KeycloakConfig;
    initOptions: KeycloakInitOptions;
  };
  apis: {
    threatzero: {
      baseUrl: string;
    };
  };
}

const config: IConfig = {
  keycloak: {
    config: {
      url:
        import.meta.env.VITE_KEYCLOAK_URL ??
        "https://auth.staging.threatzero.org/",
      realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "threatzero",
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "threatzero-app",
    },
    initOptions: {},
  },
  apis: {
    threatzero: {
      baseUrl:
        import.meta.env.VITE_APIS_THREATZERO_BASE_URL?.replace(/\/+$/, "") ??
        "",
    },
  },
};

export default config;
