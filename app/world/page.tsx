import type { Metadata } from "next";
import FutureproofWorld from "@/components/world/futureproof-world";

export const metadata: Metadata = {
  title: "Futureproof — Fly through the world of AI learning",
  description:
    "Scroll to fly through the Futureproof world: the classroom, the idea garden, the prompt playground, the code workshop, and liftoff.",
};

export default function WorldPage() {
  return <FutureproofWorld />;
}
