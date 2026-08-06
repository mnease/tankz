import { createFileRoute } from "@tanstack/react-router";
import { TankzGame } from "@/game/TankzGame";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <TankzGame />;
}
