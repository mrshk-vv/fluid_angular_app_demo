import { AzureClient, AzureClientProps } from "@fluidframework/azure-client";
import { FluidRelayConnectionConfig } from "./config";
import { ContainerSchema } from 'fluid-framework';

const connectionProperties: AzureClientProps = {
  connection: FluidRelayConnectionConfig,
}

const client = new AzureClient(connectionProperties);

export const getFluidContainer = async (containerSchema: ContainerSchema) => {
  const containerId = location.hash.substring(1);
  let container;
  if (!containerId) {
    ({ container } = await client.createContainer(containerSchema));
    const id = await container.attach();
    location.hash = id;
  }
  else {
    ({ container } = await client.getContainer(containerId, containerSchema));
  }


  return container;
}
