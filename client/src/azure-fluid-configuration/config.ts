import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import { AzureRemoteConnectionConfig } from "@fluidframework/azure-client"
import { v4 as Guid } from 'uuid';

export const FluidRelayConnectionConfig : AzureRemoteConnectionConfig = {
  tenantId: "93441424-441e-4f78-b02b-0acf9db06fb6",
  tokenProvider: new InsecureTokenProvider("b30a7efc875c18651a158b437dc78840", { id: Guid() }), // Should be get from Azure Key Vault
  endpoint: "https://eu.fluidrelay.azure.com",
  type: "remote",
};


