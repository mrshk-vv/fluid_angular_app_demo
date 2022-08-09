import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import { AzureRemoteConnectionConfig } from "@fluidframework/azure-client"
import { v4 as Guid } from 'uuid';

export const FluidRelayConnectionConfig : AzureRemoteConnectionConfig = {
  tenantId: "93441424-441e-4f78-b02b-0acf9db06fb6",
  tokenProvider: new InsecureTokenProvider("5295a128db563d27ca80efe5d4d506c8", { id: Guid() }), // Should be get from Azure Key Vault
  endpoint: "https://eu.fluidrelay.azure.com",
  type: "remote",
};


