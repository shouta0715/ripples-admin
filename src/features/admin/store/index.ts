import {
  Connection,
  Edge,
  Node,
  NodeChange,
  NodePositionChange,
  OnEdgesChange,
  OnNodesChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import { atomWithReset } from "jotai/utils";
import { toast } from "sonner";
import { createStore } from "zustand";
import { EDGE_TYPE } from "@/features/admin/constant";
import { CustomInput, CustomsInput } from "@/features/admin/schema";
import { EdgeData, UserSession } from "@/features/admin/types";
import {
  createEdgeId,
  getEdgeDirection,
  sessionToEdge,
  sessionToNode,
} from "@/features/admin/utils";

export const interactionAtom = atomWithReset<string | null>(null);

export type Mode = "view" | "connect";

export type RFState = {
  // Node
  nodes: Node<UserSession>[];
  onNodesChange: OnNodesChange<Node<UserSession>>;
  setNodes: (cb: (nodes: Node<UserSession>[]) => Node<UserSession>[]) => void;
  updateNode: (id: string, state: Partial<UserSession>) => void;
  onNodesPositionChange: (
    cb: (change: NodePositionChange, _: Node<UserSession>[]) => Promise<void>,
    changes: NodeChange<Node<UserSession>>[]
  ) => void;

  // Edge
  onEdgesChange: OnEdgesChange<Edge<EdgeData>>;
  edges: Edge<EdgeData>[];
  onConnectEdge: (
    cb: (newEdge: Edge<EdgeData>, newEdges: Edge<EdgeData>[]) => Promise<void>,
    params: Connection
  ) => void;
  onDisconnectEdge: (
    cb: (edge: Edge<EdgeData>, newEdges: Edge<EdgeData>[]) => Promise<void>,
    edge: Edge<EdgeData>
  ) => void;

  getNode: (id: string) => Node<UserSession> | undefined;

  // customs
  customs: CustomsInput;
  addCustom: (custom: CustomInput) => void;
  deleteCustom: (key: string) => void;
  updateCustom: (key: string, custom: CustomInput) => void;
};

export const createNodeStore = (
  initialProps: UserSession[],
  initialCustoms: CustomsInput
) => {
  return createStore<RFState>()((set, get) => ({
    // Node
    nodes: sessionToNode(initialProps),
    onNodesChange: (changes: NodeChange<Node<UserSession>>[]) => {
      set((state) => ({
        nodes: applyNodeChanges<Node<UserSession>>(changes, state.nodes),
      }));
    },
    updateNode: (id, state) => {
      set((s) => ({
        nodes: s.nodes.map((node) => {
          if (node.id !== id) return node;

          return {
            ...node,
            data: {
              ...node.data,
              ...state,
            },
          };
        }),
      }));
    },
    setNodes: (cb) => {
      set((state) => {
        const newNodes = cb(state.nodes);

        return {
          nodes: newNodes,
        };
      });
    },
    onNodesPositionChange: async (cb, changes) => {
      const ch = changes[0];
      const { nodes } = get();

      if (ch.type === "position") cb(ch, nodes);

      set((state) => ({
        nodes: applyNodeChanges(changes, state.nodes),
      }));
    },

    getNode: (id) => {
      const { nodes } = get();

      return nodes.find((node) => node.id === id);
    },

    // Edge
    edges: sessionToEdge(initialProps),
    onEdgesChange: (changes) => {
      set((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
      }));
    },
    onConnectEdge: async (cb, params) => {
      if (
        !params.source ||
        !params.target ||
        !params.sourceHandle ||
        !params.targetHandle
      )
        return;

      const splitSourceDirection = params.sourceHandle.split("-").at(-1);
      const splitTargetDirection = params.targetHandle.split("-").at(-1);
      if (!splitSourceDirection || !splitTargetDirection) return;

      const sourceDirection = getEdgeDirection(splitSourceDirection);
      const targetDirection = getEdgeDirection(splitTargetDirection);

      const id = createEdgeId({
        source: params.source,
        target: params.target,
        from: sourceDirection,
        to: targetDirection,
      });

      const alreadyConnected = get().edges.some((edge) => edge.id === id);

      if (alreadyConnected) return;

      const newEdge: Edge<EdgeData> = {
        ...params,
        type: EDGE_TYPE,
        id,
        source: params.source,
        target: params.target,
        targetHandle: params.targetHandle,
        sourceHandle: params.sourceHandle,
        data: {
          from: sourceDirection,
          to: targetDirection,
          source: params.source,
          target: params.target,
        },
      };

      const newEdges = addEdge<Edge<EdgeData>>(newEdge, get().edges);

      set(() => ({
        edges: newEdges,
      }));

      await cb(newEdge, newEdges);
    },
    onDisconnectEdge: async (cb, edge) => {
      if (
        !edge.source ||
        !edge.target ||
        !edge.sourceHandle ||
        !edge.targetHandle
      )
        return;

      const splitSourceDirection = edge.sourceHandle.split("-").at(-1);
      const splitTargetDirection = edge.targetHandle.split("-").at(-1);
      if (!splitSourceDirection || !splitTargetDirection) return;

      const from = getEdgeDirection(splitSourceDirection);
      const to = getEdgeDirection(splitTargetDirection);

      const id = createEdgeId({
        source: edge.source,
        target: edge.target,
        from,
        to,
      });

      const newEdges = get().edges.filter((e) => e.id !== id);

      set(() => ({
        edges: newEdges,
      }));

      const deletedEdge: Edge<EdgeData> = {
        id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: EDGE_TYPE,

        data: {
          from,
          to,
          source: edge.source,
          target: edge.target,
        },
      };

      await cb(deletedEdge, newEdges);
    },

    // customs
    customs: initialCustoms,
    addCustom: (custom) => {
      const isAlreadyExist = get().customs.some((c) => c.key === custom.key);
      if (isAlreadyExist) {
        toast.error("すでに存在するカスタムデータです");

        return;
      }
      set((state) => {
        return {
          customs: [...state.customs, custom],
        };
      });
    },
    deleteCustom: (key) => {
      const newCustoms = get().customs.filter((custom) => custom.key !== key);

      set(() => ({
        customs: newCustoms,
      }));
    },

    updateCustom: (key, custom) => {
      const newCustoms = get().customs.map((c) => {
        if (c.key !== key) return c;

        return custom;
      });

      set(() => ({
        customs: newCustoms,
      }));
    },
  }));
};

export type NodeStore = ReturnType<typeof createNodeStore>;
