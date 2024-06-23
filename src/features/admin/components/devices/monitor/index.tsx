import { useAtomValue } from "jotai";
import React from "react";
import { interactionAtom } from "@/features/admin/store";
import { cn } from "@/lib/utils";

export const Monitor = ({
  children,
  id,
  active,
}: {
  children: React.ReactNode;
  id: string;
  active: boolean;
}) => {
  const interactionId = useAtomValue(interactionAtom);

  return (
    <div
      className={cn(
        "size-full rounded-[40px] border-8 bg-white/80 transition-[border-color] duration-300 ease-in-out",
        interactionId === id ? "border-yellow-500" : "border-primary",
        active ? "border-pink-500" : ""
      )}
    >
      <div className="size-full p-10">{children}</div>
    </div>
  );
};
