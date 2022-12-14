import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { SharedMap } from 'fluid-framework';
import { AzureClientProps, AzureRemoteConnectionConfig } from '@fluidframework/azure-client';
import { InsecureTokenProvider } from '@fluidframework/test-client-utils';
import { v4 as Guid } from 'uuid';
import { cloneObject, Connector, ConnectorModel, DiagramComponent, FlowShapeModel, ICollectionChangeEventArgs, IConnectionChangeEventArgs, IDragEnterEventArgs, IDraggingEventArgs, IDropEventArgs, IEndChangeEventArgs, IPropertyChangeEventArgs, ITextEditEventArgs, MarginModel, NodeModel, OrthogonalSegmentModel, PaletteModel, PointPortModel, ShapeAnnotationModel, SnapSettingsModel, StrokeStyleModel, SymbolInfo, TextModel, TextStyleModel } from '@syncfusion/ej2-angular-diagrams';
import { getFluidContainer } from '../azure-fluid-configuration/fluid-relay-connection-factory';
import { paletteIconClick } from '../../script/diagram-common';


const config: AzureRemoteConnectionConfig = {
  tenantId: "93441424-441e-4f78-b02b-0acf9db06fb6",
  tokenProvider: new InsecureTokenProvider("4739f848d7ec9c4b48f5ddfc7d385bc2", { id: Guid() }),
  endpoint: "https://eu.fluidrelay.azure.com",
  type: "remote",
};

