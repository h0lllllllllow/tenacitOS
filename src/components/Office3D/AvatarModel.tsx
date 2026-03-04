'use client';

import { useGLTF, Sphere } from '@react-three/drei';
import { useEffect, useState } from 'react';
import type { AgentConfig } from './agentsConfig';

interface AvatarModelProps {
  agent: AgentConfig;
  position: [number, number, number];
}

function LoadedAvatar({ modelPath, position }: { modelPath: string; position: [number, number, number] }) {
  const { scene } = useGLTF(modelPath);
  return (
    <primitive
      object={scene.clone()}
      position={position}
      scale={0.8}
      rotation={[0, Math.PI, 0]}
      castShadow
      receiveShadow
    />
  );
}

export default function AvatarModel({ agent, position }: AvatarModelProps) {
  const modelPath = `/models/${agent.id}.glb`;
  const [exists, setExists] = useState(false);

  useEffect(() => {
    fetch(modelPath, { method: 'HEAD' })
      .then((res) => setExists(res.ok))
      .catch(() => setExists(false));
  }, [modelPath]);

  if (!exists) {
    return (
      <Sphere args={[0.3, 16, 16]} position={position} castShadow>
        <meshStandardMaterial color={agent.color} emissive={agent.color} emissiveIntensity={0.3} />
      </Sphere>
    );
  }

  return <LoadedAvatar modelPath={modelPath} position={position} />;
}
