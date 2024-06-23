import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";
import { interactionAtom } from "@/features/admin/store";

export function Tablet({
  children,
  id,
  active,
}: {
  children: React.ReactNode;
  id: string;
  active: boolean;
}) {
  const interactionId = useAtomValue(interactionAtom);

  return (
    <div
      className={clsx(
        "relative size-full rounded-[40px] border-[20px] border-black bg-white/80 transition-[border-color] duration-300 ease-in-out",
        interactionId === id ? "border-yellow-500" : "border-primary",
        active ? "border-pink-500" : ""
      )}
    >
      <div className="size-full rounded-[10px] p-10">{children}</div>
    </div>
  );
}