export const clientProps: AzureClientProps = {
  connection: config,
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  @ViewChild('diagram') public diagram: DiagramComponent;

  sharedNodes: SharedMap | undefined;
  sharedConnectors: SharedMap | undefined;
  localNodes: Record<string, NodeModel> = {}
  localConnectors: Record<string, ConnectorModel> = {}

  updateLocalNodes: ((...args) => void) | undefined;
  updateLocalConnectors: ((...args) => void) | undefined;

  constructor(private cdr: ChangeDetectorRef) { }

  async ngOnInit() {
    const initialObjects = await this.getFluidData();
    this.sharedNodes = initialObjects.sharedNodes;
    this.sharedConnectors = initialObjects.sharedConnectors;
    this.syncData();
  }

  async getFluidData() {
    const containerSchema = {
      initialObjects: {
        sharedNodes: SharedMap,
        sharedConnectors: SharedMap,
      }
    };

    // TODO 2: Get the container from the Fluid service.
    let container = await getFluidContainer(containerSchema);
    // TODO 3: Return the Fluid timestamp object.
    return container.initialObjects;
  }

  syncData() {
    if (this.sharedNodes) {
      const nodes = Array.from(this.sharedNodes.values()).map(i => cloneObject(i) as NodeModel);
      const connectors = Array.from(this.sharedConnectors.values()).map(i => cloneObject(i) as ConnectorModel);
      for (const node of nodes) {
        this.diagram.addNode(node)
        this.localNodes[node.id] = node;
      }

      for (const connector of connectors) {
        this.diagram.addConnector(connector)
        this.localConnectors[connector.id] = connector;
      }


      this.updateLocalNodes = (e?) => {
        if (e) {
          const diff = this.getNodeDifference();
          if (diff.length > 0) {
            const node = this.sharedNodes!.get(e.key) as NodeModel;
            let localNode = this.localNodes[e.key]
            if (node && !localNode && e.previousValue === undefined) {
              console.log('add node')
              this.diagram.addNode(node)
              this.localNodes[node.id] = node;
            } else if (e.previousValue !== undefined && node === undefined) {
              localNode = this.localNodes[e.previousValue.id]
              if (localNode) {
                console.log('delete node')
                this.diagram.remove(localNode)
                this.localNodes[localNode.id] = null;
              }
            }
          } else {
            console.log('update node')
            const nodeToUpdatePos = this.diagram.nodes.find(n => n.id === e.key);
            const updatedNode = this.sharedNodes!.get(e.key) as NodeModel;
            nodeToUpdatePos.annotations = updatedNode.annotations;
            nodeToUpdatePos.offsetX = updatedNode.offsetX;
            nodeToUpdatePos.offsetY = updatedNode.offsetY;
            this.diagram.updateDiagramObject(nodeToUpdatePos, true, true);
            this.localNodes[e.key] = updatedNode;
          }
        }

        this.cdr.detectChanges();
      };

      this.updateLocalConnectors = (e?) => {
        if (e) {
          const diff = this.getConnectorDifference();
          if (diff.length > 0) {
            const connector = this.sharedConnectors!.get(e.key) as ConnectorModel;
            let localConnector = this.localConnectors[e.key]
            if (connector && !localConnector && e.previousValue === undefined) {
              console.log('add connector')
              this.diagram.addConnector(connector)
              this.localConnectors[connector.id] = connector;
            } else if (e.previousValue !== undefined && connector === undefined) {
              localConnector = this.localConnectors[e.previousValue.id]
              if (localConnector) {
                console.log('delete connector')
                this.diagram.remove(localConnector)
                this.localConnectors[localConnector.id] = null;
              }
            }
          } else {
            console.log('update connector')
            const connectorToUpdatePos = this.diagram.connectors.find(n => n.id === e.key);
            const updatedConnector = this.sharedConnectors!.get(e.key) as ConnectorModel;
            connectorToUpdatePos.targetPoint = updatedConnector.targetPoint;
            connectorToUpdatePos.sourcePoint = updatedConnector.sourcePoint;
            connectorToUpdatePos.sourcePortID = updatedConnector.sourcePortID;
            connectorToUpdatePos.targetPortID = updatedConnector.targetPortID;
            this.diagram.updateDiagramObject(connectorToUpdatePos, true, true);
            this.localConnectors[e.key] = updatedConnector;
          }
        }

        this.cdr.detectChanges();
      }

      this.updateLocalNodes(null);
      this.updateLocalConnectors(null);
      this.sharedNodes!.on("valueChanged", this.updateLocalNodes!)
      this.sharedConnectors.on("valueChanged", this.updateLocalConnectors!)
    }
  }

  getNodeDifference(): string[] {
    const sharedNodesIds = (Array.from(this.sharedNodes!.values()) as NodeModel[]).map(n => n.id);
    const localNodesIds = Object.values(this.localNodes).filter(i => !!i).map(n => n.id);

    const diff = sharedNodesIds.length > localNodesIds.length ?
      sharedNodesIds.filter(e => !localNodesIds.includes(e)) :
      localNodesIds.filter(e => !sharedNodesIds.includes(e))

    return diff;

  }

  getConnectorDifference(): string[] {
    const sharedConnectorsIds = (Array.from(this.sharedConnectors!.values()) as ConnectorModel[]).map(n => n.id);
    const localConnectorsIds = Object.values(this.localConnectors).filter(i => !!i).map(n => n.id);

    const diff = sharedConnectorsIds.length > localConnectorsIds.length ?
      sharedConnectorsIds.filter(e => !localConnectorsIds.includes(e)) :
      localConnectorsIds.filter(e => !sharedConnectorsIds.includes(e))

    return diff;
  }

  onDropElement(args: IDropEventArgs): void {
    const elementId = (args.element as any)?.properties?.id
    const element = cloneObject(args.element)
    if ((args.element as any).propName === 'nodes') {
      this.sharedNodes!.set(elementId, element)
    } else if((args.element as any).propName === 'connectors') {
      this.sharedConnectors!.set(elementId, element)
    }
  }

  onTextChange(args: ITextEditEventArgs): void {
    let element;
    let elementId;
    elementId = (args.element as any)?.id;
    element = cloneObject(args.element)
    if ((args.element as any).propName === 'nodes') {
      (element as NodeModel).annotations[0] = cloneObject(args.annotation) as ShapeAnnotationModel;
      this.sharedNodes!.set(elementId, element);
    } else if ((args.element as any).propName === 'connectors') {
      this.sharedConnectors!.set(elementId, element)
    }
  }

  onPositionChange(args: IDraggingEventArgs): void {
    if (args.state === 'Completed') {
      let element;
      let elementId;
      if ((args.source as any).propName === 'nodes') {
        elementId = (args.source as any)?.id;
        element = cloneObject(args.source);
        this.sharedNodes!.set(elementId, element);
      } else if ((args.source as any).propName === 'selectedItems') {
        const nodes = args.source.nodes;
        nodes.forEach(node => {
          this.sharedNodes!.set(node.id, cloneObject(node));
        })
      }
    }
  }

  onConnectorChange(args: IConnectionChangeEventArgs): void {
    this.sharedConnectors.set(args.connector.id, cloneObject(args.connector));
  }

  onSourcePointChange(args: IEndChangeEventArgs): void {
    this.sharedConnectors.set(args.connector.id, cloneObject(args.connector));
  }

  onTargetPointChange(args: IEndChangeEventArgs): void {
    this.sharedConnectors.set(args.connector.id, cloneObject(args.connector));
  }


  onDeleteElement(args: ICollectionChangeEventArgs): void {
    if (args.type === 'Removal' && args.state === 'Changed') {
      const elementId = (args.element as any)?.properties?.id
      if ((args.element as any).propName === 'nodes') {
        if (this.sharedNodes!.has(elementId)) {
          this.sharedNodes!.delete(elementId);
        }
      } else {
        if (this.sharedConnectors!.has(elementId)) {
          this.sharedConnectors!.delete(elementId);
        }
      }
    }
  }


  ngOnDestroy() {
    // Delete handler registration when the Angular App component is dismounted.
    this.destroyListeners()
  }

  destroyListeners(): void {
    this.sharedNodes!.off("valueChanged", this.updateLocalNodes!);
    this.sharedConnectors!.off("valueChanged", this.updateLocalConnectors!);
  }

  public terminator: FlowShapeModel = { type: 'Flow', shape: 'Terminator' };
  public process: FlowShapeModel = { type: 'Flow', shape: 'Process' };
  public decision: FlowShapeModel = { type: 'Flow', shape: 'Decision' };
  public data: FlowShapeModel = { type: 'Flow', shape: 'Data' };
  public directdata: FlowShapeModel = { type: 'Flow', shape: 'DirectData' };

  public margin: MarginModel = { left: 25, right: 25 };
  public connAnnotStyle: TextStyleModel = { fill: 'white' };
  public strokeStyle: StrokeStyleModel = { strokeDashArray: '2,2' };

  public segments: OrthogonalSegmentModel = [{ type: 'Orthogonal', direction: 'Top', length: 120 }];
  public segments1: OrthogonalSegmentModel = [
    { type: 'Orthogonal', direction: 'Right', length: 100 }
  ];

  public nodeDefaults(node: NodeModel): NodeModel {
    let obj: NodeModel = {};
    if (obj.width === undefined) {
      obj.width = 145;
    } else {
      let ratio: number = 100 / obj.width;
      obj.width = 100;
      obj.height *= ratio;
    }
    obj.style = { fill: '#357BD2', strokeColor: 'white' };
    obj.annotations = [{ style: { color: 'white', fill: 'transparent' } }];
    obj.ports = getPorts(node);
    return obj;
  }
  public connDefaults(obj: Connector): void {
    if (obj.id.indexOf('connector') !== -1) {
      obj.type = 'Orthogonal';
      obj.targetDecorator = { shape: 'Arrow', width: 10, height: 10 };
    }
  }
  public created(): void {
    this.diagram.fitToPage();
  }
  public interval: number[] = [
    1, 9, 0.25, 9.75, 0.25, 9.75, 0.25, 9.75, 0.25, 9.75, 0.25,
    9.75, 0.25, 9.75, 0.25, 9.75, 0.25, 9.75, 0.25, 9.75
  ];

  public snapSettings: SnapSettingsModel = {
    horizontalGridlines: { lineColor: '#e0e0e0', lineIntervals: this.interval },
    verticalGridlines: { lineColor: '#e0e0e0', lineIntervals: this.interval }
  };

  public dragEnter(args: IDragEnterEventArgs): void {
    let obj: NodeModel = args.element as NodeModel;
    if (obj && obj.width && obj.height) {
      let oWidth: number = obj.width;
      let oHeight: number = obj.height;
      let ratio: number = 100 / obj.width;
      obj.width = 100;
      obj.height *= ratio;
      obj.offsetX += (obj.width - oWidth) / 2;
      obj.offsetY += (obj.height - oHeight) / 2;
      obj.style = { fill: '#357BD2', strokeColor: 'white' };
    }
  }

  //SymbolPalette Properties
  public symbolMargin: MarginModel = { left: 15, right: 15, top: 15, bottom: 15 };
  //Initialize the flowshapes for the symbol palatte
  private flowshapes: NodeModel[] = [
    { id: 'Terminator', shape: { type: 'Flow', shape: 'Terminator' } },
    { id: 'Process', shape: { type: 'Flow', shape: 'Process' } },
    { id: 'Decision', shape: { type: 'Flow', shape: 'Decision' } },
    { id: 'Document', shape: { type: 'Flow', shape: 'Document' } },
    { id: 'PreDefinedProcess', shape: { type: 'Flow', shape: 'PreDefinedProcess' } },
    { id: 'PaperTap', shape: { type: 'Flow', shape: 'PaperTap' } },
    { id: 'DirectData', shape: { type: 'Flow', shape: 'DirectData' } },
    { id: 'SequentialData', shape: { type: 'Flow', shape: 'SequentialData' } },
    { id: 'Sort', shape: { type: 'Flow', shape: 'Sort' } },
    { id: 'MultiDocument', shape: { type: 'Flow', shape: 'MultiDocument' } },
    { id: 'Collate', shape: { type: 'Flow', shape: 'Collate' } },
    { id: 'SummingJunction', shape: { type: 'Flow', shape: 'SummingJunction' } },
    { id: 'Or', shape: { type: 'Flow', shape: 'Or' } },
    {
      id: 'InternalStorage',
      shape: { type: 'Flow', shape: 'InternalStorage' }
    },
    { id: 'Extract', shape: { type: 'Flow', shape: 'Extract' } },
    {
      id: 'ManualOperation',
      shape: { type: 'Flow', shape: 'ManualOperation' }
    },
    { id: 'Merge', shape: { type: 'Flow', shape: 'Merge' } },
    {
      id: 'OffPageReference',
      shape: { type: 'Flow', shape: 'OffPageReference' }
    },
    {
      id: 'SequentialAccessStorage',
      shape: { type: 'Flow', shape: 'SequentialAccessStorage' }
    },
    { id: 'Annotation', shape: { type: 'Flow', shape: 'Annotation' } },
    { id: 'Annotation2', shape: { type: 'Flow', shape: 'Annotation2' } },
    { id: 'Data', shape: { type: 'Flow', shape: 'Data' } },
    { id: 'Card', shape: { type: 'Flow', shape: 'Card' } },
    { id: 'Delay', shape: { type: 'Flow', shape: 'Delay' } }
  ];

  //Initializes connector symbols for the symbol palette
  private connectorSymbols: ConnectorModel[] = [
    {
      id: 'Link1',
      type: 'Orthogonal',
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 60, y: 60 },
      targetDecorator: { shape: 'Arrow', style: { strokeColor: '#757575', fill: '#757575' } },
      style: { strokeWidth: 1, strokeColor: '#757575' }
    },
    {
      id: 'link3',
      type: 'Orthogonal',
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 60, y: 60 },
      style: { strokeWidth: 1, strokeColor: '#757575' },
      targetDecorator: { shape: 'None' }
    },
    {
      id: 'Link21',
      type: 'Straight',
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 60, y: 60 },
      targetDecorator: { shape: 'Arrow', style: { strokeColor: '#757575', fill: '#757575' } },
      style: { strokeWidth: 1, strokeColor: '#757575' }
    },
    {
      id: 'link23',
      type: 'Straight',
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 60, y: 60 },
      style: { strokeWidth: 1, strokeColor: '#757575' },
      targetDecorator: { shape: 'None' }
    },
    {
      id: 'link33',
      type: 'Bezier',
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 60, y: 60 },
      style: { strokeWidth: 1, strokeColor: '#757575' },
      targetDecorator: { shape: 'None' }
    }
  ];

  public palettes: PaletteModel[] = [
    {
      id: 'flow',
      expanded: true,
      symbols: this.flowshapes,
      iconCss: 'shapes',
      title: 'Flow Shapes'
    },
    {
      id: 'connectors',
      expanded: true,
      symbols: this.connectorSymbols,
      iconCss: 'shapes',
      title: 'Connectors'
    }
  ];

  public getSymbolInfo(symbol: NodeModel): SymbolInfo {
    return { fit: true };
  }

  public getSymbolDefaults(symbol: NodeModel): void {
    symbol.style.strokeColor = '#757575';
    if (symbol.id === 'Terminator' || symbol.id === 'Process') {
      symbol.width = 80;
      symbol.height = 40;
    } else if (
      symbol.id === 'Decision' ||
      symbol.id === 'Document' ||
      symbol.id === 'PreDefinedProcess' ||
      symbol.id === 'PaperTap' ||
      symbol.id === 'DirectData' ||
      symbol.id === 'MultiDocument' ||
      symbol.id === 'Data'
    ) {
      symbol.width = 50;
      symbol.height = 40;
    } else {
      symbol.width = 50;
      symbol.height = 50;
    }
  }



  public diagramCreate(args: Object): void {
    paletteIconClick();
  }
}

function getPorts(obj: NodeModel): PointPortModel[] {
  let ports: PointPortModel[] = [
    { id: 'port1', shape: 'Circle', offset: { x: 0, y: 0.5 } },
    { id: 'port2', shape: 'Circle', offset: { x: 0.5, y: 1 } },
    { id: 'port3', shape: 'Circle', offset: { x: 1, y: 0.5 } },
    { id: 'port4', shape: 'Circle', offset: { x: 0.5, y: 0 } }
  ];
  return ports;
}
