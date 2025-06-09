import { RoomLobby } from '@/components/game/room-lobby';

export default async function RoomPage({
  params,
}: {
  readonly params: Promise<{ readonly code: string }>;
}) {
  const { code } = await params;
  return <RoomLobby roomCode={code} />;
}
